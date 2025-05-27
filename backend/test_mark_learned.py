#!/usr/bin/env python3
"""
Test marking word as learned specifically
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_mark_learned():
    """Test marking word as learned"""
    print("=== Testing Mark Word as Learned ===")
    
    # Login first
    login_data = {
        "username_or_email": "demo",
        "password": "demo123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Login failed!")
        return
    
    token = response.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Get a word first
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={"per_page": 1})
    if response.status_code != 200:
        print("❌ Failed to get library")
        return
    
    data = response.json()
    words = data['data']['library']['words']
    if not words:
        print("❌ No words found")
        return
    
    word = words[0]
    word_id = word['id']
    
    print(f"📝 Testing with word: {word['word']} (ID: {word_id})")
    
    # Test different endpoints
    endpoints_to_test = [
        f"/api/words/{word_id}/learned",
        f"/api/words/{word_id}/learn"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"\n--- Testing endpoint: {endpoint} ---")
        
        # Test with library_id in body
        response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json={"library_id": 1})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Success!")
            break
        else:
            print("❌ Failed")

if __name__ == '__main__':
    test_mark_learned()
