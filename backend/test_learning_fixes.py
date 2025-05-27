#!/usr/bin/env python3
"""
Test the learning fixes for flashcards and word of the day
"""

import requests
import time

BASE_URL = "http://localhost:5000"

def test_learning_fixes():
    """Test all the learning-related fixes"""
    print("=== Testing Learning Fixes ===")
    
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
    
    # Test 1: Check library has words for flashcards
    print("\n--- Test 1: Library Words for Flashcards ---")
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={"per_page": 10})
    
    if response.status_code == 200:
        data = response.json()
        library = data['data']['library']
        words = library['words']
        
        print(f"✅ Library loaded: {library['name']}")
        print(f"✅ Total words: {library['word_count']}")
        print(f"✅ Learned words: {library['learned_count']}")
        print(f"✅ Unlearned words: {library['unlearned_count']}")
        print(f"✅ Words in response: {len(words)}")
        
        if len(words) > 0:
            print(f"✅ First word: {words[0]['word']} - {words[0]['meaning'][:50]}...")
            print(f"✅ Word learned status: {words[0]['is_learned']}")
        
        # Check if we have both learned and unlearned words for different modes
        learned_words = [w for w in words if w['is_learned']]
        unlearned_words = [w for w in words if not w['is_learned']]
        
        print(f"✅ Learned words in sample: {len(learned_words)}")
        print(f"✅ Unlearned words in sample: {len(unlearned_words)}")
        
    else:
        print(f"❌ Failed to get library: {response.status_code}")
    
    # Test 2: Word of the Day API
    print("\n--- Test 2: Word of the Day API ---")
    response = requests.get(f"{BASE_URL}/api/words/word-of-the-day", headers=headers, params={"library_id": 1})
    
    if response.status_code == 200:
        data = response.json()
        if data['success'] and data['data']:
            word = data['data'][0]
            print(f"✅ Word of the Day: {word['word']}")
            print(f"✅ Meaning: {word['meaning'][:100]}...")
            print(f"✅ Is learned: {word['is_learned']}")
        else:
            print("❌ No word of the day returned")
    else:
        print(f"❌ Word of the Day API failed: {response.status_code}")
    
    # Test 3: Random Unlearned Words API (for recommendations)
    print("\n--- Test 3: Random Unlearned Words API ---")
    response = requests.get(f"{BASE_URL}/api/words/random-unlearned", headers=headers, params={"count": 4, "library_id": 1})
    
    if response.status_code == 200:
        data = response.json()
        if data['success'] and data['data']:
            words = data['data']
            print(f"✅ Random unlearned words: {len(words)}")
            for i, word in enumerate(words, 1):
                print(f"  {i}. {word['word']}: {word['meaning'][:50]}...")
        else:
            print("❌ No random words returned")
    else:
        print(f"❌ Random words API failed: {response.status_code}")
    
    # Test 4: Mark word as learned
    print("\n--- Test 4: Mark Word as Learned ---")
    # Get a word first
    response = requests.get(f"{BASE_URL}/api/libraries/1", headers=headers, params={"per_page": 1})
    if response.status_code == 200:
        data = response.json()
        words = data['data']['library']['words']
        if words:
            word = words[0]
            word_id = word['id']
            
            # Mark as learned
            response = requests.post(f"{BASE_URL}/api/words/{word_id}/learned", headers=headers, json={"library_id": 1})
            if response.status_code == 200:
                print(f"✅ Successfully marked '{word['word']}' as learned")
            else:
                print(f"❌ Failed to mark word as learned: {response.status_code}")
    
    print("\n=== All Tests Completed ===")

if __name__ == '__main__':
    test_learning_fixes()
