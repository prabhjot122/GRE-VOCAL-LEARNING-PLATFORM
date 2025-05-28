import csv
import io
import re
from typing import Dict, List, Tuple, Optional

class CSVColumnDetector:
    """Intelligent CSV column detector for word and meaning columns"""
    
    def __init__(self):
        # Common column names for words
        self.word_indicators = [
            'word', 'term', 'vocabulary', 'vocab', 'lexicon', 'expression',
            'phrase', 'item', 'entry', 'headword', 'lemma'
        ]
        
        # Common column names for meanings/definitions
        self.meaning_indicators = [
            'meaning', 'definition', 'def', 'description', 'explanation',
            'translation', 'sense', 'interpretation', 'significance',
            'import', 'denotation', 'connotation'
        ]
    
    def detect_columns(self, file_content: str) -> Tuple[Optional[str], Optional[str], Dict]:
        """
        Detect word and meaning columns from CSV content
        
        Returns:
            Tuple of (word_column, meaning_column, analysis_info)
        """
        try:
            # Parse CSV content
            stream = io.StringIO(file_content)
            csv_reader = csv.DictReader(stream)
            
            if not csv_reader.fieldnames:
                return None, None, {'error': 'No columns found in CSV'}
            
            # Get first few rows for content analysis
            rows = []
            for i, row in enumerate(csv_reader):
                if i >= 5:  # Analyze first 5 rows
                    break
                rows.append(row)
            
            if not rows:
                return None, None, {'error': 'No data rows found in CSV'}
            
            # Analyze columns
            column_scores = self._analyze_columns(csv_reader.fieldnames, rows)
            
            # Find best matches
            word_column = self._find_best_match(column_scores, 'word')
            meaning_column = self._find_best_match(column_scores, 'meaning')
            
            analysis_info = {
                'available_columns': list(csv_reader.fieldnames),
                'column_scores': column_scores,
                'detected_word_column': word_column,
                'detected_meaning_column': meaning_column
            }
            
            return word_column, meaning_column, analysis_info
            
        except Exception as e:
            return None, None, {'error': f'Failed to analyze CSV: {str(e)}'}
    
    def _analyze_columns(self, fieldnames: List[str], rows: List[Dict]) -> Dict:
        """Analyze each column and assign scores for word/meaning likelihood"""
        column_scores = {}
        
        for col_name in fieldnames:
            scores = {
                'word_score': 0,
                'meaning_score': 0,
                'avg_length': 0,
                'sample_values': []
            }
            
            # Analyze column name
            col_name_lower = col_name.lower().strip()
            
            # Check for word indicators
            for indicator in self.word_indicators:
                if indicator in col_name_lower:
                    scores['word_score'] += 10
                    if col_name_lower == indicator:
                        scores['word_score'] += 5  # Exact match bonus
            
            # Check for meaning indicators
            for indicator in self.meaning_indicators:
                if indicator in col_name_lower:
                    scores['meaning_score'] += 10
                    if col_name_lower == indicator:
                        scores['meaning_score'] += 5  # Exact match bonus
            
            # Analyze content
            values = []
            total_length = 0
            
            for row in rows:
                value = str(row.get(col_name, '')).strip()
                if value:
                    values.append(value)
                    total_length += len(value)
            
            if values:
                scores['avg_length'] = total_length / len(values)
                scores['sample_values'] = values[:3]  # Store first 3 samples
                
                # Content-based scoring
                # Words are typically shorter
                if scores['avg_length'] < 20:
                    scores['word_score'] += 5
                elif scores['avg_length'] > 50:
                    scores['meaning_score'] += 5
                
                # Check for typical word patterns
                word_patterns = 0
                meaning_patterns = 0
                
                for value in values:
                    # Single words or short phrases are likely words
                    if len(value.split()) <= 3 and len(value) < 25:
                        word_patterns += 1
                    
                    # Longer text with punctuation likely meanings
                    if len(value) > 30 or '.' in value or ',' in value:
                        meaning_patterns += 1
                
                if word_patterns > meaning_patterns:
                    scores['word_score'] += 3
                elif meaning_patterns > word_patterns:
                    scores['meaning_score'] += 3
            
            column_scores[col_name] = scores
        
        return column_scores
    
    def _find_best_match(self, column_scores: Dict, target_type: str) -> Optional[str]:
        """Find the best matching column for word or meaning"""
        score_key = f'{target_type}_score'
        best_column = None
        best_score = 0
        
        for col_name, scores in column_scores.items():
            score = scores.get(score_key, 0)
            if score > best_score:
                best_score = score
                best_column = col_name
        
        # Require minimum score to avoid false positives
        min_score = 3 if target_type == 'word' else 3
        return best_column if best_score >= min_score else None
    
    def get_mapping_suggestions(self, fieldnames: List[str]) -> Dict:
        """Get suggestions for manual column mapping"""
        suggestions = {
            'word_suggestions': [],
            'meaning_suggestions': []
        }
        
        for col_name in fieldnames:
            col_lower = col_name.lower().strip()
            
            # Check word indicators
            for indicator in self.word_indicators:
                if indicator in col_lower:
                    suggestions['word_suggestions'].append(col_name)
                    break
            
            # Check meaning indicators
            for indicator in self.meaning_indicators:
                if indicator in col_lower:
                    suggestions['meaning_suggestions'].append(col_name)
                    break
        
        return suggestions
