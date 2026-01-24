# ./scripts/export_prompts.py
"""
Export Prompts to Text
======================

Exports all `prompts.json` files from `data/phase_*` directories into a clean, human-readable 
text format in `exports/prompts/`.

Usage:
    python scripts/export_prompts.py

Key Inputs:
    - data/phase_*/prompts.json

Key Outputs:
    - exports/prompts/phase_[id]_prompts.txt: formatted text file.
"""

import json
import glob
import os
import sys

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"{RED}Error loading {path}: {e}{RESET}")
        return None

def format_list(items, indent_level=0):
    indent = "  " * indent_level
    if not items:
        return f"{indent}(None)"
    return "\n".join([f"{indent}- {item}" for item in items])

def format_output_format(output_schema):
    lines = []
    for section in output_schema:
        lines.append(f"  [{section.get('section', 'Untitled Section')}]")
        requirements = section.get('requirements', [])
        for req in requirements:
            lines.append(f"    - {req}")
    return "\n".join(lines)

def convert_to_text(data, phase_name):
    lines = []
    lines.append("=" * 80)
    lines.append(f"PHASE: {phase_name.upper()}")
    lines.append("=" * 80)
    lines.append("")

    prompts = data.get("prompts", {})
    
    # Define a consistent order if possible, or just sort
    prompt_order = [
        "individual_reflection_lite",
        "individual_reflection_full",
        "couple_reflection_lite",
        "couple_reflection_full"
    ]
    
    # Get all keys, ensuring we cover any custom ones too, but prioritizing standard ones
    all_keys = list(prompts.keys())
    sorted_keys = [k for k in prompt_order if k in all_keys] + [k for k in all_keys if k not in prompt_order]

    for key in sorted_keys:
        p = prompts[key]
        
        lines.append("-" * 80)
        lines.append(f"PROMPT TYPE: {key}")
        lines.append("-" * 80)
        lines.append(f"ID:          {p.get('id', 'N/A')}")
        lines.append(f"TITLE:       {p.get('title', 'N/A')}")
        lines.append(f"DESCRIPTION: {p.get('description', 'N/A')}")
        lines.append("")
        
        lines.append("ROLE:")
        lines.append(f"{p.get('role', 'N/A')}")
        lines.append("")
        
        lines.append("CONTEXT:")
        lines.append(format_list(p.get("context", [])))
        lines.append("")
        
        lines.append("OUTPUT FORMAT:")
        lines.append(format_output_format(p.get("output_format", [])))
        lines.append("")
        
        lines.append("CONSTRAINTS:")
        lines.append(format_list(p.get("constraints", [])))
        lines.append("")
        lines.append("")

    return "\n".join(lines)

def main():
    print(f"{BOLD}Starting Formatted Prompts Export...{RESET}\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    data_dir = os.path.join(base_dir, "data")
    export_dir = os.path.join(base_dir, "exports", "prompts")
    
    os.makedirs(export_dir, exist_ok=True)
    
    pattern = os.path.join(data_dir, "phase_*", "prompts.json")
    files = glob.glob(pattern)
    files.sort()
    
    if not files:
        print(f"{RED}No prompts.json files found.{RESET}")
        return

    count = 0
    for file_path in files:
        phase_dir = os.path.basename(os.path.dirname(file_path))
        target_name = f"{phase_dir}_prompts.txt"
        target_path = os.path.join(export_dir, target_name)
        
        data = load_json(file_path)
        if data:
            try:
                formatted_text = convert_to_text(data, phase_dir)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(formatted_text)
                
                print(f"Exported {BOLD}{phase_dir}{RESET} -> {target_name}")
                count += 1
            except Exception as e:
                print(f"{RED}Failed to write {target_name}: {e}{RESET}")
                
    print(f"\n{GREEN}Success! Exported {count} formatted files to {export_dir}{RESET}")

if __name__ == "__main__":
    main()
