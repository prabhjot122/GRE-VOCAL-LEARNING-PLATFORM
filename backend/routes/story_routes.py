from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from models import User, Library, Word, Story, db
from schemas import StorySchema
from auth import token_required
import json

story_bp = Blueprint('stories', __name__, url_prefix='/api/stories')

@story_bp.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@story_bp.route('', methods=['OPTIONS'])
@story_bp.route('/<int:story_id>', methods=['OPTIONS'])
def handle_options(story_id=None):
    """Handle preflight OPTIONS requests"""
    return jsonify({'success': True}), 200

@story_bp.route('', methods=['GET'])
@token_required
def get_stories(current_user):
    """Get all stories for the current user"""
    try:
        # Get user's stories
        stories = Story.query.filter_by(user_id=current_user.id).order_by(Story.created_at.desc()).all()
        
        stories_data = []
        for story in stories:
            story_dict = story.to_dict()
            # Parse keywords if they exist
            if story_dict.get('keywords'):
                try:
                    story_dict['keywords'] = json.loads(story_dict['keywords'])
                except:
                    story_dict['keywords'] = []
            else:
                story_dict['keywords'] = []
            stories_data.append(story_dict)
        
        return jsonify({
            'success': True,
            'data': {
                'stories': stories_data,
                'total': len(stories_data)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve stories',
            'details': str(e)
        }), 500

@story_bp.route('', methods=['POST'])
@token_required
def create_story(current_user):
    """Create a new story"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate story data
        schema = StorySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400
        
        # Handle keywords
        keywords = validated_data.get('keywords', [])
        if isinstance(keywords, list):
            keywords_json = json.dumps(keywords)
        else:
            keywords_json = keywords
        
        # Create new story
        story = Story(
            title=validated_data['title'],
            content=validated_data['content'],
            genre=validated_data.get('genre'),
            keywords=keywords_json,
            is_public=validated_data.get('is_public', False),
            user_id=current_user.id
        )
        
        db.session.add(story)
        db.session.commit()
        
        # Return story data
        story_dict = story.to_dict()
        story_dict['keywords'] = keywords
        
        return jsonify({
            'success': True,
            'message': 'Story created successfully',
            'data': {
                'story': story_dict
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to create story',
            'details': str(e)
        }), 500

@story_bp.route('/<int:story_id>', methods=['GET'])
@token_required
def get_story(current_user, story_id):
    """Get a specific story"""
    try:
        story = Story.query.filter_by(id=story_id, user_id=current_user.id).first()
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        story_dict = story.to_dict()
        # Parse keywords
        if story_dict.get('keywords'):
            try:
                story_dict['keywords'] = json.loads(story_dict['keywords'])
            except:
                story_dict['keywords'] = []
        else:
            story_dict['keywords'] = []
        
        return jsonify({
            'success': True,
            'data': {
                'story': story_dict
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve story',
            'details': str(e)
        }), 500

@story_bp.route('/<int:story_id>', methods=['PUT'])
@token_required
def update_story(current_user, story_id):
    """Update a story"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        story = Story.query.filter_by(id=story_id, user_id=current_user.id).first()
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        # Validate story data
        schema = StorySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': err.messages
            }), 400
        
        # Update story
        story.title = validated_data['title']
        story.content = validated_data['content']
        story.genre = validated_data.get('genre', story.genre)
        story.is_public = validated_data.get('is_public', story.is_public)
        
        # Handle keywords
        keywords = validated_data.get('keywords', [])
        if isinstance(keywords, list):
            story.keywords = json.dumps(keywords)
        else:
            story.keywords = keywords
        
        story.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Return updated story data
        story_dict = story.to_dict()
        story_dict['keywords'] = keywords if isinstance(keywords, list) else []
        
        return jsonify({
            'success': True,
            'message': 'Story updated successfully',
            'data': {
                'story': story_dict
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to update story',
            'details': str(e)
        }), 500

@story_bp.route('/<int:story_id>', methods=['DELETE'])
@token_required
def delete_story(current_user, story_id):
    """Delete a story"""
    try:
        story = Story.query.filter_by(id=story_id, user_id=current_user.id).first()
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        db.session.delete(story)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Story deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to delete story',
            'details': str(e)
        }), 500

@story_bp.route('/public', methods=['GET'])
def get_public_stories():
    """Get public stories (no authentication required)"""
    try:
        # Get public stories with user information
        stories = db.session.query(Story, User).join(User).filter(
            Story.is_public == True
        ).order_by(Story.created_at.desc()).limit(50).all()
        
        stories_data = []
        for story, user in stories:
            story_dict = story.to_dict()
            story_dict['author'] = {
                'username': user.username,
                'id': user.id
            }
            # Parse keywords
            if story_dict.get('keywords'):
                try:
                    story_dict['keywords'] = json.loads(story_dict['keywords'])
                except:
                    story_dict['keywords'] = []
            else:
                story_dict['keywords'] = []
            stories_data.append(story_dict)
        
        return jsonify({
            'success': True,
            'data': {
                'stories': stories_data,
                'total': len(stories_data)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve public stories',
            'details': str(e)
        }), 500

@story_bp.route('/generate', methods=['POST'])
@token_required
def generate_story(current_user):
    """Generate a story using AI/template system"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        words = data.get('words', [])
        genre = data.get('genre', 'adventure')
        character = data.get('character', '')
        scenario = data.get('scenario', '')
        
        if not words:
            return jsonify({
                'success': False,
                'error': 'At least one word is required'
            }), 400
        
        # Simple story generation (can be enhanced with AI later)
        generated_story = generate_story_content(words, genre, character, scenario)
        
        return jsonify({
            'success': True,
            'data': {
                'story': generated_story,
                'words_used': words,
                'genre': genre
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate story',
            'details': str(e)
        }), 500

def generate_story_content(words, genre, character, scenario):
    """Generate story content based on parameters"""
    
    # Story templates by genre
    templates = {
        'fantasy': {
            'opening': "In a realm where magic flows like rivers and mythical creatures roam freely,",
            'character_intro': f"{character or 'a brave adventurer'} discovered",
            'plot_device': "an ancient prophecy that would change everything.",
            'conclusion': "And so, the legend was born, echoing through the ages."
        },
        'sci-fi': {
            'opening': "In the year 2157, when humanity had spread across the galaxy,",
            'character_intro': f"{character or 'a brilliant scientist'} uncovered",
            'plot_device': "a technology that defied all known laws of physics.",
            'conclusion': "The future of civilization hung in the balance of this discovery."
        },
        'mystery': {
            'opening': "The fog rolled in thick that evening, concealing secrets in its misty embrace,",
            'character_intro': f"{character or 'a keen detective'} noticed",
            'plot_device': "a pattern that others had missed entirely.",
            'conclusion': "The truth, once revealed, was more shocking than anyone could have imagined."
        },
        'adventure': {
            'opening': "Beyond the horizon lay uncharted territories filled with wonder and danger,",
            'character_intro': f"{character or 'an intrepid explorer'} embarked on",
            'plot_device': "a journey that would test every limit of human endurance.",
            'conclusion': "The adventure had transformed not just the landscape, but the soul."
        }
    }
    
    template = templates.get(genre.lower(), templates['adventure'])
    
    # Build story incorporating vocabulary words
    story_parts = [
        template['opening'],
        template['character_intro'],
        f"something truly {words[0].lower()} in {scenario or 'the most unexpected place'}."
    ]
    
    # Add middle section with vocabulary words
    if len(words) > 1:
        story_parts.append(f"The situation was {words[1].lower()}, requiring both wisdom and courage.")
    
    if len(words) > 2:
        story_parts.append(f"With {words[2].lower()} determination, the quest continued.")
    
    # Add remaining words naturally
    for word in words[3:]:
        story_parts.append(f"Each step revealed something more {word.lower()}.")
    
    story_parts.append(template['conclusion'])
    
    return ' '.join(story_parts)
