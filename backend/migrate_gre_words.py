#!/usr/bin/env python3
"""
Script to migrate GRE vocabulary from existing databases and CSV files
into the Master Library for all users.
"""

import sqlite3
import csv
import re
from models import db, User, Library, Word, LibraryWord
from app import create_app

def clean_html_tags(text):
    """Remove HTML tags from text"""
    if not text:
        return ""
    # Remove HTML tags
    clean = re.compile('<.*?>')
    text = re.sub(clean, '', text)
    # Clean up extra whitespace
    text = ' '.join(text.split())
    return text.strip()

def parse_csv_words():
    """Parse words from the GRE master wordlist CSV"""
    words = []
    try:
        with open('gre_master_wordlist.csv', 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            
            for row in reader:
                if len(row) >= 2:
                    word = clean_html_tags(row[0]).strip()
                    meaning = clean_html_tags(row[1]).strip()
                    
                    # Skip empty or invalid entries
                    if not word or not meaning or len(word) < 2:
                        continue
                    
                    # Skip entries that look like definitions or examples
                    if word.startswith('(') or word.startswith('['):
                        continue
                        
                    words.append({
                        'word': word,
                        'meaning': meaning,
                        'pronunciation': '',
                        'synonym': '',
                        'antonym': '',
                        'example': '',
                        'difficulty': 'medium'
                    })
    except Exception as e:
        print(f"Error reading CSV: {e}")
    
    return words

def parse_sqlite_words():
    """Parse words from the GRE words SQLite database"""
    words = []
    try:
        conn = sqlite3.connect('gre_words.db')
        cursor = conn.cursor()
        
        # Get all words from the database
        cursor.execute("SELECT * FROM words LIMIT 1000")  # Limit for testing
        rows = cursor.fetchall()
        
        # Get column names
        cursor.execute("PRAGMA table_info(words)")
        columns = [col[1] for col in cursor.fetchall()]
        
        for row in rows:
            word_data = dict(zip(columns, row))
            
            word = clean_html_tags(str(word_data.get('word', ''))).strip()
            meaning = clean_html_tags(str(word_data.get('meaning', ''))).strip()
            
            # Skip empty or invalid entries
            if not word or not meaning or len(word) < 2:
                continue
                
            # Skip entries that look like definitions or examples
            if word.startswith('(') or word.startswith('['):
                continue
            
            words.append({
                'word': word,
                'meaning': meaning,
                'pronunciation': '',
                'synonym': '',
                'antonym': '',
                'example': '',
                'difficulty': 'hard'  # GRE words are typically harder
            })
        
        conn.close()
    except Exception as e:
        print(f"Error reading SQLite database: {e}")
    
    return words

def migrate_words_to_master_libraries():
    """Migrate GRE words to all users' Master Libraries"""
    app = create_app()
    
    with app.app_context():
        print("Starting GRE vocabulary migration...")
        
        # Parse words from both sources
        csv_words = parse_csv_words()
        sqlite_words = parse_sqlite_words()
        
        print(f"Found {len(csv_words)} words from CSV")
        print(f"Found {len(sqlite_words)} words from SQLite")
        
        # Combine and deduplicate words
        all_words = {}
        
        # Add CSV words first (they might be cleaner)
        for word_data in csv_words:
            word_key = word_data['word'].lower()
            all_words[word_key] = word_data
        
        # Add SQLite words (won't overwrite existing)
        for word_data in sqlite_words:
            word_key = word_data['word'].lower()
            if word_key not in all_words:
                all_words[word_key] = word_data
        
        print(f"Total unique words after deduplication: {len(all_words)}")
        
        # Get all users
        users = User.query.all()
        print(f"Found {len(users)} users")
        
        words_added = 0
        words_skipped = 0
        
        for user in users:
            print(f"Processing user: {user.username}")
            
            # Find or create Master Library for this user
            master_library = Library.query.filter_by(
                user_id=user.id, 
                is_master=True
            ).first()
            
            if not master_library:
                master_library = Library(
                    user_id=user.id,
                    name="Master Library",
                    description="Complete GRE vocabulary collection",
                    is_master=True
                )
                db.session.add(master_library)
                db.session.flush()  # Get the ID
            
            # Add words to the Master Library
            for word_data in all_words.values():
                # Check if word already exists for this user
                existing_word = Word.query.filter_by(
                    word=word_data['word']
                ).first()
                
                if not existing_word:
                    # Create new word
                    new_word = Word(
                        word=word_data['word'],
                        meaning=word_data['meaning'],
                        pronunciation=word_data['pronunciation'],
                        synonym=word_data['synonym'],
                        antonym=word_data['antonym'],
                        example=word_data['example'],
                        difficulty=word_data['difficulty']
                    )
                    db.session.add(new_word)
                    db.session.flush()  # Get the ID
                    word_id = new_word.id
                    words_added += 1
                else:
                    word_id = existing_word.id
                    words_skipped += 1
                
                # Check if word is already in this library
                existing_library_word = LibraryWord.query.filter_by(
                    library_id=master_library.id,
                    word_id=word_id
                ).first()
                
                if not existing_library_word:
                    # Add word to library
                    library_word = LibraryWord(
                        library_id=master_library.id,
                        word_id=word_id,
                        is_learned=False
                    )
                    db.session.add(library_word)
        
        # Commit all changes
        try:
            db.session.commit()
            print(f"Migration completed successfully!")
            print(f"Words added: {words_added}")
            print(f"Words skipped (already existed): {words_skipped}")
        except Exception as e:
            db.session.rollback()
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_words_to_master_libraries()
