# ./scripts/extract_questions.py
"""
Extract and display question prompts from phase questionnaire files.

Usage:
    python scripts/extract_questions.py [phase_name]
    python scripts/extract_questions.py phase_0
    python scripts/extract_questions.py phase_1.5
    python scripts/extract_questions.py all

CLI Arguments:
    phase_name: Optional. Name of the phase folder (e.g., phase_0, phase_1.5) or 'all'. Default: 'all'

Inputs:
    - data/{phase_name}/questions.json
    - data/{phase_name}/manifest.json (optional, for phase titles)

Outputs:
    - Prints formatted question list to stdout with question ID, type, manifest inclusion, and prompt
    - Groups questions by section
    - Displays options for select-type questions
    - Displays field structure for compound questions

Operational Notes:
    - Read-only operation with no side effects
    - Auto-discovers all data/phase_* directories when 'all' is specified
    - Sections are displayed in order as they appear in the questionnaire
    
Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""


import json
import sys
from pathlib import Path

def extract_questions(phase_name: str) -> None:
    """Extract and print questions from a phase's questions.json file."""
    data_dir = Path(__file__).parent.parent / "data" / phase_name
    questions_file = data_dir / "questions.json"
    manifest_file = data_dir / "manifest.json"
    
    if not questions_file.exists():
        print(f"ERROR: {questions_file} not found")
        return
    
    with open(questions_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Load manifest for phase title
    phase_title = phase_name
    if manifest_file.exists():
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            phase_title = manifest.get("artifact", {}).get("title", phase_name)
    
    sections = {s["id"]: s["title"] for s in data.get("sections", [])}
    questions = data.get("questions", {})
    manifests = data.get("manifests", {})
    
    # Get lite and full question IDs
    lite_ids = set(manifests.get("lite", {}).get("question_ids", []))
    full_ids = set(manifests.get("full", {}).get("question_ids", []))
    
    print("=" * 100)
    print(f"PHASE: {phase_title} ({phase_name})")
    print(f"Total Questions: {len(questions)}")
    print(f"Lite Mode: {len(lite_ids)} questions")
    print(f"Full Mode: {len(full_ids)} questions")
    print("=" * 100)
    
    # Group questions by section
    current_section = None
    for qid in sorted(questions.keys(), key=lambda x: questions[x].get("order", 0)):
        q = questions[qid]
        section_id = q.get("section_id", "unknown")
        
        if section_id != current_section:
            current_section = section_id
            section_title = sections.get(section_id, "Unknown Section")
            print(f"\n{'-' * 100}")
            print(f"SECTION: {section_title}")
            print(f"{'-' * 100}")
        
        # Determine manifest inclusion
        in_lite = qid in lite_ids
        in_full = qid in full_ids
        manifest_tag = "LITE+FULL" if (in_lite and in_full) else ("LITE" if in_lite else ("FULL" if in_full else "NONE"))
        
        q_type = q.get("type", "unknown")
        prompt = q.get("prompt", "NO PROMPT")
        title = q.get("title", "")
        examples = q.get("examples", [])
        
        print(f"\n[{qid}] [{q_type.upper()}] [{manifest_tag}]")
        print(f"  Title: {title}")
        print(f"  Prompt: {prompt}")
        
        # Show options for select types
        if q_type in ["single_select", "multi_select"]:
            options = q.get("options", [])
            if options:
                print(f"  Options: {', '.join([o.get('label', '') for o in options])}")
        
        # Show fields for compound types
        if q_type == "compound":
            fields = q.get("fields", [])
            for field in fields:
                field_key = field.get("key", "")
                field_label = field.get("label", "")
                field_type = field.get("type", "")
                show_when = field.get("showWhen", {})
                
                show_condition = ""
                if show_when:
                    show_condition = f" [shows when {show_when.get('field', '')} {list(show_when.keys())[1] if len(show_when) > 1 else ''} {list(show_when.values())[1] if len(show_when) > 1 else ''}]"
                
                field_options = field.get("options", [])
                if field_options:
                    print(f"    - {field_key} ({field_type}): {field_label}{show_condition}")
                    print(f"      Options: {', '.join([o.get('label', '') for o in field_options])}")
                else:
                    print(f"    - {field_key} ({field_type}): {field_label}{show_condition}")
        
        if examples:
            print(f"  Examples: {examples[:2]}{'...' if len(examples) > 2 else ''}")
    
    print(f"\n{'=' * 100}\n")


def main():
    if len(sys.argv) > 1:
        phase_arg = sys.argv[1]
    else:
        phase_arg = "all"
    
    data_dir = Path(__file__).parent.parent / "data"
    
    if phase_arg == "all":
        # Find all phase directories
        phases = [d.name for d in data_dir.iterdir() if d.is_dir() and d.name.startswith("phase")]
        phases.sort()
    else:
        phases = [phase_arg]
    
    for phase in phases:
        extract_questions(phase)


if __name__ == "__main__":
    main()
