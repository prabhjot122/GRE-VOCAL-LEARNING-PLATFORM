from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from models import User, Library, Word, LibraryWord, db
from schemas import LibrarySchema
from auth import token_required

library_bp = Blueprint('library', __name__, url_prefix='/api/libraries')

@library_bp.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@library_bp.route('', methods=['OPTIONS'])
@library_bp.route('/<int:library_id>', methods=['OPTIONS'])
@library_bp.route('/<int:library_id>/words', methods=['OPTIONS'])
def handle_options(library_id=None):
    """Handle preflight OPTIONS requests"""
    return jsonify({'success': True}), 200

@library_bp.route('', methods=['GET'])
@token_required
def get_libraries(current_user):
    """Get all libraries for the current user"""
    try:
        libraries = Library.query.filter_by(user_id=current_user.id).order_by(
            Library.is_master.desc(), Library.created_at.asc()
        ).all()

        # Convert libraries to dict without loading all words (performance optimization)
        libraries_data = []
        for library in libraries:
            library_dict = {
                'id': library.id,
                'name': library.name,
                'description': library.description,
                'is_master': library.is_master,
                'word_count': library.get_word_count(),
                'learned_count': library.get_learned_count(),
                'unlearned_count': library.get_unlearned_count(),
                'created_at': library.created_at.isoformat() if library.created_at else None,
                'updated_at': library.updated_at.isoformat() if library.updated_at else None
            }
            libraries_data.append(library_dict)

        return jsonify({
            'success': True,
            'data': {
                'libraries': libraries_data
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch libraries',
            'details': str(e)
        }), 500

@library_bp.route('', methods=['POST'])
@token_required
def create_library(current_user):
    """Create a new library"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input
        schema = LibrarySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400

        # Check if library name already exists for this user
        existing_library = Library.query.filter_by(
            user_id=current_user.id,
            name=validated_data['name']
        ).first()

        if existing_library:
            return jsonify({
                'success': False,
                'error': 'Library with this name already exists'
            }), 409

        # Create new library
        library = Library(
            user_id=current_user.id,
            name=validated_data['name'],
            description=validated_data.get('description'),
            is_master=False  # Only one master library per user, created during registration
        )

        db.session.add(library)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Library created successfully',
            'data': {
                'library': library.to_dict()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to create library',
            'details': str(e)
        }), 500

@library_bp.route('/<int:library_id>', methods=['GET'])
@token_required
def get_library(current_user, library_id):
    """Get a specific library with its words (with pagination support)"""
    try:
        library = Library.query.filter_by(
            id=library_id,
            user_id=current_user.id
        ).first()

        if not library:
            return jsonify({
                'success': False,
                'error': 'Library not found'
            }), 404

        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)  # Default 100 words per page
        search = request.args.get('search', '', type=str)

        # Limit per_page to prevent abuse
        per_page = min(per_page, 500)

        # Build query with eager loading to prevent N+1 queries
        query = db.session.query(LibraryWord, Word).join(
            Word, LibraryWord.word_id == Word.id
        ).filter(
            LibraryWord.library_id == library_id
        )

        # Add search filter if provided
        if search:
            from sqlalchemy import or_
            search_filter = or_(
                Word.word.ilike(f'%{search}%'),
                Word.meaning.ilike(f'%{search}%'),
                Word.synonym.ilike(f'%{search}%'),
                Word.antonym.ilike(f'%{search}%'),
                Word.example.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)

        # Order by word alphabetically
        query = query.order_by(Word.word)

        # Apply pagination
        total_count = query.count()
        library_words = query.offset((page - 1) * per_page).limit(per_page).all()

        words_data = []
        for lw, word in library_words:
            word_dict = word.to_dict()
            word_dict['is_learned'] = lw.is_learned
            word_dict['learned_at'] = lw.learned_at.isoformat() if lw.learned_at else None
            word_dict['added_at'] = lw.added_at.isoformat() if lw.added_at else None
            word_dict['library_word_id'] = lw.id
            words_data.append(word_dict)

        # Get library info with efficient counts
        total_words = library.get_word_count()
        learned_count = library.get_learned_count()
        unlearned_count = library.get_unlearned_count()

        library_dict = {
            'id': library.id,
            'name': library.name,
            'description': library.description,
            'is_master': library.is_master,
            'word_count': total_words,
            'learned_count': learned_count,
            'unlearned_count': unlearned_count,
            'created_at': library.created_at.isoformat() if library.created_at else None,
            'updated_at': library.updated_at.isoformat() if library.updated_at else None,
            'words': words_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page,
                'has_next': page * per_page < total_count,
                'has_prev': page > 1
            }
        }

        return jsonify({
            'success': True,
            'data': {
                'library': library_dict
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch library',
            'details': str(e)
        }), 500

@library_bp.route('/<int:library_id>', methods=['PUT'])
@token_required
def update_library(current_user, library_id):
    """Update a library"""
    try:
        library = Library.query.filter_by(
            id=library_id,
            user_id=current_user.id
        ).first()

        if not library:
            return jsonify({
                'success': False,
                'error': 'Library not found'
            }), 404

        # Don't allow updating master library name
        if library.is_master:
            return jsonify({
                'success': False,
                'error': 'Cannot modify master library'
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input
        schema = LibrarySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400

        # Check if new name conflicts with existing libraries
        if validated_data['name'] != library.name:
            existing_library = Library.query.filter_by(
                user_id=current_user.id,
                name=validated_data['name']
            ).first()

            if existing_library:
                return jsonify({
                    'success': False,
                    'error': 'Library with this name already exists'
                }), 409

        # Update library
        library.name = validated_data['name']
        library.description = validated_data.get('description')

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Library updated successfully',
            'data': {
                'library': library.to_dict()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to update library',
            'details': str(e)
        }), 500

@library_bp.route('/<int:library_id>', methods=['DELETE'])
@token_required
def delete_library(current_user, library_id):
    """Delete a library"""
    try:
        library = Library.query.filter_by(
            id=library_id,
            user_id=current_user.id
        ).first()

        if not library:
            return jsonify({
                'success': False,
                'error': 'Library not found'
            }), 404

        # Don't allow deleting master library
        if library.is_master:
            return jsonify({
                'success': False,
                'error': 'Cannot delete master library'
            }), 400

        db.session.delete(library)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Library deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to delete library',
            'details': str(e)
        }), 500

@library_bp.route('/<int:library_id>/upload-csv', methods=['POST'])
@token_required
def upload_csv_to_library(current_user, library_id):
    """Upload CSV file to add words to a library"""
    import csv
    import io

    try:
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

        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        # Check file extension
        if not file.filename.lower().endswith('.csv'):
            return jsonify({
                'success': False,
                'error': 'File must be a CSV file'
            }), 400

        # Read and parse CSV
        try:
            stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
            csv_reader = csv.DictReader(stream)

            # Expected columns: word, meaning, pronunciation (optional), synonym (optional), antonym (optional), example (optional)
            required_columns = ['word', 'meaning']
            optional_columns = ['pronunciation', 'synonym', 'antonym', 'example', 'difficulty']

            # Check if required columns exist
            if not all(col in csv_reader.fieldnames for col in required_columns):
                return jsonify({
                    'success': False,
                    'error': f'CSV must contain columns: {", ".join(required_columns)}',
                    'details': f'Found columns: {", ".join(csv_reader.fieldnames or [])}'
                }), 400

            words_added = 0
            words_skipped = 0
            errors = []

            # Get master library for auto-sync
            master_library = Library.query.filter_by(
                user_id=current_user.id,
                is_master=True
            ).first()

            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is headers
                try:
                    word_text = row.get('word', '').strip().lower()
                    meaning_text = row.get('meaning', '').strip()

                    if not word_text or not meaning_text:
                        errors.append(f'Row {row_num}: Word and meaning are required')
                        continue

                    # Check if word already exists
                    existing_word = Word.query.filter_by(word=word_text).first()

                    if existing_word:
                        # Check if word is already in this library
                        existing_library_word = LibraryWord.query.filter_by(
                            library_id=library_id,
                            word_id=existing_word.id
                        ).first()

                        if existing_library_word:
                            words_skipped += 1
                            continue

                        # Add existing word to library
                        library_word = LibraryWord(
                            library_id=library_id,
                            word_id=existing_word.id
                        )
                        word = existing_word
                    else:
                        # Create new word
                        word = Word(
                            word=word_text,
                            meaning=meaning_text,
                            pronunciation=row.get('pronunciation', '').strip() or None,
                            synonym=row.get('synonym', '').strip() or None,
                            antonym=row.get('antonym', '').strip() or None,
                            example=row.get('example', '').strip() or None,
                            difficulty=row.get('difficulty', 'medium').strip() or 'medium'
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
                    if not library.is_master and master_library:
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

                    words_added += 1

                except Exception as e:
                    errors.append(f'Row {row_num}: {str(e)}')
                    continue

            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'CSV processed successfully',
                'data': {
                    'words_added': words_added,
                    'words_skipped': words_skipped,
                    'errors': errors
                }
            }), 200

        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Failed to parse CSV file',
                'details': str(e)
            }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to upload CSV',
            'details': str(e)
        }), 500
