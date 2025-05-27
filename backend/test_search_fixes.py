#!/usr/bin/env python3
"""
Test the search fixes
"""

import requests

BASE_URL = "http://localhost:5000"

def test_search_fixes():
    """Test both search fixes"""
    print("=== Testing Search Fixes ===")
    
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
    
    # Test 1: Library search with "aberration"
    print("\n--- Test 1: Library Search for 'aberration' ---")
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={
        "search": "aberration",
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
            print(f"   Words returned on this page: {len(words)}")
            
            if words:
                print(f"   Results:")
                for i, word in enumerate(words, 1):
                    print(f"     {i}. {word['word']} - {word['meaning'][:50]}...")
                
                # Check if aberration is in the results
                aberration_found = any('aberration' in word['word'].lower() for word in words)
                print(f"   ✅ 'aberration' found in results: {aberration_found}")
            else:
                print("   ❌ No words returned")
        else:
            print(f"❌ Library search failed: {data.get('error', 'Unknown error')}")
    else:
        print(f"❌ Library search API failed: {response.status_code}")
    
    # Test 2: Home page search API
    print("\n--- Test 2: Home Page Search API for 'aberration' ---")
    response = requests.get(f"{BASE_URL}/api/words/search", headers=headers, params={
        "q": "aberration",
        "library_id": 1
    })
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            results = data['data']
            print(f"✅ Home page search successful")
            print(f"   Results found: {len(results)}")
            
            if results:
                print(f"   Results:")
                for i, word in enumerate(results, 1):
                    print(f"     {i}. {word['word']} - {word['meaning'][:50]}...")
                
                # Check if aberration is in the results
                aberration_found = any('aberration' in word['word'].lower() for word in results)
                print(f"   ✅ 'aberration' found in results: {aberration_found}")
            else:
                print("   ❌ No results found")
        else:
            print(f"❌ Home page search failed: {data.get('error', 'Unknown error')}")
    else:
        print(f"❌ Home page search API failed: {response.status_code}")
    
    # Test 3: Test different search terms
    print("\n--- Test 3: Testing Different Search Terms ---")
    test_terms = ["test", "meaning", "definition", "xyz123"]
    
    for term in test_terms:
        print(f"\n🔍 Testing term: '{term}'")
        
        # Library search
        response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={
            "search": term,
            "page": 1,
            "per_page": 5
        })
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                library = data['data']['library']
                words = library['words']
                pagination = library.get('pagination', {})
                print(f"   Library: {pagination.get('total', 0)} total, {len(words)} returned")
            else:
                print(f"   Library: Failed - {data.get('error', 'Unknown error')}")
        else:
            print(f"   Library: API Error {response.status_code}")
        
        # Home page search
        response = requests.get(f"{BASE_URL}/api/words/search", headers=headers, params={
            "q": term,
            "library_id": 1
        })
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                results = data['data']
                print(f"   Home page: {len(results)} results")
            else:
                print(f"   Home page: Failed - {data.get('error', 'Unknown error')}")
        else:
            print(f"   Home page: API Error {response.status_code}")
    
    print("\n=== Search Fix Tests Completed ===")

if __name__ == '__main__':
    test_search_fixes()
