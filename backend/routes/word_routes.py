from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_
from datetime import datetime
from models import User, Library, Word, LibraryWord, db
from schemas import WordSchema
from auth import token_required

word_bp = Blueprint('words', __name__, url_prefix='/api/words')

@word_bp.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@word_bp.route('', methods=['OPTIONS'])
@word_bp.route('/<int:word_id>', methods=['OPTIONS'])
@word_bp.route('/<int:word_id>/learn', methods=['OPTIONS'])
@word_bp.route('/<int:word_id>/learned', methods=['OPTIONS'])
@word_bp.route('/<int:word_id>/unlearn', methods=['OPTIONS'])
@word_bp.route('/random', methods=['OPTIONS'])
@word_bp.route('/random-unlearned', methods=['OPTIONS'])
@word_bp.route('/word-of-the-day', methods=['OPTIONS'])
@word_bp.route('/search', methods=['OPTIONS'])
def handle_options(word_id=None):
    """Handle preflight OPTIONS requests"""
    return jsonify({'success': True}), 200

@word_bp.route('', methods=['POST'])
@token_required
def add_word_to_library(current_user):
    """Add a word to a library"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        library_id = data.get('library_id')
        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Verify library belongs to user
        library = Library.query.filter_by(
            id=library_id,
            user_id=current_user.id
        ).first()

        if not library:
            return jsonify({
                'success': False,
                'error': 'Library not found'
            }), 404

        # Validate word data
        schema = WordSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400

        # Check if word already exists
        existing_word = Word.query.filter_by(word=validated_data['word'].lower()).first()

        if existing_word:
            # Check if word is already in this library
            existing_library_word = LibraryWord.query.filter_by(
                library_id=library_id,
                word_id=existing_word.id
            ).first()

            if existing_library_word:
                return jsonify({
                    'success': False,
                    'error': 'Word already exists in this library'
                }), 409

            # Add existing word to library
            library_word = LibraryWord(
                library_id=library_id,
                word_id=existing_word.id
            )
            word = existing_word
        else:
            # Create new word
            word = Word(
                word=validated_data['word'].lower(),
                meaning=validated_data['meaning'],
                pronunciation=validated_data.get('pronunciation'),
                example=validated_data.get('example'),
                difficulty=validated_data.get('difficulty', 'medium')
            )
            db.session.add(word)
            db.session.flush()  # Get the word ID

            # Add word to library
            library_word = LibraryWord(
                library_id=library_id,
                word_id=word.id
            )

        db.session.add(library_word)

        # If not adding to master library, also add to master library
        if not library.is_master:
            master_library = Library.query.filter_by(
                user_id=current_user.id,
                is_master=True
            ).first()

            if master_library:
                # Check if word is already in master library
                existing_master_word = LibraryWord.query.filter_by(
                    library_id=master_library.id,
                    word_id=word.id
                ).first()

                if not existing_master_word:
                    master_library_word = LibraryWord(
                        library_id=master_library.id,
                        word_id=word.id
                    )
                    db.session.add(master_library_word)

        db.session.commit()

        # Return word data with library info
        word_dict = word.to_dict()
        word_dict['is_learned'] = library_word.is_learned
        word_dict['learned_at'] = library_word.learned_at.isoformat() if library_word.learned_at else None
        word_dict['added_at'] = library_word.added_at.isoformat() if library_word.added_at else None
        word_dict['library_word_id'] = library_word.id

        return jsonify({
            'success': True,
            'message': 'Word added successfully',
            'data': {
                'word': word_dict
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to add word',
            'details': str(e)
        }), 500

@word_bp.route('/<int:word_id>', methods=['PUT'])
@token_required
def update_word(current_user, word_id):
    """Update a word"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        library_id = data.get('library_id')
        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Verify library belongs to user and word exists in library
        library_word = db.session.query(LibraryWord).join(Library).filter(
            LibraryWord.word_id == word_id,
            LibraryWord.library_id == library_id,
            Library.user_id == current_user.id
        ).first()

        if not library_word:
            return jsonify({
                'success': False,
                'error': 'Word not found in your library'
            }), 404

        word = library_word.word

        # Validate word data
        schema = WordSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400

        # Update word
        word.word = validated_data['word'].lower()
        word.meaning = validated_data['meaning']
        word.pronunciation = validated_data.get('pronunciation')
        word.example = validated_data.get('example')
        word.difficulty = validated_data.get('difficulty', word.difficulty)

        db.session.commit()

        # Return updated word data
        word_dict = word.to_dict()
        word_dict['is_learned'] = library_word.is_learned
        word_dict['learned_at'] = library_word.learned_at.isoformat() if library_word.learned_at else None
        word_dict['added_at'] = library_word.added_at.isoformat() if library_word.added_at else None
        word_dict['library_word_id'] = library_word.id

        return jsonify({
            'success': True,
            'message': 'Word updated successfully',
            'data': {
                'word': word_dict
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to update word',
            'details': str(e)
        }), 500

@word_bp.route('/<int:word_id>', methods=['DELETE'])
@token_required
def remove_word_from_library(current_user):
    """Remove a word from a library"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        library_id = data.get('library_id')
        word_id = data.get('word_id')

        if not library_id or not word_id:
            return jsonify({
                'success': False,
                'error': 'Library ID and Word ID are required'
            }), 400

        # Verify library belongs to user
        library = Library.query.filter_by(
            id=library_id,
            user_id=current_user.id
        ).first()

        if not library:
            return jsonify({
                'success': False,
                'error': 'Library not found'
            }), 404

        # Don't allow removing words from master library directly
        if library.is_master:
            return jsonify({
                'success': False,
                'error': 'Cannot remove words directly from master library'
            }), 400

        # Find and remove the library-word association
        library_word = LibraryWord.query.filter_by(
            library_id=library_id,
            word_id=word_id
        ).first()

        if not library_word:
            return jsonify({
                'success': False,
                'error': 'Word not found in this library'
            }), 404

        db.session.delete(library_word)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Word removed from library successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to remove word',
            'details': str(e)
        }), 500

@word_bp.route('/<int:word_id>/learn', methods=['POST'])
@token_required
def mark_word_learned(current_user, word_id):
    """Mark a word as learned in a specific library"""
    try:
        data = request.get_json()
        library_id = data.get('library_id') if data else None

        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Find the library-word association
        library_word = db.session.query(LibraryWord).join(Library).filter(
            LibraryWord.word_id == word_id,
            LibraryWord.library_id == library_id,
            Library.user_id == current_user.id
        ).first()

        if not library_word:
            return jsonify({
                'success': False,
                'error': 'Word not found in your library'
            }), 404

        # Mark as learned
        library_word.mark_as_learned()

        return jsonify({
            'success': True,
            'message': 'Word marked as learned'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to mark word as learned',
            'details': str(e)
        }), 500

@word_bp.route('/<int:word_id>/unlearn', methods=['POST'])
@token_required
def mark_word_unlearned(current_user, word_id):
    """Mark a word as unlearned in a specific library"""
    try:
        data = request.get_json()
        library_id = data.get('library_id') if data else None

        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Find the library-word association
        library_word = db.session.query(LibraryWord).join(Library).filter(
            LibraryWord.word_id == word_id,
            LibraryWord.library_id == library_id,
            Library.user_id == current_user.id
        ).first()

        if not library_word:
            return jsonify({
                'success': False,
                'error': 'Word not found in your library'
            }), 404

        # Mark as unlearned
        library_word.mark_as_unlearned()

        return jsonify({
            'success': True,
            'message': 'Word marked as unlearned'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to mark word as unlearned',
            'details': str(e)
        }), 500

@word_bp.route('/random', methods=['GET'])
@token_required
def get_random_words(current_user):
    """Get random words for recommendations or word of the day"""
    try:
        limit = request.args.get('limit', 4, type=int)
        status = request.args.get('status', 'unlearned')  # 'learned', 'unlearned', or 'all'
        library_id = request.args.get('library_id', type=int)

        # Build base query
        query = db.session.query(Word, LibraryWord).join(
            LibraryWord, Word.id == LibraryWord.word_id
        ).join(
            Library, LibraryWord.library_id == Library.id
        ).filter(
            Library.user_id == current_user.id
        )

        # Filter by library if specified
        if library_id:
            query = query.filter(Library.id == library_id)

        # Filter by learned status
        if status == 'learned':
            query = query.filter(LibraryWord.is_learned == True)
        elif status == 'unlearned':
            query = query.filter(LibraryWord.is_learned == False)
        # 'all' doesn't add any filter

        # Get random words using better randomization
        # First get all matching words, then sample randomly in Python for better distribution
        all_words_data = query.all()

        if len(all_words_data) <= limit:
            words_data = all_words_data
        else:
            import random
            words_data = random.sample(all_words_data, limit)

        # Format response
        words = []
        for word, library_word in words_data:
            word_dict = word.to_dict()
            word_dict['is_learned'] = library_word.is_learned
            word_dict['learned_at'] = library_word.learned_at.isoformat() if library_word.learned_at else None
            word_dict['added_at'] = library_word.added_at.isoformat() if library_word.added_at else None
            word_dict['library_word_id'] = library_word.id
            words.append(word_dict)

        return jsonify({
            'success': True,
            'data': words
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get random words',
            'details': str(e)
        }), 500

@word_bp.route('/search', methods=['GET'])
@token_required
def search_words(current_user):
    """Search words across libraries"""
    try:
        query_text = request.args.get('q', '').strip()
        library_id = request.args.get('library_id', type=int)

        if not query_text:
            return jsonify({
                'success': False,
                'error': 'Search query is required'
            }), 400

        # Build base query
        query = db.session.query(Word, LibraryWord).join(
            LibraryWord, Word.id == LibraryWord.word_id
        ).join(
            Library, LibraryWord.library_id == Library.id
        ).filter(
            Library.user_id == current_user.id
        )

        # Filter by library if specified
        if library_id:
            query = query.filter(Library.id == library_id)

        # Search across word fields
        search_filter = or_(
            Word.word.ilike(f'%{query_text}%'),
            Word.meaning.ilike(f'%{query_text}%'),
            Word.example.ilike(f'%{query_text}%')
        )

        words_data = query.filter(search_filter).all()

        # Format response
        words = []
        for word, library_word in words_data:
            word_dict = word.to_dict()
            word_dict['is_learned'] = library_word.is_learned
            word_dict['learned_at'] = library_word.learned_at.isoformat() if library_word.learned_at else None
            word_dict['added_at'] = library_word.added_at.isoformat() if library_word.added_at else None
            word_dict['library_word_id'] = library_word.id
            words.append(word_dict)

        return jsonify({
            'success': True,
            'data': words,
            'count': len(words)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to search words',
            'details': str(e)
        }), 500

@word_bp.route('/<int:word_id>/learned', methods=['POST'])
@token_required
def mark_word_learned_alt(current_user, word_id):
    """Alternative endpoint for marking word as learned (for frontend compatibility)"""
    try:
        data = request.get_json()
        library_id = data.get('library_id') if data else None

        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Find the library-word association
        library_word = db.session.query(LibraryWord).join(Library).filter(
            LibraryWord.word_id == word_id,
            LibraryWord.library_id == library_id,
            Library.user_id == current_user.id
        ).first()

        if not library_word:
            return jsonify({
                'success': False,
                'error': 'Word not found in your library'
            }), 404

        # Mark as learned
        library_word.mark_as_learned()

        return jsonify({
            'success': True,
            'message': 'Word marked as learned'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to mark word as learned',
            'details': str(e)
        }), 500

@word_bp.route('/random-unlearned', methods=['GET'])
@token_required
def get_random_unlearned_words(current_user):
    """Get random unlearned words for recommendations"""
    try:
        count = request.args.get('count', 4, type=int)
        library_id = request.args.get('library_id', type=int)

        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Build query for unlearned words
        query = db.session.query(Word, LibraryWord).join(
            LibraryWord, Word.id == LibraryWord.word_id
        ).join(
            Library, LibraryWord.library_id == Library.id
        ).filter(
            Library.user_id == current_user.id,
            Library.id == library_id,
            LibraryWord.is_learned == False
        )

        # Get random unlearned words using better randomization
        all_words_data = query.all()

        if len(all_words_data) <= count:
            words_data = all_words_data
        else:
            import random
            words_data = random.sample(all_words_data, count)

        # Format response
        words = []
        for word, library_word in words_data:
            word_dict = word.to_dict()
            word_dict['is_learned'] = library_word.is_learned
            word_dict['learned_at'] = library_word.learned_at.isoformat() if library_word.learned_at else None
            word_dict['added_at'] = library_word.added_at.isoformat() if library_word.added_at else None
            word_dict['library_word_id'] = library_word.id
            words.append(word_dict)

        return jsonify({
            'success': True,
            'data': words
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get random unlearned words',
            'details': str(e)
        }), 500

@word_bp.route('/word-of-the-day', methods=['GET'])
@token_required
def get_word_of_the_day(current_user):
    """Get word of the day (random unlearned word)"""
    try:
        library_id = request.args.get('library_id', type=int)

        if not library_id:
            return jsonify({
                'success': False,
                'error': 'Library ID is required'
            }), 400

        # Build query for unlearned words
        query = db.session.query(Word, LibraryWord).join(
            LibraryWord, Word.id == LibraryWord.word_id
        ).join(
            Library, LibraryWord.library_id == Library.id
        ).filter(
            Library.user_id == current_user.id,
            Library.id == library_id,
            LibraryWord.is_learned == False
        )

        # Get one random unlearned word using better randomization
        all_words_data = query.all()

        if not all_words_data:
            word_data = None
        else:
            import random
            word_data = random.choice(all_words_data)

        if not word_data:
            return jsonify({
                'success': True,
                'data': []
            }), 200

        word, library_word = word_data
        word_dict = word.to_dict()
        word_dict['is_learned'] = library_word.is_learned
        word_dict['learned_at'] = library_word.learned_at.isoformat() if library_word.learned_at else None
        word_dict['added_at'] = library_word.added_at.isoformat() if library_word.added_at else None
        word_dict['library_word_id'] = library_word.id

        return jsonify({
            'success': True,
            'data': [word_dict]  # Return as array for frontend compatibility
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get word of the day',
            'details': str(e)
        }), 500
