#!/usr/bin/env python3
"""
Database initialization script
Run this script to create the database tables and add sample data
"""

import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Library, Word, LibraryWord

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        
        # Drop all tables and recreate (for development)
        db.drop_all()
        db.create_all()
        
        print("Database tables created successfully!")
        
        # Add sample words to the database
        sample_words = [
            {
                "word": "Aberrant",
                "meaning": "Departing from an accepted standard",
                "example": "His aberrant behavior worried his friends.",
                "difficulty": "medium",
                "pronunciation": "/əˈberənt/",
                "synonym": "Deviant, Abnormal",
                "antonym": "Normal, Typical"
            },
            {
                "word": "Abscond",
                "meaning": "Leave hurriedly and secretly, typically to avoid detection or arrest",
                "example": "The thief absconded with the stolen goods.",
                "difficulty": "medium",
                "pronunciation": "/əbˈskɑnd/",
                "synonym": "Flee, Escape",
                "antonym": "Remain, Stay"
            },
            {
                "word": "Abstain",
                "meaning": "Restrain oneself from indulging in or enjoying something",
                "example": "She decided to abstain from eating sweets.",
                "difficulty": "easy",
                "pronunciation": "/əbˈsteɪn/",
                "synonym": "Refrain, Avoid",
                "antonym": "Indulge, Partake"
            },
            {
                "word": "Admonish",
                "meaning": "Warn or reprimand someone firmly",
                "example": "The teacher admonished the student for being late.",
                "difficulty": "medium",
                "pronunciation": "/ədˈmɑnɪʃ/",
                "synonym": "Scold, Rebuke",
                "antonym": "Praise, Commend"
            },
            {
                "word": "Aesthetic",
                "meaning": "Concerned with beauty or the appreciation of beauty",
                "example": "The museum's aesthetic appeal attracted many visitors.",
                "difficulty": "easy",
                "pronunciation": "/esˈθetɪk/",
                "synonym": "Artistic, Beautiful",
                "antonym": "Ugly, Unattractive"
            },
            {
                "word": "Serendipity",
                "meaning": "The occurrence and development of events by chance in a happy or beneficial way",
                "example": "Finding that book was pure serendipity.",
                "difficulty": "medium",
                "pronunciation": "/ˌserənˈdɪpəti/",
                "synonym": "Fortuity, Chance",
                "antonym": "Misfortune, Bad luck"
            },
            {
                "word": "Ephemeral",
                "meaning": "Lasting for a very short time",
                "example": "The beauty of cherry blossoms is ephemeral.",
                "difficulty": "hard",
                "pronunciation": "/əˈfemərəl/",
                "synonym": "Temporary, Fleeting",
                "antonym": "Permanent, Lasting"
            },
            {
                "word": "Ubiquitous",
                "meaning": "Present, appearing, or found everywhere",
                "example": "Smartphones have become ubiquitous in modern society.",
                "difficulty": "hard",
                "pronunciation": "/yuˈbɪkwətəs/",
                "synonym": "Omnipresent, Universal",
                "antonym": "Rare, Uncommon"
            },
            {
                "word": "Ameliorate",
                "meaning": "Make something bad or unsatisfactory better",
                "example": "The new policies helped ameliorate the housing crisis.",
                "difficulty": "hard",
                "pronunciation": "/əˈmilyəˌreɪt/",
                "synonym": "Improve, Enhance",
                "antonym": "Worsen, Deteriorate"
            },
            {
                "word": "Perspicacious",
                "meaning": "Having a ready insight into and understanding of things",
                "example": "Her perspicacious analysis impressed the board.",
                "difficulty": "hard",
                "pronunciation": "/ˌpɜrspɪˈkeɪʃəs/",
                "synonym": "Perceptive, Astute",
                "antonym": "Obtuse, Dull"
            }
        ]
        
        print("Adding sample words...")
        for word_data in sample_words:
            word = Word(**word_data)
            db.session.add(word)
        
        db.session.commit()
        print(f"Added {len(sample_words)} sample words to the database!")
        
        print("\nDatabase initialization completed successfully!")
        print("You can now start the Flask application.")

if __name__ == '__main__':
    init_database()
