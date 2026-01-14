# ./scripts/convert_questions_md.py
"""
Converts Phase 1 questions.md to questions.json format.

Usage:
    python scripts/convert_questions_md.py

Inputs:
    - data/phase_1/questions.md (markdown question definitions)

Outputs:
    - data/phase_1/questions.json (structured JSON)

Notes:
    - Parses markdown structure: ## Section, ### Question headers
    - Extracts question types, options, fields, examples
    - Generates proper answer_schema based on question type
    - Creates lite/full manifests based on [LITE]/[FULL] markers
"""

import json
import re
from pathlib import Path

def parse_options(lines: list[str]) -> list[dict]:
    """Parse option lines like `- `value`: "Label text"`"""
    options = []
    for line in lines:
        match = re.match(r'^- `([^`]+)`:\s*["\']?([^"\']+)["\']?', line.strip())
        if match:
            options.append({"value": match.group(1), "label": match.group(2).strip('"\'')})
    return options

def parse_fields(content: str) -> list[dict]:
    """Parse compound field definitions"""
    fields = []
    field_pattern = r'\d+\.\s+`([^`]+)`\s+\(([^)]+)\)(?::\s*["\']([^"\']+)["\'])?'
    
    for match in re.finditer(field_pattern, content):
        key = match.group(1)
        type_info = match.group(2)
        label = match.group(3) or key.replace('_', ' ').title()
        
        field = {"key": key, "label": label}
        
        # Parse type
        if 'ranked_select' in type_info:
            field["type"] = "ranked_select"
            max_match = re.search(r'max\s*(\d+)', type_info)
            if max_match:
                field["validation"] = {"max_selected": int(max_match.group(1))}
        elif 'multi_select' in type_info:
            field["type"] = "multi_select"
            max_match = re.search(r'max\s*(\d+)', type_info)
            if max_match:
                field["validation"] = {"max_selected": int(max_match.group(1))}
        elif 'single_select' in type_info:
            field["type"] = "single_select"
        elif 'number' in type_info:
            field["type"] = "number"
            range_match = re.search(r'(\d+)-(\d+)', type_info)
            if range_match:
                field["min"] = int(range_match.group(1))
                field["max"] = int(range_match.group(2))
        elif 'short_text' in type_info:
            field["type"] = "short_text"
        elif 'free_text' in type_info:
            field["type"] = "free_text"
        else:
            field["type"] = "short_text"
            
        # Check for optional
        if 'optional' in type_info.lower():
            field["placeholder"] = "Optional"
            
        # Check for showWhen
        if 'showWhen' in type_info:
            show_match = re.search(r'showWhen\s+(\w+)', type_info)
            if show_match:
                field["showWhen"] = {"field": show_match.group(1), "equals": show_match.group(1)}
        
        fields.append(field)
    
    return fields

def generate_answer_schema(q_type: str, fields: list = None, options: list = None) -> dict:
    """Generate answer_schema based on question type"""
    if q_type == "free_text":
        return {"text": ""}
    elif q_type == "single_select":
        return {"selected_value": "", "other_text": "", "notes": ""}
    elif q_type == "multi_select":
        return {"selected_values": [], "other_text": "", "notes": ""}
    elif q_type == "compound" and fields:
        schema = {}
        for f in fields:
            if f["type"] in ["multi_select", "ranked_select"]:
                schema[f["key"]] = []
            elif f["type"] == "number":
                schema[f["key"]] = 0
            else:
                schema[f["key"]] = ""
        return schema
    return {"text": ""}

def parse_question_block(block: str, section_id: str, order: int) -> dict:
    """Parse a single question block from markdown"""
    lines = block.strip().split('\n')
    
    # Extract question ID and mode from header
    header = lines[0] if lines else ""
    id_match = re.search(r'Q(\d+)', header)
    q_id = f"q{id_match.group(1).zfill(2)}" if id_match else f"q{order:02d}"
    
    is_lite = "[LITE]" in header
    is_full = "[FULL]" in header
    
    # Extract title from header
    title_match = re.search(r'—\s*(.+)$', header)
    title = title_match.group(1).strip() if title_match else ""
    
    question = {
        "id": q_id,
        "section_id": section_id,
        "order": order,
        "title": title,
        "prompt": "",
        "type": "free_text",
        "answer_schema": {"text": ""},
        "examples": [],
        "tags": {"included_in_manifests": ["lite", "full"] if is_lite else ["full"]}
    }
    
    # Parse content
    current_section = None
    options = []
    fields = []
    examples = []
    
    for i, line in enumerate(lines[1:], 1):
        line_stripped = line.strip()
        
        if line_stripped.startswith("**Type**:"):
            q_type = line_stripped.split(":")[-1].strip().lower()
            question["type"] = q_type
            
        elif line_stripped.startswith("**Prompt**:"):
            prompt = line_stripped.replace("**Prompt**:", "").strip().strip('"')
            question["prompt"] = prompt
            
        elif line_stripped == "**Options**:":
            current_section = "options"
            
        elif line_stripped == "**Fields**:":
            current_section = "fields"
            
        elif line_stripped.startswith("**Examples**:"):
            current_section = "examples"
            
        elif current_section == "options" and line_stripped.startswith("-"):
            opt_match = re.match(r'-\s*`([^`]+)`:\s*["\']?(.+?)["\']?$', line_stripped)
            if opt_match:
                options.append({"value": opt_match.group(1), "label": opt_match.group(2).strip('"\'')})
                
        elif current_section == "fields" and re.match(r'^\d+\.', line_stripped):
            field = parse_field_line(line_stripped)
            if field:
                fields.append(field)
                
        elif current_section == "examples" and line_stripped.startswith("-"):
            example = line_stripped[1:].strip().strip('"\'')
            examples.append(example)
    
    # Set options/fields
    if options:
        question["options"] = options
    if fields:
        question["fields"] = fields
        
    # Generate answer schema
    question["answer_schema"] = generate_answer_schema(question["type"], fields, options)
    
    if examples:
        question["examples"] = examples
    
    return question

def parse_field_line(line: str) -> dict:
    """Parse a field definition line"""
    # Pattern: 1. `key` (type, constraints): "Label"
    match = re.match(r'\d+\.\s*`([^`]+)`\s*\(([^)]+)\)(?::\s*["\']?([^"\']+)["\']?)?', line)
    if not match:
        return None
    
    key = match.group(1)
    type_info = match.group(2)
    label = match.group(3) or key.replace('_', ' ').title()
    
    field = {"key": key, "label": label.strip('"\''), "type": "short_text"}
    
    type_info_lower = type_info.lower()
    if 'ranked_select' in type_info_lower:
        field["type"] = "ranked_select"
    elif 'multi_select' in type_info_lower:
        field["type"] = "multi_select"
    elif 'single_select' in type_info_lower:
        field["type"] = "single_select"
    elif 'number' in type_info_lower:
        field["type"] = "number"
        range_match = re.search(r'(\d+)-(\d+)', type_info)
        if range_match:
            field["min"] = int(range_match.group(1))
            field["max"] = int(range_match.group(2))
    elif 'free_text' in type_info_lower:
        field["type"] = "free_text"
    elif 'short_text' in type_info_lower:
        field["type"] = "short_text"
    
    if 'optional' in type_info_lower:
        field["placeholder"] = "Optional"
    
    # Check for max selections
    max_match = re.search(r'max\s*(\d+)', type_info_lower)
    if max_match and field["type"] in ["multi_select", "ranked_select"]:
        if "validation" not in field:
            field["validation"] = {}
        field["validation"]["max_selected"] = int(max_match.group(1))
    
    return field

def parse_markdown(md_path: Path) -> dict:
    """Parse the entire questions.md file"""
    content = md_path.read_text(encoding='utf-8')
    
    sections = []
    questions = {}
    lite_ids = []
    full_ids = []
    
    # Split by section headers (## Section N:)
    section_pattern = r'^## Section (\d+):\s*(.+)$'
    question_pattern = r'^### (Q\d+)\s*\[(LITE|FULL)\]\s*—\s*(.+)$'
    
    current_section = None
    current_section_id = None
    current_question_block = []
    order = 0
    
    for line in content.split('\n'):
        section_match = re.match(section_pattern, line)
        question_match = re.match(question_pattern, line)
        
        if section_match:
            # Save previous question
            if current_question_block and current_section_id:
                q = parse_question_content(current_question_block, current_section_id, order)
                if q:
                    questions[q["id"]] = q
                    if "lite" in q["tags"]["included_in_manifests"]:
                        lite_ids.append(q["id"])
                    full_ids.append(q["id"])
            current_question_block = []
            
            section_num = section_match.group(1)
            section_title = section_match.group(2).strip()
            current_section_id = f"s{section_num}"
            sections.append({
                "id": current_section_id,
                "title": section_title,
                "question_ids": []
            })
            
        elif question_match:
            # Save previous question
            if current_question_block and current_section_id:
                q = parse_question_content(current_question_block, current_section_id, order)
                if q:
                    questions[q["id"]] = q
                    sections[-1]["question_ids"].append(q["id"])
                    if "lite" in q["tags"]["included_in_manifests"]:
                        lite_ids.append(q["id"])
                    full_ids.append(q["id"])
            
            order += 1
            q_num = re.search(r'Q(\d+)', question_match.group(1)).group(1)
            mode = question_match.group(2)
            title = question_match.group(3).strip()
            
            current_question_block = [{
                "q_id": f"q{q_num.zfill(2)}",
                "is_lite": mode == "LITE",
                "title": title,
                "order": order,
                "section_id": current_section_id,
                "lines": []
            }]
        elif current_question_block:
            current_question_block[0]["lines"].append(line)
    
    # Save last question
    if current_question_block and current_section_id:
        q = parse_question_content(current_question_block, current_section_id, order)
        if q:
            questions[q["id"]] = q
            sections[-1]["question_ids"].append(q["id"])
            if "lite" in q["tags"]["included_in_manifests"]:
                lite_ids.append(q["id"])
            full_ids.append(q["id"])
    
    return {
        "sections": sections,
        "questions": questions,
        "ui_hints": {
            "rendering": {
                "default_layout": "sections",
                "question_numbering": "order",
                "allow_skip": True,
                "show_examples": True,
                "allow_multi_select_ranking": True
            },
            "controls": {
                "mode_switcher": {
                    "default": "lite",
                    "options": [
                        {"id": "lite", "label": f"Lite ({len(lite_ids)})"},
                        {"id": "full", "label": f"Full ({len(full_ids)})"}
                    ]
                }
            }
        },
        "manifests": {
            "lite": {
                "id": "lite",
                "title": "Lite",
                "question_ids": lite_ids,
                "timebox_minutes": 60,
                "post_timebox_activity": "Take a break before continuing or comparing with your partner."
            },
            "full": {
                "id": "full",
                "title": "Full",
                "question_ids": full_ids,
                "timebox_minutes": 120,
                "post_timebox_activity": "Take a longer break. This was deep work."
            }
        },
        "primary_manifest_id": "lite"
    }

def parse_question_content(block_data: list, section_id: str, order: int) -> dict:
    """Parse question content from accumulated lines"""
    if not block_data:
        return None
    
    data = block_data[0]
    lines = data["lines"]
    content = '\n'.join(lines)
    
    question = {
        "id": data["q_id"],
        "section_id": section_id,
        "order": data["order"],
        "title": data["title"],
        "prompt": "",
        "type": "free_text",
        "answer_schema": {"text": ""},
        "examples": [],
        "tags": {"included_in_manifests": ["lite", "full"] if data["is_lite"] else ["full"]}
    }
    
    # Extract type
    type_match = re.search(r'\*\*Type\*\*:\s*(\w+)', content)
    if type_match:
        question["type"] = type_match.group(1).lower()
    
    # Extract prompt
    prompt_match = re.search(r'\*\*Prompt\*\*:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    if prompt_match:
        question["prompt"] = prompt_match.group(1).strip('"\'')
    
    # Extract top-level options (for single_select, multi_select questions)
    options = []
    in_options = False
    for line in lines:
        if "**Options**" in line and ":" in line:
            in_options = True
            continue
        if in_options:
            if line.strip().startswith("- `"):
                opt_match = re.match(r'-\s*`([^`]+)`:\s*["\']?(.+?)["\']?$', line.strip())
                if opt_match:
                    options.append({"value": opt_match.group(1), "label": opt_match.group(2).strip('"\'')})
            elif line.strip().startswith("**") or line.strip().startswith("---"):
                in_options = False
    
    if options:
        question["options"] = options
    
    # Extract fields for compound questions - with nested options!
    fields = []
    in_fields = False
    current_field = None
    current_field_options = []
    
    for line in lines:
        if "**Fields**:" in line:
            in_fields = True
            continue
        
        if in_fields:
            stripped = line.strip()
            
            # Check for new field definition (numbered line)
            # Pattern: 1. `key` (type): "Label text"
            # Use a better regex that captures the full label including apostrophes
            field_match = re.match(r'^\d+\.\s*`([^`]+)`\s*\(([^)]+)\)(?::\s*"([^"]+)")?', stripped)
            if not field_match:
                # Try with single quotes
                field_match = re.match(r"^\d+\.\s*`([^`]+)`\s*\(([^)]+)\)(?::\s*'([^']+)')?", stripped)
            
            if field_match:
                # Save previous field with its options
                if current_field:
                    if current_field_options:
                        current_field["options"] = current_field_options
                    fields.append(current_field)
                
                # Parse new field
                key = field_match.group(1)
                type_info = field_match.group(2)
                label = field_match.group(3) or key.replace('_', ' ').title()
                
                current_field = {"key": key, "label": label.strip(), "type": "short_text"}
                current_field_options = []
                
                type_info_lower = type_info.lower()
                if 'ranked_select' in type_info_lower:
                    current_field["type"] = "ranked_select"
                elif 'multi_select' in type_info_lower:
                    current_field["type"] = "multi_select"
                elif 'single_select' in type_info_lower:
                    current_field["type"] = "single_select"
                elif 'number' in type_info_lower:
                    current_field["type"] = "number"
                    range_match = re.search(r'(\d+)-(\d+)', type_info)
                    if range_match:
                        current_field["min"] = int(range_match.group(1))
                        current_field["max"] = int(range_match.group(2))
                elif 'free_text' in type_info_lower:
                    current_field["type"] = "free_text"
                elif 'short_text' in type_info_lower:
                    current_field["type"] = "short_text"
                
                if 'optional' in type_info_lower:
                    current_field["placeholder"] = "Optional"
                
                # Check for max selections
                max_match = re.search(r'max\s*(\d+)', type_info_lower)
                if max_match and current_field["type"] in ["multi_select", "ranked_select"]:
                    current_field["validation"] = {"max_selected": int(max_match.group(1))}
                
                # Check for showWhen
                if 'showWhen' in type_info:
                    show_match = re.search(r'showWhen\s+(\w+)', type_info)
                    if show_match:
                        current_field["showWhen"] = {"field": show_match.group(1), "equals": show_match.group(1)}
            
            # Check for nested option (indented with - `)
            elif stripped.startswith("- `") and current_field:
                opt_match = re.match(r'-\s*`([^`]+)`:\s*["\']?(.+?)["\']?$', stripped)
                if opt_match:
                    current_field_options.append({
                        "value": opt_match.group(1), 
                        "label": opt_match.group(2).strip('"\'')
                    })
            
            # End of fields section
            elif stripped.startswith("**") or stripped.startswith("---"):
                # Save last field
                if current_field:
                    if current_field_options:
                        current_field["options"] = current_field_options
                    fields.append(current_field)
                    current_field = None
                    current_field_options = []
                in_fields = False
    
    # Don't forget the last field if we're still parsing
    if current_field:
        if current_field_options:
            current_field["options"] = current_field_options
        fields.append(current_field)
    
    if fields:
        question["fields"] = fields
        question["type"] = "compound"
    
    # Extract examples
    examples = []
    in_examples = False
    for line in lines:
        if "**Examples**:" in line:
            in_examples = True
            continue
        if in_examples:
            if line.strip().startswith("-"):
                example = line.strip()[1:].strip().strip('"\'')
                examples.append(example)
            elif line.strip().startswith("**") or line.strip() == "---":
                in_examples = False
    
    if examples:
        question["examples"] = examples
    
    # Generate answer schema
    question["answer_schema"] = generate_answer_schema(question["type"], fields, options)
    
    return question

def main():
    base_path = Path(__file__).parent.parent
    md_path = base_path / "data" / "phase_1" / "questions.md"
    json_path = base_path / "data" / "phase_1" / "questions.json"
    
    print(f"Reading: {md_path}")
    result = parse_markdown(md_path)
    
    print(f"Parsed {len(result['questions'])} questions")
    print(f"Lite: {len(result['manifests']['lite']['question_ids'])} questions")
    print(f"Full: {len(result['manifests']['full']['question_ids'])} questions")
    print(f"Sections: {len(result['sections'])}")
    
    json_path.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f"Written: {json_path}")

if __name__ == "__main__":
    main()
