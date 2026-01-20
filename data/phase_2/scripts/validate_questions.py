# ./data/phase_2/scripts/validate_questions.py
"""
Validates individual question JSON files in data/phase_2/questions/.

Usage:
    python data/phase_2/scripts/validate_questions.py

Checks:
    - JSON syntax
    - Required fields (id, section_id, order, title, prompt, type, answer_schema, tags)
    - Consistency of ID with filename
    - Options presence for select types
    - Answer schema keys match fields (for compound)
"""

import os
import json
import re

QUESTIONS_DIR = r'data\phase_2\questions'

REQUIRED_FIELDS = [
    "id", "section_id", "order", "title", "prompt", "type", "answer_schema", "tags"
]

def validate_file(filepath):
    errors = []
    filename = os.path.basename(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"Invalid JSON in {filename}: {e}"]
    except Exception as e:
        return [f"Error reading {filename}: {e}"]

    # 1. ID Consistency
    expected_id = filename.replace('.json', '')
    if data.get('id') != expected_id:
        errors.append(f"ID mismatch: found '{data.get('id')}', expected '{expected_id}'")

    # 2. Required Fields
    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"Missing required field: '{field}'")
            
    # 3. Type Validation
    qtype = data.get('type')
    if qtype in ['single_select', 'multi_select', 'ranked_select']:
        if 'options' not in data or not isinstance(data.get('options'), list):
            errors.append(f"Missing or invalid 'options' for type '{qtype}'")
        elif len(data['options']) == 0:
            errors.append(f"Empty 'options' list for type '{qtype}'")
            
    # 4. Compound Validation
    if qtype == 'compound':
        fields = data.get('fields', [])
        schema = data.get('answer_schema', {})
        
        if not fields:
             errors.append("Compound question missing 'fields' list")
        
        for field in fields:
            key = field.get('key')
            if key not in schema:
                errors.append(f"Compound field key '{key}' missing from 'answer_schema'")
                
    # 5. Schema check
    if 'answer_schema' in data:
        schema = data['answer_schema']
        if not isinstance(schema, dict):
             errors.append("'answer_schema' must be an object")

    return errors

def main():
    if not os.path.exists(QUESTIONS_DIR):
        print(f"Directory not found: {QUESTIONS_DIR}")
        return

    files = sorted([f for f in os.listdir(QUESTIONS_DIR) if f.endswith('.json')])
    print(f"Validating {len(files)} files found in {QUESTIONS_DIR}...")
    
    total_errors = 0
    
    for f in files:
        filepath = os.path.join(QUESTIONS_DIR, f)
        errors = validate_file(filepath)
        if errors:
            print(f"FAIL: {f}")
            for err in errors:
                print(f"  - {err}")
            total_errors += 1
        else:
            # print(f"PASS: {f}") # quiet success
            pass
            
    if total_errors == 0:
        print("SUCCESS: All files passed validation.")
    else:
        print(f"\nFound errors in {total_errors} files.")
        exit(1)

if __name__ == "__main__":
    main()
