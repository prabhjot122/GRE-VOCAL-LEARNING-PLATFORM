#!/usr/bin/env python3
"""
Simple test script to verify the add word functionality works correctly
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"

def test_add_word():
    """Test adding a word to a library"""
    
    # First, login to get a token
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    print("1. Logging in...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    login_result = login_response.json()
    if not login_result.get('success'):
        print(f"Login failed: {login_result.get('error')}")
        return False
    
    token = login_result['data']['access_token']
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("2. Getting libraries...")
    libraries_response = requests.get(f"{BASE_URL}/libraries", headers=headers)
    
    if libraries_response.status_code != 200:
        print(f"Failed to get libraries: {libraries_response.status_code}")
        print(libraries_response.text)
        return False
    
    libraries_result = libraries_response.json()
    if not libraries_result.get('success'):
        print(f"Failed to get libraries: {libraries_result.get('error')}")
        return False
    
    libraries = libraries_result['data']['libraries']
    if not libraries:
        print("No libraries found")
        return False
    
    # Use the first library (should be master library)
    library_id = libraries[0]['id']
    print(f"Using library ID: {library_id}")
    
    # Test word data (simplified format)
    word_data = {
        "word": "testword",
        "meaning": "a word used for testing",
        "library_id": library_id
    }
    
    print("3. Adding word...")
    add_word_response = requests.post(f"{BASE_URL}/words", json=word_data, headers=headers)
    
    print(f"Response status: {add_word_response.status_code}")
    print(f"Response body: {add_word_response.text}")
    
    if add_word_response.status_code == 201:
        result = add_word_response.json()
        if result.get('success'):
            print("✓ Word added successfully!")
            return True
        else:
            print(f"✗ Word addition failed: {result.get('error')}")
            return False
    else:
        print(f"✗ Word addition failed with status {add_word_response.status_code}")
        return False

if __name__ == "__main__":
    success = test_add_word()
    if success:
        print("\n✓ Test passed!")
    else:
        print("\n✗ Test failed!")
