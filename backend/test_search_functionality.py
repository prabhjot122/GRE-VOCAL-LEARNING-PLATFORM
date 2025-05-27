#!/usr/bin/env python3
"""
Test search functionality across all pages
"""

import requests
import time

BASE_URL = "http://localhost:5000"

def test_search_functionality():
    """Test search functionality"""
    print("=== Testing Search Functionality ===")
    
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
    
    # Test 1: Search API endpoint
    print("\n--- Test 1: Search API Endpoint ---")
    search_queries = ["aberr", "meaning", "test", "xyz123"]
    
    for query in search_queries:
        print(f"\n🔍 Testing search query: '{query}'")
        response = requests.get(f"{BASE_URL}/api/words/search", headers=headers, params={"q": query, "library_id": 1})
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                results = data['data']
                print(f"✅ Search successful: {len(results)} results found")
                if results:
                    print(f"   First result: {results[0]['word']} - {results[0]['meaning'][:50]}...")
                else:
                    print("   No results found")
            else:
                print(f"❌ Search failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Search API failed: {response.status_code}")
            print(f"   Response: {response.text}")
    
    # Test 2: Library search with pagination
    print("\n--- Test 2: Library Search with Pagination ---")
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={
        "search": "test",
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
            print(f"   Words found: {len(words)}")
            print(f"   Total results: {pagination.get('total', 'N/A')}")
            print(f"   Current page: {pagination.get('page', 'N/A')}")
            
            if words:
                print(f"   Sample result: {words[0]['word']} - {words[0]['meaning'][:50]}...")
        else:
            print(f"❌ Library search failed: {data.get('error', 'Unknown error')}")
    else:
        print(f"❌ Library search API failed: {response.status_code}")
    
    # Test 3: Search with different parameters
    print("\n--- Test 3: Search with Different Parameters ---")
    test_cases = [
        {"q": "aberr", "library_id": 1},
        {"q": "definition", "library_id": 1},
        {"q": "nonexistent", "library_id": 1},
        {"q": "test"},  # Without library_id
    ]
    
    for i, params in enumerate(test_cases, 1):
        print(f"\n   Test case {i}: {params}")
        response = requests.get(f"{BASE_URL}/api/words/search", headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                results = data['data']
                print(f"   ✅ Success: {len(results)} results")
            else:
                print(f"   ❌ Failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"   ❌ API Error: {response.status_code}")
    
    print("\n=== Search Tests Completed ===")

if __name__ == '__main__':
    test_search_functionality()
