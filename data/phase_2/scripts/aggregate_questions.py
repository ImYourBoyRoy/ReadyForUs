# ./data/phase_2/scripts/aggregate_questions.py
"""
Aggregates individual q##.json files into a single questions.json file.
Matches the structure of data/TEMPLATE_questions.json.

Usage:
    python data/phase_2/scripts/aggregate_questions.py
"""

import os
import json
import re

QUESTIONS_NEW_TXT = r'data\phase_2\questions_new.txt'
QUESTIONS_DIR = r'data\phase_2\questions'
OUTPUT_FILE = r'data\phase_2\questions.json'

def parse_sections(txt_path):
    sections = []
    current_section = None
    
    with open(txt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        # SECTION s1 — WARM START (...)
        match = re.match(r'SECTION (s\d+) — (.+)', line)
        if match:
            sid = match.group(1)
            raw_title = match.group(2).strip()
            # Clean title: remove (...) if present at end
            title = re.sub(r'\s*\(.*\)$', '', raw_title)
            
            current_section = {
                "id": sid,
                "title": title,
                "question_ids": []
            }
            sections.append(current_section)
            
    return sections

def main():
    # 1. Get Sections skeleton
    sections = parse_sections(QUESTIONS_NEW_TXT)
    section_map = {s['id']: s for s in sections}
    
    # 2. Read Questions
    questions_map = {}
    if not os.path.exists(QUESTIONS_DIR):
        print(f"Error: {QUESTIONS_DIR} does not exist.")
        return

    files = sorted([f for f in os.listdir(QUESTIONS_DIR) if f.endswith('.json')])
    
    for f in files:
        path = os.path.join(QUESTIONS_DIR, f)
        with open(path, 'r', encoding='utf-8') as qf:
            q_data = json.load(qf)
            qid = q_data['id']
            sid = q_data['section_id']
            
            # Add to questions map
            questions_map[qid] = q_data
            
            # Add to section
            if sid in section_map:
                section_map[sid]['question_ids'].append(qid)
            else:
                print(f"Warning: Question {qid} has unknown section {sid}")

    # 3. Build Manifests
    lite_ids = []
    full_ids = []
    
    # Sort questions by order/id to ensure manifest order
    sorted_qids = sorted(questions_map.keys(), key=lambda k: questions_map[k]['order'])
    
    for qid in sorted_qids:
        tags = questions_map[qid].get('tags', {}).get('included_in_manifests', [])
        if 'lite' in tags:
            lite_ids.append(qid)
        if 'full' in tags:
            full_ids.append(qid)
            
    manifests = {
        "lite": {
            "id": "lite",
            "title": "Lite Check-in",
            "question_ids": lite_ids,
            "timebox_minutes": 30,
            "post_timebox_activity": "Take a break and do something enjoyable."
        },
        "full": {
            "id": "full",
            "title": "Full Check-in",
            "question_ids": full_ids,
            "timebox_minutes": 60,
            "post_timebox_activity": "Rest and reconnect before continuing."
        }
    }

    # 4. UI Hints
    ui_hints = {
        "controls": {
            "mode_switcher": {
                "default": "lite",
                "options": [
                    {
                        "id": "lite",
                        "label": f"Lite ({len(lite_ids)})"
                    },
                    {
                        "id": "full",
                        "label": f"Full ({len(full_ids)})"
                    }
                ]
            }
        }
    }

    # 5. Assemble Final JSON
    final_output = {
        "sections": sections,
        "questions": questions_map,
        "ui_hints": ui_hints,
        "manifests": manifests,
        "primary_manifest_id": "lite"
    }
    
    # 6. Write
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated {OUTPUT_FILE}")
    print(f"  - Questions: {len(questions_map)}")
    print(f"  - Sections: {len(sections)}")
    print(f"  - Lite count: {len(lite_ids)}")
    print(f"  - Full count: {len(full_ids)}")

if __name__ == "__main__":
    main()
