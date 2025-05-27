import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models and configuration
from models import db, bcrypt, User, Library, Word, LibraryWord, Story
from config import config

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.library_routes import library_bp
from routes.word_routes import word_bp
from routes.story_routes import story_bp

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)

    # Configure CORS
    CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(word_bp)
    app.register_blueprint(story_bp)

    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app

# Create app instance
app = create_app()

# Sample data for initial testing (will be replaced with database data)
vocabulary_data = [
    {
        "id": 1,
        "word": "Aberrant",
        "definition": "Departing from an accepted standard",
        "example": "His aberrant behavior worried his friends.",
        "difficulty": "medium"
    },
    {
        "id": 2,
        "word": "Abscond",
        "definition": "Leave hurriedly and secretly, typically to avoid detection or arrest",
        "example": "The thief absconded with the stolen goods.",
        "difficulty": "medium"
    },
    {
        "id": 3,
        "word": "Abstain",
        "definition": "Restrain oneself from indulging in or enjoying something",
        "example": "She decided to abstain from eating sweets.",
        "difficulty": "easy"
    },
    {
        "id": 4,
        "word": "Admonish",
        "definition": "Warn or reprimand someone firmly",
        "example": "The teacher admonished the student for being late.",
        "difficulty": "medium"
    },
    {
        "id": 5,
        "word": "Aesthetic",
        "definition": "Concerned with beauty or the appreciation of beauty",
        "example": "The museum's aesthetic appeal attracted many visitors.",
        "difficulty": "easy"
    }
]

@app.route('/')
def home():
    """Home route"""
    return jsonify({
        "message": "Welcome to GRE Vocabulary API",
        "version": "1.0.0",
        "endpoints": {
            "/api/words": "GET - Get all vocabulary words",
            "/api/words/<id>": "GET - Get a specific word by ID",
            "/api/words/random": "GET - Get a random word",
            "/api/words/difficulty/<level>": "GET - Get words by difficulty level"
        }
    })

@app.route('/api/words', methods=['GET'])
def get_all_words():
    """Get all vocabulary words"""
    return jsonify({
        "success": True,
        "data": vocabulary_data,
        "count": len(vocabulary_data)
    })

@app.route('/api/words/<int:word_id>', methods=['GET'])
def get_word_by_id(word_id):
    """Get a specific word by ID"""
    word = next((w for w in vocabulary_data if w['id'] == word_id), None)
    if word:
        return jsonify({
            "success": True,
            "data": word
        })
    else:
        return jsonify({
            "success": False,
            "error": "Word not found"
        }), 404

@app.route('/api/words/random', methods=['GET'])
def get_random_word():
    """Get a random vocabulary word"""
    import random
    word = random.choice(vocabulary_data)
    return jsonify({
        "success": True,
        "data": word
    })

@app.route('/api/words/difficulty/<difficulty_level>', methods=['GET'])
def get_words_by_difficulty(difficulty_level):
    """Get words by difficulty level"""
    filtered_words = [w for w in vocabulary_data if w['difficulty'].lower() == difficulty_level.lower()]
    return jsonify({
        "success": True,
        "data": filtered_words,
        "count": len(filtered_words)
    })

@app.route('/api/words', methods=['POST'])
def add_word():
    """Add a new vocabulary word"""
    data = request.get_json()

    if not data or not all(key in data for key in ['word', 'definition', 'example', 'difficulty']):
        return jsonify({
            "success": False,
            "error": "Missing required fields: word, definition, example, difficulty"
        }), 400

    new_word = {
        "id": max([w['id'] for w in vocabulary_data]) + 1 if vocabulary_data else 1,
        "word": data['word'],
        "definition": data['definition'],
        "example": data['example'],
        "difficulty": data['difficulty']
    }

    vocabulary_data.append(new_word)

    return jsonify({
        "success": True,
        "data": new_word,
        "message": "Word added successfully"
    }), 201

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
