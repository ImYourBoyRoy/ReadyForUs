# ./scripts/generate_schema_snapshots.py
"""
Scans phase directories and generates schema snapshots for JSON files.
For each phase and each JSON file (questions.json, manifest.json, prompts.json),
it extracts the structural schema (keys present) and saves it to 
{phase}_{filename}_schema.json in the respective folder.

Usage:
    python scripts/generate_schema_snapshots.py

Inputs:
    - data/phase_*/questions.json
    - data/phase_*/manifest.json
    - data/phase_*/prompts.json

Outputs:
    - data/phase_*/{phase}_questions_schema.json
    - data/phase_*/{phase}_manifest_schema.json
    - data/phase_*/{phase}_prompts_schema.json
"""

import json
import os
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PHASES = ["phase_0", "phase_1", "phase_1.5", "phase_2", "phase_2.5"]

def get_structure(data):
    """
    Recursively extracts the structure (keys and types) of a dictionary or list.
    For lists of dicts, it merges keys from all items to show a superset of possible keys.
    """
    if isinstance(data, dict):
        structure = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                structure[k] = get_structure(v)
            else:
                structure[k] = type(v).__name__
        return structure
    elif isinstance(data, list):
        if not data:
            return "list(empty)"
        
        # If list of dicts, merge structures
        if all(isinstance(i, dict) for i in data):
            merged_structure = {}
            for item in data:
                item_structure = get_structure(item)
                for k, v in item_structure.items():
                    if k not in merged_structure:
                        merged_structure[k] = v
                    # Could add logic here to handle conflicting types, but keeping simple for now
            return ["list(dict)", merged_structure]
        else:
            # List of primitives or mixed, just grab type of first non-null
            return f"list({type(data[0]).__name__})"
    else:
        return type(data).__name__

def analyze_questions_schema(questions_data):
    """
    Specifically analyzes the questions.json structure.
    Returns a summary of answer_schemas by question type.
    """
    schema_summary = {
        "root_keys": list(questions_data.keys()),
        "answer_schemas_by_type": defaultdict(dict)
    }
    
    questions = questions_data.get("questions", {})
    if isinstance(questions, dict):
        # Scan all questions
        for q_id, q_data in questions.items():
            q_type = q_data.get("type", "unknown")
            a_schema = q_data.get("answer_schema", {})
            
            # Record keys found in answer_schema for this type
            if q_type not in schema_summary["answer_schemas_by_type"]:
                 schema_summary["answer_schemas_by_type"][q_type] = {}
            
            # Merge keys (simple update for this audit)
            for k in a_schema.keys():
                schema_summary["answer_schemas_by_type"][q_type][k] = type(a_schema[k]).__name__

    return schema_summary

def process_file(phase, filename):
    phase_dir = os.path.join(DATA_DIR, phase)
    file_path = os.path.join(phase_dir, filename)
    
    if not os.path.exists(file_path):
        print(f"Skipping {phase}/{filename} (not found)")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {phase}/{filename}: {e}")
        return

    # Determine schema definition
    if filename == "questions.json":
        # Specialized analysis for questions to focus on answer_schema types
        schema_snapshot = analyze_questions_schema(data)
        # Also include raw structural dump for validity
        schema_snapshot["full_structure_sample"] = get_structure(data) 
    else:
        # Generic structural analysis
        schema_snapshot = get_structure(data)

    output_filename = f"{phase}_{filename.replace('.json', '')}_schema.json"
    output_path = os.path.join(phase_dir, output_filename)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(schema_snapshot, f, indent=4)
    
    print(f"Generated {output_filename}")

def main():
    print("Starting schema snapshot generation...")
    for phase in PHASES:
        for filename in ["questions.json", "manifest.json", "prompts.json"]:
            process_file(phase, filename)
    print("Generation complete.")

if __name__ == "__main__":
    main()
