#!/usr/bin/env python3
"""
Remove ALL outlier words from the database that contain HTML or formatting issues
"""

from app import app, db
from models import Word, LibraryWord
from sqlalchemy import or_

def remove_all_outliers():
    """Remove all words that contain HTML tags or other formatting issues"""
    print("=== Removing ALL Outlier Words ===")
    
    with app.app_context():
        try:
            # Find all words with HTML tags or formatting issues
            outlier_conditions = [
                Word.word.like('%<%'),
                Word.word.like('%>%'),
                Word.word.like('%style=%'),
                Word.word.like('%font-family%'),
                Word.word.like('%<div>%'),
                Word.word.like('%</div>%'),
                Word.word.like('%<h3%'),
                Word.word.like('%</h3>%'),
                Word.word.like('%<i>%'),
                Word.word.like('%</i>%'),
                Word.word.like('%<b>%'),
                Word.word.like('%</b>%'),
                Word.word.like('%<span%'),
                Word.word.like('%</span>%'),
                Word.word.like('%""""%'),  # Multiple quotes
                Word.word.like('%[%versus%]%'),  # Comparison entries
                Word.word.like('%[%vs%]%'),
                Word.meaning.like('%<%'),
                Word.meaning.like('%>%'),
                Word.meaning.like('%style=%'),
                Word.meaning.like('%font-family%'),
                Word.meaning.like('%<div>%'),
                Word.meaning.like('%</div>%'),
                Word.meaning.like('%&nbsp;%'),  # HTML entities
                Word.meaning.like('%<br>%'),
            ]
            
            outlier_words = Word.query.filter(or_(*outlier_conditions)).all()
            
            print(f"Found {len(outlier_words)} outlier words to remove:")
            
            # Show first 10 outliers as examples
            for i, word in enumerate(outlier_words[:10], 1):
                print(f"{i:2d}. ID {word.id}: '{word.word[:50]}...' -> '{word.meaning[:50]}...'")
            
            if len(outlier_words) > 10:
                print(f"    ... and {len(outlier_words) - 10} more")
            
            if outlier_words:
                # Remove these words and their library associations
                outlier_ids = [word.id for word in outlier_words]
                
                # First remove from library_words table
                deleted_associations = LibraryWord.query.filter(LibraryWord.word_id.in_(outlier_ids)).delete()
                print(f"✓ Removed {deleted_associations} library associations")
                
                # Then remove the words themselves
                deleted_words = Word.query.filter(Word.id.in_(outlier_ids)).delete()
                print(f"✓ Removed {deleted_words} outlier words")
                
                # Commit the changes
                db.session.commit()
                print(f"\n✅ Successfully removed {len(outlier_words)} outlier words!")
                
                # Show remaining word count
                remaining_count = Word.query.count()
                print(f"📊 Remaining words in database: {remaining_count}")
                
                # Show first few remaining words to verify they're clean
                print("\n📝 First 5 remaining words (alphabetically):")
                clean_words = Word.query.order_by(Word.word).limit(5).all()
                for word in clean_words:
                    print(f"- {word.word}: {word.meaning[:100]}...")
            else:
                print("✅ No outlier words found!")
                
        except Exception as e:
            print(f"❌ Error removing outlier words: {e}")
            db.session.rollback()

if __name__ == '__main__':
    remove_all_outliers()
