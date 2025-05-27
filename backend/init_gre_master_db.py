#!/usr/bin/env python3
"""
Initialize database with GRE Master Wordlist only
This script replaces the previous database initialization and uses only the gre_master_wordlist.csv
"""

import csv
import os
import sys
from app import app, db
from models import User, Library, Word, LibraryWord

def clear_database():
    """Clear all existing data"""
    print("Clearing existing database...")
    with app.app_context():
        # Drop all tables
        db.drop_all()
        # Recreate all tables
        db.create_all()
        print("Database cleared and recreated.")

def load_gre_master_wordlist():
    """Load words from gre_master_wordlist.csv"""
    csv_file = 'gre_master_wordlist.csv'

    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found!")
        return False

    print(f"Loading words from {csv_file}...")

    words_added = 0
    words_skipped = 0

    with open(csv_file, 'r', encoding='utf-8') as file:
        # Skip the first empty line and header
        lines = file.readlines()[2:]  # Skip first empty line and header line

        for line_num, line in enumerate(lines, start=3):
            try:
                # Split by tab (assuming tab-separated)
                parts = line.strip().split('\t')

                if len(parts) < 2:
                    words_skipped += 1
                    continue

                word_text = parts[0].strip()
                meaning = parts[1].strip()

                # Skip empty words or meanings
                if not word_text or not meaning:
                    words_skipped += 1
                    continue

                # Check if word already exists
                existing_word = Word.query.filter_by(word=word_text.lower()).first()
                if existing_word:
                    words_skipped += 1
                    continue

                # Create new word
                new_word = Word(
                    word=word_text.lower(),
                    meaning=meaning,
                    pronunciation="",  # Not available in this CSV
                    synonym="",        # Not available in this CSV
                    antonym="",        # Not available in this CSV
                    example="",        # Not available in this CSV
                    difficulty="medium"  # Default difficulty
                )

                db.session.add(new_word)
                words_added += 1

                # Commit in batches to avoid memory issues
                if words_added % 100 == 0:
                    db.session.commit()
                    print(f"Processed {words_added} words...")

            except Exception as e:
                print(f"Error processing line {line_num}: {e}")
                words_skipped += 1
                continue

    # Final commit
    db.session.commit()

    print(f"Successfully added {words_added} words")
    print(f"Skipped {words_skipped} words")

    return True

def create_demo_user():
    """Create a demo user with Master Library"""
    print("Creating demo user...")

    # Create demo user
    demo_user = User(
        username='demo',
        email='demo@example.com'
    )
    demo_user.set_password('demo123')  # Use the model's method for proper bcrypt hashing
    db.session.add(demo_user)
    db.session.commit()

    # Create Master Library for demo user
    master_library = Library(
        name='GRE Master Library',
        description='Complete GRE vocabulary from Barron\'s wordlist',
        user_id=demo_user.id,
        is_master=True
    )
    db.session.add(master_library)
    db.session.commit()

    # Add all words to Master Library
    all_words = Word.query.all()
    print(f"Adding {len(all_words)} words to Master Library...")

    for word in all_words:
        library_word = LibraryWord(
            library_id=master_library.id,
            word_id=word.id,
            is_learned=False
        )
        db.session.add(library_word)

    db.session.commit()
    print(f"Demo user created with Master Library containing {len(all_words)} words")

def main():
    """Main initialization function"""
    print("=== GRE Master Database Initialization ===")
    print("This will replace all existing data with GRE Master Wordlist only.")

    # Confirm with user
    response = input("Are you sure you want to continue? (y/N): ")
    if response.lower() != 'y':
        print("Initialization cancelled.")
        return

    with app.app_context():
        try:
            # Clear existing database
            clear_database()

            # Load GRE master wordlist
            if not load_gre_master_wordlist():
                print("Failed to load wordlist. Exiting.")
                return

            # Create demo user
            create_demo_user()

            print("\n=== Initialization Complete ===")
            print("Database has been initialized with GRE Master Wordlist")
            print("Demo user credentials:")
            print("  Username: demo")
            print("  Password: demo123")
            print("\nYou can now start the application!")

        except Exception as e:
            print(f"Error during initialization: {e}")
            db.session.rollback()
            sys.exit(1)

if __name__ == '__main__':
    main()
