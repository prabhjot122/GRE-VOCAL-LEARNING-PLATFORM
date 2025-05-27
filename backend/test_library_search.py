#!/usr/bin/env python3
"""
Test library search specifically
"""

import requests

BASE_URL = "http://localhost:5000"

def test_library_search():
    """Test library search functionality"""
    print("=== Testing Library Search ===")
    
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
    
    # Test library search with different queries
    test_queries = ["aberration", "aberr", "test", "meaning"]
    
    for query in test_queries:
        print(f"\n--- Testing search query: '{query}' ---")
        
        # Test library endpoint with search
        response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={
            "search": query,
            "page": 1,
            "per_page": 10
        })
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                library = data['data']['library']
                words = library['words']
                pagination = library.get('pagination', {})
                
                print(f"✅ Library search successful")
                print(f"   Total results: {pagination.get('total', 'N/A')}")
                print(f"   Words returned: {len(words)}")
                print(f"   Current page: {pagination.get('page', 'N/A')}")
                
                if words:
                    print(f"   First result: {words[0]['word']} - {words[0]['meaning'][:50]}...")
                    # Check if the search query is actually in the results
                    found_match = any(query.lower() in word['word'].lower() or 
                                    query.lower() in word['meaning'].lower() 
                                    for word in words)
                    print(f"   Query match found: {'✅' if found_match else '❌'}")
                else:
                    print("   No words returned")
            else:
                print(f"❌ Library search failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Library search API failed: {response.status_code}")
            print(f"   Response: {response.text}")
    
    # Test without search to see total count
    print(f"\n--- Testing without search (total count) ---")
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={
        "page": 1,
        "per_page": 10
    })
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            library = data['data']['library']
            pagination = library.get('pagination', {})
            print(f"✅ Total words in library: {pagination.get('total', 'N/A')}")
        else:
            print(f"❌ Failed: {data.get('error', 'Unknown error')}")
    else:
        print(f"❌ API failed: {response.status_code}")

if __name__ == '__main__':
    test_library_search()
