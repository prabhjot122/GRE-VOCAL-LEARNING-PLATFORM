#!/usr/bin/env python3
"""
Generate a test access token for the test user
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import db, User
from app import create_app
from flask_jwt_extended import create_access_token, create_refresh_token

def generate_test_token():
    """Generate access token for test user"""
    app = create_app()
    
    with app.app_context():
        try:
            # Find test user
            test_user = User.query.filter_by(username='testuser').first()
            
            if not test_user:
                print("Test user not found! Run test_db.py first.")
                return None
                
            print(f"Generating token for user: {test_user.username}")
            print(f"User ID: {test_user.id}, Public ID: {test_user.public_id}")
            
            # Generate tokens
            access_token = create_access_token(identity=test_user.public_id)
            refresh_token = create_refresh_token(identity=test_user.public_id)
            
            print("\n=== TOKENS GENERATED ===")
            print(f"Access Token: {access_token}")
            print(f"Refresh Token: {refresh_token}")
            
            print("\n=== JAVASCRIPT TO SET TOKENS ===")
            print("Copy and paste this in browser console:")
            print(f"localStorage.setItem('access_token', '{access_token}');")
            print(f"localStorage.setItem('refresh_token', '{refresh_token}');")
            print("console.log('Tokens set! Refresh the page.');")
            
            return access_token, refresh_token
            
        except Exception as e:
            print(f"Token generation failed: {e}")
            return None

if __name__ == '__main__':
    generate_test_token()
