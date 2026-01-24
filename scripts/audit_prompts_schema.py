# ./scripts/audit_prompts_schema.py
"""
Audit Prompts Schema
====================

Audits all `prompts.json` files in `data/phase_*` directories to ensure they adhere to the
schema defined in `SCHEMA.md` and match the structure of `TEMPLATE_prompts.json`.

Usage:
    python scripts/audit_prompts_schema.py

Key Inputs:
    - data/phase_*/prompts.json: The prompt files to audit.
    - data/TEMPLATE_prompts.json: (Implicitly used as reference logic).

Key Outputs:
    - Console report detailing missing keys, type mismatches, or structural errors.
    - Exit code 0 if all valid, 1 if any errors found.

Operational Notes:
    - Read-only operation. Does not modify files.
    - Checks for required prompt types and internal structure (inputs, context, output_format).
"""

import json
import glob
import os
import sys
from typing import Dict, List, Any, Optional

# ANSI Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

REQUIRED_PROMPT_TYPES = [
    "individual_reflection_lite",
    "individual_reflection_full",
    "couple_reflection_lite",
    "couple_reflection_full"
]

REQUIRED_PROMPT_FIELDS = [
    "id",
    "title",
    "description",
    "role",
    "inputs",
    "context",
    "output_format",
    "constraints"
]

def load_json(path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"{RED}Error loading {path}: {e}{RESET}")
        return None

def validate_input_schema(inputs: List[Dict[str, Any]], context_prefix: str) -> List[str]:
    errors = []
    if not isinstance(inputs, list):
        errors.append(f"{context_prefix}: 'inputs' should be a list.")
        return errors

    for idx, item in enumerate(inputs):
        if not isinstance(item, dict):
             errors.append(f"{context_prefix}.inputs[{idx}]: item is not an object.")
             continue
        
        for req_field in ["key", "label", "placeholder"]:
            if req_field not in item:
                errors.append(f"{context_prefix}.inputs[{idx}]: missing required field '{req_field}'")
    return errors

def validate_output_format_schema(output_format: List[Dict[str, Any]], context_prefix: str) -> List[str]:
    errors = []
    if not isinstance(output_format, list):
        errors.append(f"{context_prefix}: 'output_format' should be a list.")
        return errors

    for idx, item in enumerate(output_format):
        if not isinstance(item, dict):
            errors.append(f"{context_prefix}.output_format[{idx}]: item is not an object.")
            continue
        
        if "section" not in item:
            errors.append(f"{context_prefix}.output_format[{idx}]: missing required field 'section'")
        if "requirements" not in item:
            errors.append(f"{context_prefix}.output_format[{idx}]: missing required field 'requirements'")
        elif not isinstance(item["requirements"], list):
            errors.append(f"{context_prefix}.output_format[{idx}].requirements: should be a list of strings")

    return errors

def audit_file(file_path: str) -> List[str]:
    errors = []
    data = load_json(file_path)
    if data is None:
        return [f"Could not load file definition"]

    if "prompts" not in data:
        return ["Missing root key: 'prompts'"]
    
    prompts_data = data["prompts"]
    
    # Check for extra or missing prompt types
    existing_keys = set(prompts_data.keys())
    required_keys = set(REQUIRED_PROMPT_TYPES)
    
    missing = required_keys - existing_keys
    if missing:
        errors.append(f"Missing prompt types: {', '.join(missing)}")
    
    # Audit each specific prompt
    for prompt_type in existing_keys:
        # If it's a known prompt type, validate structure. 
        # (We could also optionally flag unknown keys, but let's stick to validating known ones first)
        if prompt_type not in REQUIRED_PROMPT_TYPES:
            # Uncomment if we want strict schema
            # errors.append(f"Unknown prompt key found: '{prompt_type}'")
            continue
            
        prompt_obj = prompts_data[prompt_type]
        context_prefix = f"prompts.{prompt_type}"

        # 1. Structural fields
        for field in REQUIRED_PROMPT_FIELDS:
            if field not in prompt_obj:
                errors.append(f"{context_prefix}: Missing field '{field}'")
        
        # 2. Type validation for list fields
        if "context" in prompt_obj and not isinstance(prompt_obj["context"], list):
            errors.append(f"{context_prefix}.context: Must be a list of strings")
            
        if "constraints" in prompt_obj and not isinstance(prompt_obj["constraints"], list):
            errors.append(f"{context_prefix}.constraints: Must be a list of strings")
            
        # 3. Deep validation
        if "inputs" in prompt_obj:
            errors.extend(validate_input_schema(prompt_obj["inputs"], context_prefix))
            
        if "output_format" in prompt_obj:
            errors.extend(validate_output_format_schema(prompt_obj["output_format"], context_prefix))

    return errors

def main():
    print(f"{BOLD}Starting Audit of prompts.json Schema...{RESET}\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    if not os.path.exists(base_dir):
        print(f"{RED}Error: Data directory not found at {base_dir}{RESET}")
        sys.exit(1)

    # Find prompt files
    pattern = os.path.join(base_dir, "phase_*", "prompts.json")
    files = glob.glob(pattern)
    
    if not files:
        print(f"{YELLOW}No phase_*/prompts.json files found.{RESET}")
        return

    # Sort validation specifically so it looks nice (phase_0, phase_1, etc.)
    # Simple consistent sort
    files.sort()

    total_errors = 0
    files_with_errors = 0

    for file_path in files:
        # Relative path for display
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
            print("") # newline separation

    print("-" * 40)
    if total_errors == 0:
        print(f"{GREEN}SUCCESS: All {len(files)} files match the schema.{RESET}")
        sys.exit(0)
    else:
        print(f"{RED}FAILURE: Found {total_errors} errors in {files_with_errors} files.{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
