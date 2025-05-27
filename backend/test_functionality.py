#!/usr/bin/env python3
"""
Comprehensive testing script for all interactive elements
"""

import requests
import json
import time

BASE_URL = 'http://localhost:5000/api'

def test_auth():
    """Test authentication functionality"""
    print("🔐 Testing Authentication...")
    
    # Test login
    login_data = {
        'username_or_email': 'testuser',
        'password': 'TestPass123'
    }
    
    response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data['data']['access_token']
        print("✅ Login successful")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_libraries(token):
    """Test library management functionality"""
    print("\n📚 Testing Library Management...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Test get libraries
    response = requests.get(f'{BASE_URL}/libraries', headers=headers)
    print(f"Get Libraries Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        libraries = data['data']['libraries']
        print(f"✅ Found {len(libraries)} libraries")
        
        for lib in libraries:
            print(f"  - {lib['name']}: {lib['word_count']} words ({lib['learned_count']} learned)")
            if 'words' in lib and len(lib['words']) > 0:
                print(f"    Sample words: {[w['word'] for w in lib['words'][:3]]}")
        
        return libraries
    else:
        print(f"❌ Get libraries failed: {response.text}")
        return []

def test_create_library(token):
    """Test creating a new library"""
    print("\n➕ Testing Library Creation...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    library_data = {
        'name': 'Test Library',
        'description': 'A test library for functionality testing'
    }
    
    response = requests.post(f'{BASE_URL}/libraries', json=library_data, headers=headers)
    print(f"Create Library Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        library_id = data['data']['library']['id']
        print(f"✅ Library created with ID: {library_id}")
        return library_id
    else:
        print(f"❌ Create library failed: {response.text}")
        return None

def test_add_word(token, library_id):
    """Test adding a word to library"""
    print("\n📝 Testing Word Addition...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    word_data = {
        'library_id': library_id,
        'word': 'serendipity',
        'meaning': 'A pleasant surprise or fortunate accident',
        'pronunciation': '/ˌserənˈdɪpəti/',
        'synonym': 'fortuity',
        'antonym': 'misfortune',
        'example': 'Finding that book was pure serendipity.',
        'difficulty': 'medium'
    }
    
    response = requests.post(f'{BASE_URL}/words', json=word_data, headers=headers)
    print(f"Add Word Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        word_id = data['data']['word']['id']
        print(f"✅ Word added with ID: {word_id}")
        return word_id
    else:
        print(f"❌ Add word failed: {response.text}")
        return None

def test_word_actions(token, word_id, library_id):
    """Test word learning actions"""
    print("\n🎯 Testing Word Actions...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Test mark as learned
    learn_data = {'library_id': library_id}
    response = requests.post(f'{BASE_URL}/words/{word_id}/learn', json=learn_data, headers=headers)
    print(f"Mark as Learned Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Word marked as learned")
    else:
        print(f"❌ Mark as learned failed: {response.text}")
    
    # Test mark as unlearned
    response = requests.post(f'{BASE_URL}/words/{word_id}/unlearn', json=learn_data, headers=headers)
    print(f"Mark as Unlearned Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Word marked as unlearned")
    else:
        print(f"❌ Mark as unlearned failed: {response.text}")

def test_csv_upload(token, library_id):
    """Test CSV upload functionality"""
    print("\n📄 Testing CSV Upload...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create a test CSV content
    csv_content = """word,meaning,pronunciation,synonym,antonym,example,difficulty
ephemeral,Lasting for a short time,/əˈfemərəl/,temporary,permanent,The beauty of cherry blossoms is ephemeral,medium
ubiquitous,Present everywhere,/yuˈbɪkwətəs/,omnipresent,rare,Smartphones are ubiquitous in modern society,hard"""
    
    files = {'file': ('test_words.csv', csv_content, 'text/csv')}
    
    response = requests.post(f'{BASE_URL}/libraries/{library_id}/upload-csv', files=files, headers=headers)
    print(f"CSV Upload Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ CSV uploaded: {data['data']['words_added']} words added")
    else:
        print(f"❌ CSV upload failed: {response.text}")

def test_delete_library(token, library_id):
    """Test deleting a library"""
    print("\n🗑️ Testing Library Deletion...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    response = requests.delete(f'{BASE_URL}/libraries/{library_id}', headers=headers)
    print(f"Delete Library Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Library deleted successfully")
    else:
        print(f"❌ Delete library failed: {response.text}")

def main():
    """Run comprehensive tests"""
    print("🚀 Starting Comprehensive Functionality Tests\n")
    
    # Test authentication
    token = test_auth()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    # Test library management
    libraries = test_libraries(token)
    
    # Test creating a new library
    library_id = test_create_library(token)
    if not library_id:
        print("❌ Cannot proceed without creating a library")
        return
    
    # Test adding a word
    word_id = test_add_word(token, library_id)
    if word_id:
        # Test word actions
        test_word_actions(token, word_id, library_id)
    
    # Test CSV upload
    test_csv_upload(token, library_id)
    
    # Test final library state
    print("\n📊 Final Library State:")
    test_libraries(token)
    
    # Clean up - delete test library
    test_delete_library(token, library_id)
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main()
