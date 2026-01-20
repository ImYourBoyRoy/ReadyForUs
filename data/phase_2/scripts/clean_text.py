# ./data/phase_2/scripts/clean_text.py
"""
Replaces smart quotes/unicode characters with ASCII equivalents in JSON files.
Properly loads JSON, walks the structure, cleans strings, and saves back.
Also removes internal double quotes to make labels cleaner (e.g. 10 = "ready" -> 10 = ready).

Usage:
    python data/phase_2/scripts/clean_text.py
"""

import os
import json

QUESTIONS_DIR = r'data\phase_2\questions'

# Unicode replacements
REPLACEMENTS = {
    "\u201c": "",   # Left double quote -> remove
    "\u201d": "",   # Right double quote -> remove
    "\u2018": "'",   # Left single quote -> ascii single
    "\u2019": "'",   # Right single quote -> ascii single
    "\u2013": "-",   # En dash -> hyphen
    "\u2014": "-",   # Em dash -> hyphen
    "\u2026": "..."  # Ellipsis
}

def clean_string(s):
    if not isinstance(s, str):
        return s
    
    # 1. Replace/Smart Quote removal
    for unicode_char, ascii_char in REPLACEMENTS.items():
        s = s.replace(unicode_char, ascii_char)
    
    # 2. Strip standard double quotes from content for cleaner look
    # e.g. '10 = "ready"' -> '10 = ready'
    # We only remove double quotes from the content string itself.
    # JSON structure is safe because we are operating on the parsed value.
    if '"' in s:
        s = s.replace('"', '')
        
    return s.strip()

def clean_structure(obj):
    if isinstance(obj, dict):
        return {k: clean_structure(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_structure(x) for x in obj]
    elif isinstance(obj, str):
        return clean_string(obj)
    else:
        return obj

def clean_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        cleaned_data = clean_structure(data)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            # ensure_ascii=True is default, but straight quotes " won't be escaped as \u0022, just \"
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
            
        return True

    except Exception as e:
        print(f"Error processing {os.path.basename(filepath)}: {e}")
        return False

def main():
    if not os.path.exists(QUESTIONS_DIR):
        print(f"Directory not found: {QUESTIONS_DIR}")
        return

    files = sorted([f for f in os.listdir(QUESTIONS_DIR) if f.endswith('.json')])
    print(f"Cleaning {len(files)} files in {QUESTIONS_DIR}...")
    
    count = 0
    for f in files:
        if clean_file(os.path.join(QUESTIONS_DIR, f)):
            count += 1
            
    print(f"Finished. Processed {count} files.")

if __name__ == "__main__":
    main()
