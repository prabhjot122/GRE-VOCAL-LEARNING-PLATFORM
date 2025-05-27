#!/usr/bin/env python3
"""
Check for remaining outlier words in the database
"""

from app import app, db
from models import Word

def check_outliers():
    """Check for words that contain HTML tags or other formatting issues"""
    print("=== Checking for Outlier Words ===")
    
    with app.app_context():
        try:
            # Get first 20 words to check for outliers
            words = Word.query.order_by(Word.id).limit(20).all()
            
            print(f"First 20 words in database:")
            outliers = []
            
            for i, word in enumerate(words, 1):
                word_text = word.word[:100]
                meaning_text = word.meaning[:100]
                
                # Check for HTML tags, excessive formatting, or other issues
                is_outlier = (
                    '<' in word_text or '>' in word_text or
                    '<' in meaning_text or '>' in meaning_text or
                    'style=' in word_text or 'style=' in meaning_text or
                    'font-family' in word_text or 'font-family' in meaning_text or
                    len(word_text) > 50 or  # Unusually long word
                    'versus' in word_text.lower() or 'vs' in word_text.lower()
                )
                
                status = "🚨 OUTLIER" if is_outlier else "✅ Clean"
                print(f"{i:2d}. {status} - ID {word.id}: '{word_text}' -> '{meaning_text}'")
                
                if is_outlier:
                    outliers.append(word.id)
            
            print(f"\n📊 Found {len(outliers)} outlier words with IDs: {outliers}")
            
            if outliers:
                print("\n🔧 To remove these outliers, run:")
                print(f"Word.query.filter(Word.id.in_({outliers})).delete()")
                
        except Exception as e:
            print(f"❌ Error checking outliers: {e}")

if __name__ == '__main__':
    check_outliers()
