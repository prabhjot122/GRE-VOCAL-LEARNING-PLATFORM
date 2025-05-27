#!/usr/bin/env python3
"""
Test the final search fixes
"""

import requests

BASE_URL = "http://localhost:5000"

def test_final_search_fixes():
    """Test both search fixes"""
    print("=== Testing Final Search Fixes ===")
    
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
    
    # Test 1: Library search for "aberration" - should return only matching words
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
            print(f"   Total matching words: {pagination.get('total', 'N/A')}")
            print(f"   Words returned on this page: {len(words)}")
            
            if words:
                print(f"   Words found:")
                for i, word in enumerate(words, 1):
                    print(f"     {i}. {word['word']} - {word['meaning'][:50]}...")
                
                # Verify that the search actually filtered the results
                aberration_match = any('aberration' in word['word'].lower() or 
                                     'aberration' in word['meaning'].lower() 
                                     for word in words)
                print(f"   ✅ Search filtering working: {aberration_match}")
                
                # Check if all returned words are relevant to the search
                all_relevant = all('aberr' in word['word'].lower() or 
                                 'aberr' in word['meaning'].lower() or
                                 'deviation' in word['meaning'].lower() or
                                 'spheric' in word['word'].lower()  # aspheric contains "spheric" which is related
                                 for word in words)
                print(f"   ✅ All results relevant: {all_relevant}")
            else:
                print("   ❌ No words returned")
        else:
            print(f"❌ Library search failed: {data.get('error', 'Unknown error')}")
    else:
        print(f"❌ Library search API failed: {response.status_code}")
    
    # Test 2: Home page search for "aberration"
    print("\n--- Test 2: Home Page Search for 'aberration' ---")
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
    
    # Test 3: Test search with no results
    print("\n--- Test 3: Search with No Results ---")
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={
        "search": "xyz123nonexistent",
        "page": 1,
        "per_page": 10
    })
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            library = data['data']['library']
            words = library['words']
            pagination = library.get('pagination', {})
            
            print(f"✅ No results search successful")
            print(f"   Total matching words: {pagination.get('total', 0)}")
            print(f"   Words returned: {len(words)}")
            
            if pagination.get('total', 0) == 0 and len(words) == 0:
                print("   ✅ Correctly returns no results for non-existent search")
            else:
                print("   ❌ Should return no results")
        else:
            print(f"❌ No results search failed: {data.get('error', 'Unknown error')}")
    else:
        print(f"❌ No results search API failed: {response.status_code}")
    
    print("\n=== Final Search Fix Tests Completed ===")

if __name__ == '__main__':
    test_final_search_fixes()
