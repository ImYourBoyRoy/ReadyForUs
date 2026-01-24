# ./scripts/export_schemas.py
"""
Export Schema Snapshots
=======================

Generates structure snapshots (schemas) for all JSON files in phase directories
and saves them to `exports/schemas/`.

Usage:
    python scripts/export_schemas.py

Key Inputs:
    - data/phase_*/questions.json
    - data/phase_*/manifest.json
    - data/phase_*/prompts.json

Key Outputs:
    - exports/schemas/{phase}_{type}_schema.json
"""

import json
import glob
import os
from collections import defaultdict

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def get_structure(data):
    """
    Recursively extracts the structure (keys and types) of a dictionary or list.
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
            return ["list(dict)", merged_structure]
        else:
            return f"list({type(data[0]).__name__})"
    else:
        return type(data).__name__

def analyze_questions_schema(questions_data):
    """
    Specifically analyzes the questions.json structure.
    """
    schema_summary = {
        "root_keys": list(questions_data.keys()),
        "answer_schemas_by_type": defaultdict(dict)
    }
    
    questions = questions_data.get("questions", {})
    if isinstance(questions, dict):
        for q_id, q_data in questions.items():
            q_type = q_data.get("type", "unknown")
            a_schema = q_data.get("answer_schema", {})
            
            if q_type not in schema_summary["answer_schemas_by_type"]:
                 schema_summary["answer_schemas_by_type"][q_type] = {}
            
            for k in a_schema.keys():
                schema_summary["answer_schemas_by_type"][q_type][k] = type(a_schema[k]).__name__

    return schema_summary

def main():
    print(f"{BOLD}Starting Schema Export...{RESET}\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    data_dir = os.path.join(base_dir, "data")
    export_dir = os.path.join(base_dir, "exports", "schemas")
    
    os.makedirs(export_dir, exist_ok=True)
    
    # Dynamic: find all phase directories
    phase_dirs = glob.glob(os.path.join(data_dir, "phase_*"))
    phase_dirs.sort()
    
    if not phase_dirs:
        print(f"{RED}No phase directories found.{RESET}")
        return

    count = 0
    for phase_path in phase_dirs:
        phase_name = os.path.basename(phase_path)
        
        for filename in ["questions.json", "manifest.json", "prompts.json"]:
            file_path = os.path.join(phase_path, filename)
            if not os.path.exists(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Generate schema logic
                if filename == "questions.json":
                    schema_snapshot = analyze_questions_schema(data)
                    schema_snapshot["full_structure_sample"] = get_structure(data)
                else:
                    schema_snapshot = get_structure(data)
                
                # Output file name: phase_0_questions_schema.json
                base_name = filename.replace('.json', '')
                target_name = f"{phase_name}_{base_name}_schema.json"
                target_path = os.path.join(export_dir, target_name)
                
                with open(target_path, 'w', encoding='utf-8') as f:
                    json.dump(schema_snapshot, f, indent=4)
                
                print(f"Exported {BOLD}{target_name}{RESET}")
                count += 1
                
            except Exception as e:
                print(f"{RED}Error processing {phase_name}/{filename}: {e}{RESET}")

    print(f"\n{GREEN}Success! Exported {count} schema files to {export_dir}{RESET}")

if __name__ == "__main__":
    main()
