#!/usr/bin/env python3
"""
Debug authentication issues
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_registration():
    """Test user registration with a new user"""
    print("Testing registration with new user...")
    
    # Try with a different username
    register_data = {
        "username": "phase3user",
        "email": "phase3@example.com", 
        "password": "phase3pass123",
        "confirm_password": "phase3pass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    print(f"Registration Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ New user registered successfully")
        return True
    else:
        print(f"❌ Registration failed")
        return False

def test_login_new_user():
    """Test login with new user"""
    print("Testing login with new user...")
    
    login_data = {
        "username_or_email": "phase3user",
        "password": "phase3pass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('data', {}).get('access_token')
        print("✅ Login successful")
        print(f"Token received: {token[:50]}..." if token else "No token")
        return token
    else:
        print(f"❌ Login failed")
        return None

if __name__ == "__main__":
    if test_registration():
        token = test_login_new_user()
        if token:
            print("🎉 Authentication working correctly!")
        else:
            print("❌ Login failed after registration")
    else:
        print("❌ Registration failed")
