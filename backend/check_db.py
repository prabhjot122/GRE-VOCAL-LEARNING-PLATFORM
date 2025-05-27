#!/usr/bin/env python3
"""
Check database contents
"""

from app import app
from models import db, User, Library, Word, LibraryWord

def check_database():
    with app.app_context():
        print("=== Database Check ===")
        print(f"Users: {User.query.count()}")
        print(f"Libraries: {Library.query.count()}")
        print(f"Words: {Word.query.count()}")
        print(f"LibraryWords: {LibraryWord.query.count()}")
        
        # Check demo user
        demo_user = User.query.filter_by(username='demo').first()
        if demo_user:
            print(f"Demo user found: {demo_user.username}")
            
            # Check libraries
            libraries = Library.query.filter_by(user_id=demo_user.id).all()
            print(f"Demo user libraries: {len(libraries)}")
            
            for lib in libraries:
                word_count = LibraryWord.query.filter_by(library_id=lib.id).count()
                print(f"  - {lib.name} (ID: {lib.id}, Master: {lib.is_master}): {word_count} words")
                
                # Show first few words
                if word_count > 0:
                    first_words = LibraryWord.query.filter_by(library_id=lib.id).limit(5).all()
                    print("    First 5 words:")
                    for lw in first_words:
                        print(f"      - {lw.word.word}: {lw.word.meaning}")
        else:
            print("Demo user not found!")

if __name__ == '__main__':
    check_database()
