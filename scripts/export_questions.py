# ./scripts/export_questions.py
"""
Exports questions from phases 0, 1, 1.5, and 2.5 to questions.txt files in their respective folders.

Usage:
    python scripts/export_questions.py

Inputs:
    - data/phase_0/questions.json
    - data/phase_1/questions.json
    - data/phase_1.5/questions.json
    - data/phase_2.5/questions.json

Outputs:
    - data/phase_0/questions.txt
    - data/phase_1/questions.txt
    - data/phase_1.5/questions.txt
    - data/phase_2.5/questions.txt
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

PHASES = ["phase_0", "phase_1", "phase_1.5", "phase_2.5"]

def format_question(q_data):
    lines = []
    # Add a blank line between questions for better readability
    lines.append("") 
    lines.append(f"[{q_data.get('id', 'N/A')}] {q_data.get('title', 'Untitled')}")
    lines.append(f"{q_data.get('prompt', '')}")
    
    q_type = q_data.get('type')
    
    # For compound questions, list the sub-field labels as they are effectively questions
    if q_type == 'compound' and 'fields' in q_data:
        for field in q_data['fields']:
            f_label = field.get('label', '')
            lines.append(f"  - {f_label}")

    return "\n".join(lines)

def process_phase(phase_name):
    phase_dir = os.path.join(DATA_DIR, phase_name)
    json_path = os.path.join(phase_dir, "questions.json")
    txt_path = os.path.join(phase_dir, "questions.txt")

    if not os.path.exists(json_path):
        print(f"Skipping {phase_name}: questions.json not found.")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {phase_name}: {e}")
        return

    sections = data.get("sections", [])
    questions_map = data.get("questions", {})
    
    # Collect all question IDs in order
    ordered_ids = []
    for section in sections:
        ordered_ids.extend(section.get("question_ids", []))

    # Determine unique IDs to avoid duplicates if any, but preserve order
    seen = set()
    unique_ordered_ids = []
    for qid in ordered_ids:
        if qid not in seen:
            unique_ordered_ids.append(qid)
            seen.add(qid)
    
    # Also check if there are orphan questions not in sections (unlikely but good to check)
    for qid in questions_map:
        if qid not in seen:
            unique_ordered_ids.append(qid)

    output_lines = []
    output_lines.append(f"Questions Export for {phase_name}")
    output_lines.append("=" * 40)
    output_lines.append("")

    for qid in unique_ordered_ids:
        q_data = questions_map.get(qid)
        if q_data:
            output_lines.append(format_question(q_data))
        else:
            print(f"Warning: Question ID {qid} found in sections but not in questions map.")

    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(output_lines))
    
    print(f"Exported {len(unique_ordered_ids)} questions to {txt_path}")

def main():
    print("Starting export...")
    for phase in PHASES:
        process_phase(phase)
    print("Export complete.")

if __name__ == "__main__":
    main()
