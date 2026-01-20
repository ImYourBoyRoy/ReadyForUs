# ./data/phase_2/scripts/convert_questions.py
"""
Converts questions_new.txt to individual JSON files in data/phase_2/questions/.

Usage:
    python data/phase_2/scripts/convert_questions.py

Inputs:
    - data/phase_2/questions_new.txt

Outputs:
    - data/phase_2/questions/q##.json files
"""

import os
import re
import json
from enum import Enum
from typing import List, Dict, Any, Optional

# --- Constants & Configuration ---
INPUT_FILE = r'data\phase_2\questions_new.txt'
OUTPUT_DIR = r'data\phase_2\questions'
LITE_IDS = {
    "q01", "q02", "q03", "q05", "q06", "q07", "q08", "q09", "q10", "q11",
    "q14", "q16", "q19", "q20", "q22", "q24", "q25", "q28", "q29", "q33",
    "q37", "q39"
}

def ensure_dir(directory: str):
    if not os.path.exists(directory):
        os.makedirs(directory)

def clean_key(text: str) -> str:
    words = text.split()[:4]
    key = "_".join(words).lower()
    key = re.sub(r'[^a-z0-9_]', '', key)
    if key and key[0].isdigit():
        key = "f_" + key
    return key[:30]

def clean_value(text: str) -> str:
    if "other (write in)" in text.lower():
        return "other"
    words = text.split()
    if ":" in words[0]:
        return words[0].replace(":", "").lower()
    val = "_".join(words[:3]).lower()
    val = re.sub(r'[^a-z0-9_]', '', val)
    return val[:30]

def parse_fields(lines: List[str]) -> List[Dict[str, Any]]:
    fields = []
    current_field = None
    existing_keys = set()
    
    # Strict start of line dash for fields
    field_start_re = re.compile(r'^- (.+?)(?: \((.+?)\))?(:.*|$)')
    
    # Indented dash for options (at least 2 spaces)
    option_re = re.compile(r'^\s{2,}- (.+)')
    
    # Label-less field pattern: "- (type):"
    labelless_re = re.compile(r'^- \(([^)]+)\):(.*)')

    for line in lines:
        if not line.strip(): continue
        
        if "implementation notes" in line.lower() or "answer_schema" in line.lower():
             break

        # 1. OPTION CHECK (Indented)
        sub_match = option_re.match(line)
        if sub_match and current_field:
            if 'options' not in current_field:
                current_field['options'] = []
            content = sub_match.group(1).strip()
            val = clean_value(content)
            current_field['options'].append({"value": val, "label": content})
            continue

        # 2. FIELD CHECK (Start of line)
        if line.startswith("- "):
            # Check for label-less field "- (single_select): options"
            labelless = labelless_re.match(line)
            if labelless:
                if current_field: fields.append(current_field)
                
                type_raw = labelless.group(1).strip()
                rest = labelless.group(2).strip()
                label_raw = "Options" 
                base_key = "choice"   
                
                key = base_key
                counter = 2
                while key in existing_keys:
                    key = f"{base_key}_{counter}"
                    counter += 1
                existing_keys.add(key)
                
                ftype = "short_text"
                if type_raw:
                    t_lower = type_raw.lower()
                    if "single_select" in t_lower: ftype = "single_select"
                    elif "multi_select" in t_lower: ftype = "multi_select"
                    elif "ranked_select" in t_lower: ftype = "ranked_select"
                    elif "number" in t_lower: ftype = "number"
                    elif "free_text" in t_lower: ftype = "free_text"
                
                current_field = {
                    "key": key,
                    "label": label_raw,
                    "type": ftype
                }
                
                if rest:
                    opts = [o.strip() for o in rest.split(',')]
                    current_field['options'] = [{"value": clean_value(o), "label": o} for o in opts]
                continue


            match = field_start_re.match(line)
            if match:
                if current_field: fields.append(current_field)
                
                label_raw = match.group(1).strip()
                type_raw = match.group(2)
                rest = match.group(3).strip() if match.group(3) else ""
                
                if label_raw.lower().startswith("implementation notes") or label_raw.lower().startswith("answer_schema"):
                    continue

                base_key = clean_key(label_raw)
                if not base_key: base_key = "field"

                key = base_key
                counter = 2
                while key in existing_keys:
                    key = f"{base_key}_{counter}"
                    counter += 1
                existing_keys.add(key)
                
                ftype = "short_text"
                if type_raw:
                    t_lower = type_raw.lower()
                    if "single_select" in t_lower: ftype = "single_select"
                    elif "multi_select" in t_lower: ftype = "multi_select"
                    elif "ranked_select" in t_lower: ftype = "ranked_select"
                    elif "number" in t_lower: ftype = "number"
                    elif "free_text" in t_lower: ftype = "free_text"
                    elif "short_text" in t_lower: ftype = "short_text"
                
                if "notes" in list(label_raw.lower().split()):
                     key = "notes"
                     if "optional" in label_raw.lower():
                         label_raw = "Notes"
                     ftype = "free_text"

                current_field = {
                    "key": key,
                    "label": label_raw,
                    "type": ftype
                }
                
                if rest and rest.startswith(":"):
                     rest = rest[1:].strip()

                if rest and (ftype == "single_select" or ftype == "multi_select"):
                     opts = [o.strip() for o in rest.split(',')]
                     current_field['options'] = [{"value": clean_value(o), "label": o} for o in opts]

    if current_field:
        if current_field['label'].lower() not in ["implementation notes", "answer_schema"]:
             fields.append(current_field)
        
    return fields

def process_question_block(block: List[str], current_section_id: str) -> Dict[str, Any]:
    header = block[0].strip()
    id_match = re.match(r'(q\d+)', header)
    if not id_match: return None
    qid = id_match.group(1)
    
    parts = header.split("—", 1)
    if len(parts) > 1:
        rest = parts[1].strip()
        type_match = re.search(r'\(([^)]+)\)$', rest)
        if type_match:
            title = rest[:type_match.start()].strip()
            type_str = type_match.group(1).lower()
        else:
            title = rest
            type_str = "free_text"
    else:
        title = "Unknown"
        type_str = "free_text"

    qtype = "free_text"
    if "compound" in type_str: qtype = "compound"
    elif "single_select" in type_str: qtype = "single_select"
    elif "multi_select" in type_str: qtype = "multi_select"
    elif "ranked_select" in type_str: qtype = "compound"

    prompt = ""
    options = []
    fields_data = []
    
    mode = "prompt"
    field_lines = []

    for line in block[1:]:
        clean_line = line.strip()
        # Preserve original line with indentation for field parser
        raw_line = line 
        
        if not clean_line: continue
        
        if clean_line.lower().startswith("prompt:"):
            prompt = clean_line[7:].strip()
            continue
        
        if clean_line.lower().startswith("options:"):
            mode = "options"
            continue
            
        if clean_line.lower().startswith("fields:"):
            mode = "fields"
            continue
            
        if clean_line.lower().startswith("showwhen:"):
            mode = "show_when"
            continue
            
        if clean_line.lower().startswith("implementation notes"):
             break 

        if mode == "options":
            if clean_line.startswith("-"):
                 content = clean_line[2:].strip()
                 val = clean_value(content)
                 options.append({"value": val, "label": content})
        
        elif mode == "fields":
            # Pass original line (with indent) to field parser
            field_lines.append(raw_line)
            
    if field_lines:
        fields_data = parse_fields(field_lines)

    answer_schema = {}
    if qtype == "free_text":
        answer_schema["text"] = ""
    elif qtype == "single_select":
        answer_schema["selected_value"] = ""
        answer_schema["other_text"] = ""
        answer_schema["notes"] = ""
    elif qtype == "multi_select":
        answer_schema["selected_values"] = []
        answer_schema["other_text"] = ""
        answer_schema["notes"] = ""
    elif qtype == "compound":
        for f in fields_data:
            if f['type'] == 'multi_select' or f['type'] == 'ranked_select':
                answer_schema[f['key']] = []
            else:
                answer_schema[f['key']] = ""
    
    tags = ["lite", "full"] if qid in LITE_IDS else ["full"]

    show_when = None
    if qid == "q30":
        show_when = {"field": "q29", "in": ["yes", "unsure"]}
    
    q_obj = {
        "id": qid,
        "section_id": current_section_id,
        "order": int(qid[1:]),
        "title": title,
        "prompt": prompt,
        "type": qtype,
        "answer_schema": answer_schema,
        "tags": {
            "included_in_manifests": tags
        }
    }
    
    if options:
        q_obj["options"] = options
    if fields_data:
        q_obj["fields"] = fields_data
    if show_when:
        q_obj["showWhen"] = show_when
        
    return q_obj

def split_into_blocks(text):
    lines = text.split('\n')
    blocks = []
    current_block = []
    current_section = "s1"
    
    for line in lines:
        if line.startswith("SECTION s"):
            match = re.search(r'SECTION (s\d+)', line)
            if match:
                current_section = match.group(1)
            continue
            
        if re.match(r'^q\d+ —', line):
            if current_block:
                blocks.append((current_block, current_section))
            current_block = [line]
        else:
            if current_block:
                current_block.append(line)
                
    if current_block:
        blocks.append((current_block, current_section))
        
    return blocks

def main():
    ensure_dir(OUTPUT_DIR)
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    blocks = split_into_blocks(content)
    print(f"Found {len(blocks)} question blocks.")
    
    for block_lines, section_id in blocks:
        try:
            q_data = process_question_block(block_lines, section_id)
            if q_data:
                filename = f"{q_data['id']}.json"
                filepath = os.path.join(OUTPUT_DIR, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(q_data, f, indent=2)
                print(f"Generated {filename}")
        except Exception as e:
            print(f"Error processing block {block_lines[0].strip() if block_lines else '?'}: {e}")

if __name__ == "__main__":
    main()
