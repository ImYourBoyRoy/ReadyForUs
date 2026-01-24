# ./scripts/audit_questions_schema.py
"""
Audit Questions Schema
======================

Audits all `questions.json` files in `data/phase_*` directories to ensure they adhere to the
schema logic defined in `TEMPLATE_questions.json` and the web application's requirements.

Usage:
    python scripts/audit_questions_schema.py

Key Inputs:
    - data/phase_*/questions.json: The files to audit.
    - data/TEMPLATE_questions.json: Reference for top-level keys.

Key Outputs:
    - Console report detailing missing keys, broken IDs, or schema mismatches.
    - Exit code 0 if all valid, 1 if any errors found.

Operational Notes:
    - Checks referential integrity (section.question_ids -> questions).
    - Checks manifest integrity (manifest.question_ids -> questions).
    - Validates answer_schema against question type and fields.
"""

import json
import glob
import os
import sys
from typing import Dict, List, Any, Set, Optional

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

def load_json(path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"{RED}Error loading {path}: {e}{RESET}")
        return None

def validate_integrity(data: Dict[str, Any], context: str) -> List[str]:
    errors = []
    
    if "questions" not in data:
        return [f"{context}: Missing 'questions' object"]
        
    questions = data["questions"]
    question_ids = set(questions.keys())
    
    # 1. Validate Sections
    if "sections" in data:
        total_section_q_ids = 0
        for section in data["sections"]:
            sid = section.get("id", "unknown")
            if "question_ids" not in section:
                errors.append(f"{context}.sections[{sid}]: Missing 'question_ids'")
                continue
            
            for qid in section["question_ids"]:
                if qid not in question_ids:
                    errors.append(f"{context}.sections[{sid}]: References unknown question ID '{qid}'")
                total_section_q_ids += 1
                
        # Optional: Check if all questions are in a section? 
        # (Not strictly required by schema but good practice, skipping for now to be loose)

    # 2. Validate Manifests
    if "manifests" in data:
        for mid, manifest in data["manifests"].items():
            if "question_ids" not in manifest:
                errors.append(f"{context}.manifests[{mid}]: Missing 'question_ids'")
                continue
                
            for qid in manifest["question_ids"]:
                if qid not in question_ids:
                    errors.append(f"{context}.manifests[{mid}]: References unknown question ID '{qid}'")

    return errors

def validate_question_schema(qid: str, q: Dict[str, Any], context: str) -> List[str]:
    errors = []
    prefix = f"{context}.questions[{qid}]"
    
    # Check required base fields
    for field in ["id", "type", "title", "prompt", "answer_schema"]:
        if field not in q:
            errors.append(f"{prefix}: Missing required field '{field}'")
            
    if "type" not in q:
        return errors # logical stop
        
    qtype = q["type"]
    schema = q.get("answer_schema", {})
    
    # Type-specific validation
    if qtype == "single_select":
        if "options" not in q:
            errors.append(f"{prefix}: Missing 'options' for single_select")
        if "selected_value" not in schema:
            errors.append(f"{prefix}.answer_schema: Missing 'selected_value'")
            
    elif qtype == "multi_select":
        if "options" not in q:
            errors.append(f"{prefix}: Missing 'options' for multi_select")
        if "selected_values" not in schema:
             errors.append(f"{prefix}.answer_schema: Missing 'selected_values'")
             
    elif qtype == "compound":
        if "fields" not in q:
            errors.append(f"{prefix}: Missing 'fields' for compound question")
        else:
            # Check that answer_schema has keys for all fields
            field_keys = {f["key"] for f in q["fields"] if "key" in f}
            schema_keys = set(schema.keys())
            
            # Note: explicit check - are all fields represented?
            # We allow extra keys (like 'notes' or 'other_text' if generic), 
            # but usually compound schema keys match field keys exactly.
            
            # Exception: 'notes' might be common but not a field? 
            # Actually for compound, typically every schema key comes from a field 
            # OR generic 'notes' if defined.
            
            missing_schema_keys = field_keys - schema_keys
            if missing_schema_keys:
                 errors.append(f"{prefix}.answer_schema: Missing keys for fields: {missing_schema_keys}")

    elif qtype == "free_text":
        if "text" not in schema:
             errors.append(f"{prefix}.answer_schema: Missing 'text'")
             
    # Check for 'notes' key consistency
    # (If using notes, usually it's in answer_schema, code typically handles it if present)
    
    return errors

def audit_file(file_path: str) -> List[str]:
    errors = []
    data = load_json(file_path)
    if data is None:
        return ["Could not load file"]
        
    # Top level check
    for key in ["sections", "questions", "manifests", "primary_manifest_id"]:
        if key not in data:
            errors.append(f"Missing top-level key: '{key}'")
            
    integrity_errors = validate_integrity(data, "root")
    errors.extend(integrity_errors)
    
    if "questions" in data:
        for qid, q in data["questions"].items():
            q_errors = validate_question_schema(qid, q, "root")
            errors.extend(q_errors)
            
    return errors

def main():
    print(f"{BOLD}Starting Audit of questions.json Schema...{RESET}\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    if not os.path.exists(base_dir):
        print(f"{RED}Error: Data directory not found{RESET}")
        sys.exit(1)
        
    pattern = os.path.join(base_dir, "phase_*", "questions.json")
    files = glob.glob(pattern)
    files.sort()
    
    if not files:
        print(f"{YELLOW}No phase_*/questions.json files found.{RESET}")
        return

    total_errors = 0
    files_with_errors = 0

    for file_path in files:
        rel_path = os.path.relpath(file_path, os.path.dirname(os.path.dirname(__file__)))
        print(f"Checking {BOLD}{rel_path}{RESET}...", end=" ")
        
        file_errors = audit_file(file_path)
        
        if not file_errors:
            print(f"{GREEN}OK{RESET}")
        else:
            print(f"{RED}FAIL{RESET}")
            files_with_errors += 1
            for err in file_errors:
                print(f"  - {err}")
                total_errors += 1
            print("")

    print("-" * 40)
    if total_errors == 0:
        print(f"{GREEN}SUCCESS: All {len(files)} files match the schema.{RESET}")
        sys.exit(0)
    else:
        print(f"{RED}FAILURE: Found {total_errors} errors in {files_with_errors} files.{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
