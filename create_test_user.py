#!/usr/bin/env python3
"""
Create a test user for Phase 3 testing
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def create_test_user():
    """Create a test user"""
    print("Creating test user...")
    
    # Register test user
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "confirm_password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    print(f"Registration Status: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ Test user created successfully")
        return True
    elif response.status_code == 409:
        print("ℹ️  Test user already exists")
        return True
    else:
        print(f"❌ Failed to create test user: {response.text}")
        return False

def test_login():
    """Test login with the test user"""
    print("Testing login...")
    
    login_data = {
        "username_or_email": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Login successful")
        return True
    else:
        print(f"❌ Login failed: {response.text}")
        return False

if __name__ == "__main__":
    if create_test_user() and test_login():
        print("🎉 Test user setup complete!")
    else:
        print("❌ Test user setup failed!")
