#!/usr/bin/env python3
"""
Test pagination functionality specifically
"""

import requests
import time

BASE_URL = "http://localhost:5000"

def test_pagination():
    """Test pagination functionality"""
    print("=== Testing Pagination ===")
    
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
    
    # Test different pages
    pages_to_test = [1, 2, 3, 10, 54]  # Last page should be 54 based on 5337 words / 100 per page
    
    for page in pages_to_test:
        print(f"\n--- Testing Page {page} ---")
        
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/libraries/1",
            headers=headers,
            params={"per_page": 100, "page": page}
        )
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            library = data['data']['library']
            words_count = len(library['words'])
            pagination = library['pagination']
            
            print(f"✓ Response time: {end_time - start_time:.3f} seconds")
            print(f"✓ Words on page: {words_count}")
            print(f"✓ Current page: {pagination['page']}")
            print(f"✓ Total pages: {pagination['pages']}")
            print(f"✓ Has previous: {pagination['has_prev']}")
            print(f"✓ Has next: {pagination['has_next']}")
            
            if words_count > 0:
                first_word = library['words'][0]['word']
                last_word = library['words'][-1]['word']
                print(f"✓ First word: {first_word}")
                print(f"✓ Last word: {last_word}")
        else:
            print(f"✗ Error: {response.status_code} - {response.text}")

if __name__ == '__main__':
    test_pagination()
