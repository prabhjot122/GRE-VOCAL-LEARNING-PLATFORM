#!/usr/bin/env python3
"""
Apply performance indexes to existing database
This script adds database indexes to improve query performance
"""

from app import app, db
from sqlalchemy import text

def apply_performance_indexes():
    """Apply performance indexes to the database"""
    print("=== Applying Performance Indexes ===")
    
    with app.app_context():
        try:
            # Check if indexes already exist and create them if they don't
            indexes_to_create = [
                ("idx_library_words_library_id", "CREATE INDEX IF NOT EXISTS idx_library_words_library_id ON library_words (library_id)"),
                ("idx_library_words_word_id", "CREATE INDEX IF NOT EXISTS idx_library_words_word_id ON library_words (word_id)"),
                ("idx_library_words_learned", "CREATE INDEX IF NOT EXISTS idx_library_words_learned ON library_words (library_id, is_learned)"),
                ("idx_words_word", "CREATE INDEX IF NOT EXISTS idx_words_word ON words (word)"),  # This might already exist
            ]
            
            for index_name, sql in indexes_to_create:
                try:
                    print(f"Creating index: {index_name}")
                    db.session.execute(text(sql))
                    print(f"✓ Index {index_name} created successfully")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"✓ Index {index_name} already exists")
                    else:
                        print(f"✗ Error creating index {index_name}: {e}")
            
            db.session.commit()
            print("\n=== Performance Indexes Applied Successfully ===")
            print("Database performance should be significantly improved!")
            
        except Exception as e:
            print(f"Error applying indexes: {e}")
            db.session.rollback()

if __name__ == '__main__':
    apply_performance_indexes()
