#!/usr/bin/env python3
"""
Remove outlier words from the database
These are malformed entries that contain HTML tags and other formatting issues
"""

from app import app, db
from models import Word, LibraryWord
from sqlalchemy import text

def remove_outlier_words():
    """Remove the first 5 words which are outliers with HTML content"""
    print("=== Removing Outlier Words ===")
    
    with app.app_context():
        try:
            # Get the first 5 words ordered by ID (these are the outliers)
            outlier_words = Word.query.order_by(Word.id).limit(5).all()
            
            print(f"Found {len(outlier_words)} outlier words to remove:")
            for word in outlier_words:
                print(f"- ID {word.id}: '{word.word[:50]}...' -> '{word.meaning[:50]}...'")
            
            # Remove these words and their library associations
            for word in outlier_words:
                # First remove from library_words table
                LibraryWord.query.filter_by(word_id=word.id).delete()
                print(f"✓ Removed library associations for word ID {word.id}")
                
                # Then remove the word itself
                db.session.delete(word)
                print(f"✓ Removed word ID {word.id}")
            
            # Commit the changes
            db.session.commit()
            print(f"\n✅ Successfully removed {len(outlier_words)} outlier words!")
            
            # Show remaining word count
            remaining_count = Word.query.count()
            print(f"📊 Remaining words in database: {remaining_count}")
            
            # Show first few remaining words to verify they're clean
            print("\n📝 First 5 remaining words:")
            clean_words = Word.query.order_by(Word.id).limit(5).all()
            for word in clean_words:
                print(f"- {word.word}: {word.meaning[:100]}...")
                
        except Exception as e:
            print(f"❌ Error removing outlier words: {e}")
            db.session.rollback()

if __name__ == '__main__':
    remove_outlier_words()
