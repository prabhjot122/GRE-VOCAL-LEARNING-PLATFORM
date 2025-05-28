#!/usr/bin/env python3
"""
Simple script to test database connectivity and create a test user
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import db, User, Library
from app import create_app

def test_database():
    """Test database connectivity and create test user"""
    app = create_app()
    
    with app.app_context():
        try:
            # Test database connection
            print("Testing database connection...")
            users = User.query.all()
            print(f"Found {len(users)} users in database")
            
            # Check if test user exists
            test_user = User.query.filter_by(username='testuser').first()
            
            if test_user:
                print(f"Test user already exists: {test_user.username} ({test_user.email})")
                print(f"User ID: {test_user.id}, Public ID: {test_user.public_id}")
                
                # Check user's libraries
                libraries = Library.query.filter_by(user_id=test_user.id).all()
                print(f"User has {len(libraries)} libraries")
                for lib in libraries:
                    print(f"  - {lib.name} (ID: {lib.id}, Master: {lib.is_master})")
                    
            else:
                print("Creating test user...")
                
                # Create test user
                test_user = User(
                    username='testuser',
                    email='test@example.com'
                )
                test_user.set_password('password123')
                
                db.session.add(test_user)
                db.session.commit()
                
                print(f"Test user created: {test_user.username}")
                print(f"User ID: {test_user.id}, Public ID: {test_user.public_id}")
                
                # Create master library
                master_library = Library(
                    user_id=test_user.id,
                    name='Master Library',
                    description='Test user master library',
                    is_master=True
                )
                db.session.add(master_library)
                db.session.commit()
                
                print(f"Master library created: {master_library.name} (ID: {master_library.id})")
                
            print("Database test completed successfully!")
            return True
            
        except Exception as e:
            print(f"Database test failed: {e}")
            return False

if __name__ == '__main__':
    test_database()
