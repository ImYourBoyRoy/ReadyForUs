# ./scripts/export_questions.py
"""
Export Questions to Text
========================

Exports all `questions.json` files from `data/phase_*` directories into a clean, human-readable 
text format in `exports/questions/`.

Usage:
    python scripts/export_questions.py

Key Inputs:
    - data/phase_*/questions.json

Key Outputs:
    - exports/questions/phase_[id]_questions.txt: formatted text file.
"""

import json
import glob
import os
import sys
import argparse
import shutil

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

def format_options(options, indent_level=2):
    indent = "  " * indent_level
    lines = []
    for opt in options:
        val = opt.get('value', '')
        lbl = opt.get('label', '')
        lines.append(f"{indent}- [{val}] {lbl}")
    return "\n".join(lines)

def format_fields(fields, indent_level=2):
    indent = "  " * indent_level
    lines = []
    for f in fields:
        key = f.get('key', '')
        lbl = f.get('label', '')
        ftype = f.get('type', '')
        lines.append(f"{indent}- {key} ({ftype}): {lbl}")
        if 'options' in f:
             lines.append(format_options(f['options'], indent_level + 1))
    return "\n".join(lines)

def format_manifests(manifests):
    lines = []
    lines.append("### MANIFESTS")
    lines.append("-" * 40)
    for key, data in manifests.items():
        title = data.get('title', key)
        q_ids = data.get('question_ids', [])
        lines.append(f"MANIFEST: {title} ({key})")
        lines.append(f"  Count: {len(q_ids)}")
        # nice to print them, but might be too long? user asked for it.
        # Let's print them in a compact way
        lines.append(f"  IDs: {', '.join(q_ids)}")
        lines.append("")
    return "\n".join(lines)

def format_sections_meta(sections, questions):
    lines = []
    lines.append("### SECTIONS METADATA")
    lines.append("-" * 40)
    
    # Sort questions for consistent display
    sorted_qs = sorted(questions.values(), key=lambda x: x.get('order', 999))
    
    for s in sections:
        sid = s.get('id')
        title = s.get('title')
        order = s.get('order')
        lines.append(f"- [{sid}] {title} (Order: {order})")
        
        # List questions in this section
        sec_qs = [q for q in sorted_qs if q.get('section_id') == sid]
        for q in sec_qs:
            qid = q.get('id')
            qtitle = q.get('title', 'Untitled')
            lines.append(f"    - {qid}: {qtitle}")
            
    lines.append("")
    return "\n".join(lines)

def format_ui_hints(hints):
    if not hints: return ""
    lines = []
    lines.append("### UI HINTS")
    lines.append("-" * 40)
    lines.append(json.dumps(hints, indent=2))
    lines.append("")
    return "\n".join(lines)

def convert_to_text(data, phase_name):
    lines = []
    lines.append("=" * 80)
    lines.append(f"PHASE: {phase_name.upper()}")
    lines.append("=" * 80)
    lines.append("")
    
    questions = data.get("questions", {}) # Move up for access

    # 1. Manifests
    manifests = data.get("manifests", {})
    lines.append(format_manifests(manifests))
    
    # 2. Sections Metadata
    sections = data.get("sections", [])
    lines.append(format_sections_meta(sections, questions))
    
    # 3. UI Hints
    ui_hints = data.get("ui_hints", {})
    lines.append(format_ui_hints(ui_hints))

    lines.append("=" * 80)
    lines.append("QUESTIONS LIST")
    lines.append("=" * 80)

    questions = data.get("questions", {})
    lite_ids = set(manifests.get("lite", {}).get("question_ids", []))
    
    # Map section IDs to titles for clearer grouping
    section_map = {s['id']: s.get('title', 'Unknown Section') for s in sections}
    
    # Sort questions by order
    sorted_questions = sorted(questions.values(), key=lambda x: x.get('order', 999))

    current_section = None

    for q in sorted_questions:
        sec_id = q.get('section_id')
        if sec_id != current_section:
            current_section = sec_id
            sec_title = section_map.get(sec_id, sec_id)
            lines.append("")
            lines.append(f"### SECTION: {sec_title} ({sec_id})")
            lines.append("-" * 40)
            lines.append("")
            
        qid = q.get('id', 'N/A')
        title = q.get('title', 'Untitled')
        prompt = q.get('prompt', '')
        qtype = q.get('type', 'unknown')
        
        # Determine Mode Availability
        modes = ["FULL"]
        if qid in lite_ids:
            modes.append("LITE")
        mode_str = "/".join(sorted(modes, reverse=True)) # LITE/FULL or just FULL
        
        lines.append(f"Q{q.get('order', 0)} ({qid}) [{mode_str}] [{qtype}]: {title}")
        lines.append(f"PROMPT: {prompt}")
        
        if 'options' in q:
            lines.append("OPTIONS:")
            lines.append(format_options(q['options']))
            
        if 'fields' in q:
            lines.append("FIELDS:")
            lines.append(format_fields(q['fields']))
            
        lines.append("")

    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Export all phase questions to human-readable text files.")
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Delete existing exports/questions output before regenerating."
    )
    args = parser.parse_args()

    print(f"{BOLD}Starting Formatted Questions Export...{RESET}\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    data_dir = os.path.join(base_dir, "data")
    export_dir = os.path.join(base_dir, "exports", "questions")

    if args.clean and os.path.isdir(export_dir):
        shutil.rmtree(export_dir)

    os.makedirs(export_dir, exist_ok=True)
    
    pattern = os.path.join(data_dir, "phase_*", "questions.json")
    files = glob.glob(pattern)
    files.sort()
    
    if not files:
        print(f"{RED}No questions.json files found.{RESET}")
        return

    count = 0
    for file_path in files:
        phase_dir = os.path.basename(os.path.dirname(file_path))
        target_name = f"{phase_dir}_questions.txt"
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
