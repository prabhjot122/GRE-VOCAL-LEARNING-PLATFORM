#!/usr/bin/env python3
"""
Debug the API response to see what's actually being returned
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def debug_api():
    """Debug the API response"""
    print("=== Debugging API Response ===")
    
    # Login first
    login_data = {
        "username_or_email": "demo",
        "password": "demo123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print("Login failed!")
        return
    
    token = response.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get first page
    response = requests.get(
        f"{BASE_URL}/api/libraries/1",
        headers=headers,
        params={"per_page": 5, "page": 1}  # Just get 5 words to debug
    )
    
    if response.status_code == 200:
        data = response.json()
        library = data['data']['library']
        words = library['words']
        
        print(f"✓ Got {len(words)} words from API")
        print("\nFirst 5 words from API:")
        
        for i, word in enumerate(words, 1):
            print(f"\n{i}. Word ID: {word.get('id')}")
            print(f"   Word: '{word.get('word')}'")
            print(f"   Meaning: '{word.get('meaning')[:100]}...'")
            print(f"   Is HTML?: {'<' in word.get('word', '') or '>' in word.get('word', '')}")
    else:
        print(f"✗ API Error: {response.status_code}")
        print(response.text)

if __name__ == '__main__':
    debug_api()
