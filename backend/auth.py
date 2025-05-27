from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from models import User, db

def token_required(f):
    """Decorator to require valid JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.query.filter_by(public_id=current_user_id).first()
            
            if not current_user:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 401
                
            if not current_user.is_active:
                return jsonify({
                    'success': False,
                    'error': 'Account is deactivated'
                }), 401
                
            return f(current_user, *args, **kwargs)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Token is invalid or expired'
            }), 401
            
    return decorated

def get_current_user():
    """Get current user from JWT token"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(public_id=current_user_id).first()
        return current_user
    except:
        return None

def validate_user_input(data, required_fields):
    """Validate user input data"""
    errors = []
    
    # Check for required fields
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    if errors:
        return False, errors
    
    # Additional validation
    if 'email' in data:
        email = data['email'].strip().lower()
        if '@' not in email or '.' not in email:
            errors.append('Invalid email format')
    
    if 'password' in data:
        password = data['password']
        if len(password) < 6:
            errors.append('Password must be at least 6 characters long')
    
    if 'username' in data:
        username = data['username'].strip()
        if len(username) < 3:
            errors.append('Username must be at least 3 characters long')
        if len(username) > 30:
            errors.append('Username must be less than 30 characters')
        if not username.replace('_', '').replace('-', '').isalnum():
            errors.append('Username can only contain letters, numbers, hyphens, and underscores')
    
    return len(errors) == 0, errors

def check_user_exists(username=None, email=None):
    """Check if user already exists with given username or email"""
    if username:
        user = User.query.filter_by(username=username.strip()).first()
        if user:
            return True, 'Username already exists'
    
    if email:
        user = User.query.filter_by(email=email.strip().lower()).first()
        if user:
            return True, 'Email already exists'
    
    return False, None
