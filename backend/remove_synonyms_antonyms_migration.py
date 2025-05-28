#!/usr/bin/env python3
"""
Database migration script to remove synonym and antonym columns from the words table.
This script should be run after updating the models to remove these fields.
"""

import sqlite3
import os
import shutil
from datetime import datetime

def backup_database(db_path):
    """Create a backup of the database before migration"""
    backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(db_path, backup_path)
    print(f"Database backed up to: {backup_path}")
    return backup_path

def remove_synonym_antonym_columns(db_path):
    """Remove synonym and antonym columns from the words table"""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns exist
        cursor.execute("PRAGMA table_info(words)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        has_synonym = 'synonym' in column_names
        has_antonym = 'antonym' in column_names
        
        if not has_synonym and not has_antonym:
            print("Synonym and antonym columns do not exist. Migration not needed.")
            conn.close()
            return True
        
        print(f"Found columns - synonym: {has_synonym}, antonym: {has_antonym}")
        
        # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
        print("Creating new words table without synonym and antonym columns...")
        
        # Create new table structure
        cursor.execute("""
            CREATE TABLE words_new (
                id INTEGER PRIMARY KEY,
                word VARCHAR(100) NOT NULL,
                meaning TEXT NOT NULL,
                pronunciation VARCHAR(200),
                example TEXT,
                difficulty VARCHAR(20) DEFAULT 'medium',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Copy data from old table to new table
        print("Copying data to new table...")
        cursor.execute("""
            INSERT INTO words_new (id, word, meaning, pronunciation, example, difficulty, created_at)
            SELECT id, word, meaning, pronunciation, example, difficulty, created_at
            FROM words
        """)
        
        # Drop old table and rename new table
        print("Replacing old table with new table...")
        cursor.execute("DROP TABLE words")
        cursor.execute("ALTER TABLE words_new RENAME TO words")
        
        # Recreate indexes
        print("Recreating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_words_word ON words(word)")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(words)")
        new_columns = cursor.fetchall()
        new_column_names = [col[1] for col in new_columns]
        
        print(f"New table structure: {new_column_names}")
        
        if 'synonym' not in new_column_names and 'antonym' not in new_column_names:
            print("✓ Synonym and antonym columns successfully removed")
        else:
            print("✗ Migration failed - columns still exist")
            return False
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error during migration: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def main():
    """Main migration function"""
    # Database paths
    db_paths = [
        'instance/vocab_app.db',
        'vocab_app.db'
    ]
    
    # Find the database file
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("Database file not found. Please ensure the database exists.")
        return False
    
    print(f"Using database: {db_path}")
    
    # Create backup
    backup_path = backup_database(db_path)
    
    try:
        # Run migration
        success = remove_synonym_antonym_columns(db_path)
        
        if success:
            print("\n✓ Migration completed successfully!")
            print(f"Backup saved at: {backup_path}")
            print("You can now update your models.py to remove synonym and antonym fields.")
        else:
            print("\n✗ Migration failed!")
            print(f"Database backup is available at: {backup_path}")
            
        return success
        
    except Exception as e:
        print(f"\n✗ Migration failed with error: {e}")
        print(f"Database backup is available at: {backup_path}")
        return False

if __name__ == "__main__":
    main()
