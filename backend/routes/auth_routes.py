from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from marshmallow import ValidationError
from models import User, Library, db
from schemas import UserRegistrationSchema, UserLoginSchema
from auth import validate_user_input, check_user_exists

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@auth_bp.route('/register', methods=['OPTIONS'])
@auth_bp.route('/login', methods=['OPTIONS'])
@auth_bp.route('/refresh', methods=['OPTIONS'])
@auth_bp.route('/me', methods=['OPTIONS'])
@auth_bp.route('/logout', methods=['OPTIONS'])
def handle_options():
    """Handle preflight OPTIONS requests"""
    return jsonify({'success': True}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input using schema
        schema = UserRegistrationSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400

        # Check if passwords match
        if validated_data['password'] != validated_data['confirm_password']:
            return jsonify({
                'success': False,
                'error': 'Passwords do not match'
            }), 400

        # Check if user already exists
        username = validated_data['username'].strip()
        email = validated_data['email'].strip().lower()

        exists, error_msg = check_user_exists(username=username, email=email)
        if exists:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 409

        # Create new user
        user = User(
            username=username,
            email=email
        )
        user.set_password(validated_data['password'])

        db.session.add(user)
        db.session.commit()

        # Create default Master Library for the user
        master_library = Library(
            user_id=user.id,
            name='Master Library',
            description='Your main vocabulary collection',
            is_master=True
        )
        db.session.add(master_library)
        db.session.commit()

        # Generate tokens
        access_token = create_access_token(identity=user.public_id)
        refresh_token = create_refresh_token(identity=user.public_id)

        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'data': {
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Registration failed',
            'details': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        print("=== LOGIN REQUEST RECEIVED ===")
        # Get JSON data
        data = request.get_json()
        print(f"Login data: {data}")
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input using schema
        schema = UserLoginSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400

        username_or_email = validated_data['username_or_email'].strip()
        password = validated_data['password']

        # Find user by username or email
        user = None
        if '@' in username_or_email:
            # It's an email
            user = User.query.filter_by(email=username_or_email.lower()).first()
        else:
            # It's a username
            user = User.query.filter_by(username=username_or_email).first()

        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401

        # Check if user account is active
        if not user.is_active:
            return jsonify({
                'success': False,
                'error': 'Account is deactivated'
            }), 401

        # Update last login
        user.update_last_login()

        # Generate tokens
        access_token = create_access_token(identity=user.public_id)
        refresh_token = create_refresh_token(identity=user.public_id)

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Login failed',
            'details': str(e)
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(public_id=current_user_id).first()

        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'error': 'User not found or inactive'
            }), 401

        # Generate new access token
        access_token = create_access_token(identity=user.public_id)

        return jsonify({
            'success': True,
            'message': 'Token refreshed successfully',
            'data': {
                'access_token': access_token
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Token refresh failed',
            'details': str(e)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(public_id=current_user_id).first()

        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get user information',
            'details': str(e)
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({
        'success': True,
        'message': 'Logout successful. Please remove the token from client storage.'
    }), 200
