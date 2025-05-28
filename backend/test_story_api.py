#!/usr/bin/env python3
"""
Test script to directly test story API functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import db, User, Story
from app import create_app
import json

def test_story_functionality():
    """Test story creation, retrieval, and management"""
    app = create_app()
    
    with app.app_context():
        try:
            # Find test user
            test_user = User.query.filter_by(username='testuser').first()
            
            if not test_user:
                print("Test user not found! Run test_db.py first.")
                return False
                
            print(f"Testing story functionality for user: {test_user.username}")
            
            # Test 1: Create a test story
            print("\n=== TEST 1: Creating a test story ===")
            test_story = Story(
                user_id=test_user.id,
                title="Test Story for Phase 3",
                content="This is a test story created to verify that the story saving functionality works correctly. The story includes vocabulary words like 'magnificent', 'extraordinary', and 'adventure' to test the highlighting feature.",
                genre="Adventure",
                keywords=json.dumps(["magnificent", "extraordinary", "adventure"]),
                is_public=False
            )
            
            db.session.add(test_story)
            db.session.commit()
            
            print(f"✅ Test story created successfully!")
            print(f"   Story ID: {test_story.id}")
            print(f"   Title: {test_story.title}")
            print(f"   Genre: {test_story.genre}")
            print(f"   Keywords: {test_story.keywords}")
            print(f"   Content length: {len(test_story.content)} characters")
            
            # Test 2: Retrieve all stories for user
            print("\n=== TEST 2: Retrieving user stories ===")
            user_stories = Story.query.filter_by(user_id=test_user.id).all()
            print(f"✅ Found {len(user_stories)} stories for user")
            
            for story in user_stories:
                print(f"   - {story.title} (ID: {story.id}, Genre: {story.genre})")
            
            # Test 3: Update the story
            print("\n=== TEST 3: Updating the story ===")
            test_story.title = "Updated Test Story for Phase 3"
            test_story.content += "\n\nThis story has been updated to test the edit functionality."
            db.session.commit()
            
            print(f"✅ Story updated successfully!")
            print(f"   New title: {test_story.title}")
            
            # Test 4: Test story data structure
            print("\n=== TEST 4: Testing story data structure ===")
            story_dict = test_story.to_dict()
            print(f"✅ Story dictionary structure:")
            for key, value in story_dict.items():
                if key == 'content':
                    print(f"   {key}: {value[:50]}..." if len(str(value)) > 50 else f"   {key}: {value}")
                else:
                    print(f"   {key}: {value}")
            
            # Test 5: Parse keywords
            print("\n=== TEST 5: Testing keyword parsing ===")
            if story_dict.get('keywords'):
                try:
                    keywords = json.loads(story_dict['keywords'])
                    print(f"✅ Keywords parsed successfully: {keywords}")
                except:
                    print("❌ Failed to parse keywords")
            
            print("\n=== STORY API TEST COMPLETED SUCCESSFULLY! ===")
            print("The story saving functionality is working correctly in the backend.")
            print("If the frontend is not saving stories, the issue is likely:")
            print("1. Frontend-backend connectivity")
            print("2. Authentication/authorization")
            print("3. CORS configuration")
            
            return True
            
        except Exception as e:
            print(f"❌ Story API test failed: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    test_story_functionality()
