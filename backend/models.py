from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """User model for authentication and user management"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(50), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    libraries = db.relationship('Library', backref='user', lazy=True, cascade='all, delete-orphan')
    stories = db.relationship('Story', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """Check if provided password matches hash"""
        return bcrypt.check_password_hash(self.password_hash, password)

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()

    def to_dict(self):
        """Convert user to dictionary for JSON response"""
        return {
            'id': self.public_id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Library(db.Model):
    """Library model for organizing vocabulary collections"""
    __tablename__ = 'libraries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_master = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    library_words = db.relationship('LibraryWord', backref='library', lazy=True, cascade='all, delete-orphan')

    def get_word_count(self):
        """Get total number of words in this library using efficient count query"""
        return db.session.query(LibraryWord).filter_by(library_id=self.id).count()

    def get_learned_count(self):
        """Get number of learned words in this library using efficient count query"""
        return db.session.query(LibraryWord).filter_by(library_id=self.id, is_learned=True).count()

    def get_unlearned_count(self):
        """Get number of unlearned words in this library using efficient count query"""
        return db.session.query(LibraryWord).filter_by(library_id=self.id, is_learned=False).count()

    def to_dict(self, include_words=True):
        """Convert library to dictionary for JSON response"""
        result = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_master': self.is_master,
            'word_count': self.get_word_count(),
            'learned_count': self.get_learned_count(),
            'unlearned_count': self.get_unlearned_count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_words:
            words_data = []
            for library_word in self.library_words:
                word_dict = library_word.word.to_dict()
                word_dict.update({
                    'is_learned': library_word.is_learned,
                    'learned_at': library_word.learned_at.isoformat() if library_word.learned_at else None,
                    'added_at': library_word.added_at.isoformat() if library_word.added_at else None,
                    'library_word_id': library_word.id
                })
                words_data.append(word_dict)
            result['words'] = words_data

        return result

class Word(db.Model):
    """Word model for storing vocabulary words"""
    __tablename__ = 'words'

    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False, index=True)
    meaning = db.Column(db.Text, nullable=False)
    pronunciation = db.Column(db.String(200))
    example = db.Column(db.Text)
    difficulty = db.Column(db.String(20), default='medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    library_words = db.relationship('LibraryWord', backref='word', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """Convert word to dictionary for JSON response"""
        return {
            'id': self.id,
            'word': self.word,
            'meaning': self.meaning,
            'pronunciation': self.pronunciation,
            'example': self.example,
            'difficulty': self.difficulty,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class LibraryWord(db.Model):
    """Association table for many-to-many relationship between libraries and words"""
    __tablename__ = 'library_words'

    id = db.Column(db.Integer, primary_key=True)
    library_id = db.Column(db.Integer, db.ForeignKey('libraries.id'), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('words.id'), nullable=False)
    is_learned = db.Column(db.Boolean, default=False)
    learned_at = db.Column(db.DateTime)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint to prevent duplicate words in same library + performance indexes
    __table_args__ = (
        db.UniqueConstraint('library_id', 'word_id', name='unique_library_word'),
        db.Index('idx_library_words_library_id', 'library_id'),
        db.Index('idx_library_words_word_id', 'word_id'),
        db.Index('idx_library_words_learned', 'library_id', 'is_learned'),
    )

    def mark_as_learned(self):
        """Mark word as learned"""
        self.is_learned = True
        self.learned_at = datetime.utcnow()
        db.session.commit()

    def mark_as_unlearned(self):
        """Mark word as unlearned"""
        self.is_learned = False
        self.learned_at = None
        db.session.commit()

    def to_dict(self):
        """Convert library word to dictionary for JSON response"""
        return {
            'id': self.id,
            'library_id': self.library_id,
            'word': self.word.to_dict() if self.word else None,
            'is_learned': self.is_learned,
            'learned_at': self.learned_at.isoformat() if self.learned_at else None,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }

class Story(db.Model):
    """Story model for storing user-generated stories"""
    __tablename__ = 'stories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    genre = db.Column(db.String(50))
    keywords = db.Column(db.Text)  # JSON string of keywords used
    word_count = db.Column(db.Integer, default=0)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert story to dictionary for JSON response"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'genre': self.genre,
            'keywords': self.keywords,
            'word_count': self.word_count,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
