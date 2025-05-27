#!/usr/bin/env python3
"""
Test API performance with different page sizes
"""

import requests
import time
import json

BASE_URL = "http://localhost:5000"

def test_performance():
    """Test API performance with different configurations"""
    print("=== Performance Testing ===")
    
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
    
    # Test different page sizes
    test_cases = [
        {"per_page": 50, "description": "50 words per page"},
        {"per_page": 100, "description": "100 words per page (default)"},
        {"per_page": 200, "description": "200 words per page"},
        {"per_page": 500, "description": "500 words per page (max)"},
    ]
    
    for test_case in test_cases:
        print(f"\n--- Testing: {test_case['description']} ---")
        
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/api/libraries/1",
            headers=headers,
            params={"per_page": test_case["per_page"], "page": 1}
        )
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            library = data['data']['library']
            words_count = len(library['words'])
            pagination = library['pagination']
            
            print(f"✓ Response time: {end_time - start_time:.3f} seconds")
            print(f"✓ Words loaded: {words_count}")
            print(f"✓ Total words: {pagination['total']}")
            print(f"✓ Total pages: {pagination['pages']}")
            print(f"✓ Has next: {pagination['has_next']}")
        else:
            print(f"✗ Error: {response.status_code}")
    
    # Test search performance
    print(f"\n--- Testing: Search Performance ---")
    start_time = time.time()
    response = requests.get(
        f"{BASE_URL}/api/libraries/1",
        headers=headers,
        params={"per_page": 100, "search": "abandon"}
    )
    end_time = time.time()
    
    if response.status_code == 200:
        data = response.json()
        library = data['data']['library']
        words_count = len(library['words'])
        
        print(f"✓ Search response time: {end_time - start_time:.3f} seconds")
        print(f"✓ Search results: {words_count} words")
        print(f"✓ First result: {library['words'][0]['word'] if words_count > 0 else 'None'}")
    else:
        print(f"✗ Search error: {response.status_code}")

if __name__ == '__main__':
    test_performance()
