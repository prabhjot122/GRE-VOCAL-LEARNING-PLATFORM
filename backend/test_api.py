#!/usr/bin/env python3
"""
Test API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_login():
    """Test login endpoint"""
    print("=== Testing Login ===")

    login_data = {
        "username_or_email": "demo",
        "password": "demo123"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                token = data.get('data', {}).get('access_token')
                print(f"Login successful! Token: {token[:50]}..." if token else "No token received")
                return token
            else:
                print(f"Login failed: {data.get('error')}")
        else:
            print(f"HTTP Error: {response.status_code}")

    except Exception as e:
        print(f"Error: {e}")

    return None

def test_libraries(token):
    """Test libraries endpoint"""
    print("\n=== Testing Libraries ===")

    if not token:
        print("No token available")
        return

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        response = requests.get(
            f"{BASE_URL}/api/libraries",
            headers=headers
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                libraries = data.get('data', {}).get('libraries', [])
                print(f"Found {len(libraries)} libraries")
                for lib in libraries:
                    print(f"  - {lib.get('name')} (ID: {lib.get('id')}, Master: {lib.get('is_master')})")
                return libraries
            else:
                print(f"Failed: {data.get('error')}")
        else:
            print(f"HTTP Error: {response.status_code}")

    except Exception as e:
        print(f"Error: {e}")

    return []

def test_library_words(token, library_id):
    """Test library words endpoint"""
    print(f"\n=== Testing Library {library_id} Words ===")

    if not token:
        print("No token available")
        return

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        response = requests.get(
            f"{BASE_URL}/api/libraries/{library_id}",
            headers=headers
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                library = data.get('data', {}).get('library', {})
                words = library.get('words', [])
                print(f"Library: {library.get('name')}")
                print(f"Found {len(words)} words")

                # Show first 5 words
                for i, word in enumerate(words[:5]):
                    print(f"  {i+1}. {word.get('word')}: {word.get('meaning')}")

                if len(words) > 5:
                    print(f"  ... and {len(words) - 5} more words")

            else:
                print(f"Failed: {data.get('error')}")
        else:
            print(f"HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

def main():
    print("Testing GRE Vocabulary API")

    # Test login
    token = test_login()

    if token:
        # Test libraries
        libraries = test_libraries(token)

        # Test library words for first library
        if libraries:
            first_library_id = libraries[0].get('id')
            test_library_words(token, first_library_id)

if __name__ == '__main__':
    main()
