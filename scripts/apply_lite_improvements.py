# ./scripts/apply_lite_improvements.py
"""
Lite Manifest & Tag Fix Script
================================

Applies all Lite/Full manifest corrections across phases:
  - Phase 0: Fix tag mismatches (q20, q49, q52, q76)
  - Phase 1: Remove 9 questions from Lite manifest + update tags
  - Phase Closure: Remove 1 question from Lite manifest + update tag

Usage:
    python scripts/apply_lite_improvements.py

Key Inputs:
    - data/phase_0/questions.json
    - data/phase_1/questions.json
    - data/phase_closure/questions.json

Key Outputs:
    - Modified questions.json files (in-place)

Operational Notes:
    - Idempotent: safe to run multiple times.
    - Always run validate_schema.py and lite_audit.py after.
"""

import json
import os
import sys

# Windows console encoding fix
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BOLD = "\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def sync_tags_to_manifest(data, phase_label):
    """Ensure every question's tags.included_in_manifests matches the manifests."""
    questions = data.get("questions", {})
    manifests = data.get("manifests", {})
    
    lite_ids = set(manifests.get("lite", {}).get("question_ids", []))
    full_ids = set(manifests.get("full", {}).get("question_ids", []))
    
    fixed = 0
    for qid, q in questions.items():
        expected = []
        if qid in lite_ids:
            expected.append("lite")
        if qid in full_ids:
            expected.append("full")
        
        if not expected:
            expected = ["full"]  # default fallback
        
        current = q.get("tags", {}).get("included_in_manifests", [])
        if sorted(current) != sorted(expected):
            if "tags" not in q:
                q["tags"] = {}
            q["tags"]["included_in_manifests"] = expected
            fixed += 1
            print(f"  {YELLOW}TAG FIX{RESET} {qid}: {current} → {expected}")
    
    return fixed

def remove_from_lite(data, qids_to_remove, phase_label):
    """Remove question IDs from the Lite manifest."""
    lite_ids = data["manifests"]["lite"]["question_ids"]
    removed = 0
    for qid in qids_to_remove:
        if qid in lite_ids:
            lite_ids.remove(qid)
            removed += 1
            print(f"  {RED}REMOVED{RESET} {qid} from Lite")
        else:
            print(f"  {YELLOW}SKIP{RESET} {qid} not in Lite (already removed)")
    
    data["manifests"]["lite"]["question_ids"] = sorted(lite_ids)
    return removed


def fix_phase_0():
    """Phase 0: Fix tag mismatches only (manifest is already correct)."""
    path = os.path.join("data", "phase_0", "questions.json")
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}PHASE 0 — Tag Mismatch Fixes{RESET}")
    print(f"{'='*60}")
    
    if not os.path.exists(path):
        print(f"{RED}Error: {path} not found.{RESET}")
        return False
    
    data = load_json(path)
    fixed = sync_tags_to_manifest(data, "phase_0")
    
    if fixed > 0:
        save_json(path, data)
        print(f"{GREEN}Fixed {fixed} tag mismatch(es). Saved.{RESET}")
    else:
        print(f"{GREEN}No mismatches found.{RESET}")
    return True


def fix_phase_1():
    """Phase 1: Remove 9 questions from Lite (68.8% → 50.0%)."""
    path = os.path.join("data", "phase_1", "questions.json")
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}PHASE 1 — Remove 9 from Lite (68.8% → 50.0%){RESET}")
    print(f"{'='*60}")
    
    if not os.path.exists(path):
        print(f"{RED}Error: {path} not found.{RESET}")
        return False
    
    data = load_json(path)
    
    # 9 questions to move from Lite → Full-only
    to_remove = [
        "q03",  # Ex Entanglement Check (q04 covers signal)
        "q07",  # Honest Motivation Check (q06 covers essentials)
        "q12",  # Things You Should Disclose (sensitive, for deep dive)
        "q14",  # Intimacy Timeline (too detailed for lite)
        "q18",  # When You're Stressed (q17 covers patterns)
        "q28",  # What Makes Feedback Hard (q26+q27 cover comms)
        "q32",  # Value Compromise (q31 covers core)
        "q41",  # Financial Reality (q40 covers key constraint)
        "q44",  # What They Need to Know (q43 covers essentials)
    ]
    
    removed = remove_from_lite(data, to_remove, "phase_1")
    
    # Now sync all tags to match the updated manifest
    fixed = sync_tags_to_manifest(data, "phase_1")
    
    lite_count = len(data["manifests"]["lite"]["question_ids"])
    total = len(data["questions"])
    ratio = lite_count / total * 100
    
    save_json(path, data)
    print(f"{GREEN}Result: {lite_count}/{total} Lite = {ratio:.1f}%. Saved.{RESET}")
    return True


def fix_phase_closure():
    """Phase Closure: Remove 1 question from Lite (50.8% → 49.2%)."""
    path = os.path.join("data", "phase_closure", "questions.json")
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}PHASE CLOSURE — Remove 1 from Lite (50.8% → 49.2%){RESET}")
    print(f"{'='*60}")
    
    if not os.path.exists(path):
        print(f"{RED}Error: {path} not found.{RESET}")
        return False
    
    data = load_json(path)
    
    # 1 question to move from Lite → Full-only
    to_remove = [
        "q05",  # Physical Intimacy Level (sensitive detail, not for lite)
    ]
    
    removed = remove_from_lite(data, to_remove, "phase_closure")
    
    # Sync all tags
    fixed = sync_tags_to_manifest(data, "phase_closure")
    
    lite_count = len(data["manifests"]["lite"]["question_ids"])
    total = len(data["questions"])
    ratio = lite_count / total * 100
    
    save_json(path, data)
    print(f"{GREEN}Result: {lite_count}/{total} Lite = {ratio:.1f}%. Saved.{RESET}")
    return True


def main():
    print(f"{BOLD}Lite Manifest & Tag Fix Script{RESET}")
    print(f"{'='*60}")
    
    success = True
    success = fix_phase_0() and success
    success = fix_phase_1() and success
    success = fix_phase_closure() and success
    
    print(f"\n{BOLD}{'='*60}{RESET}")
    if success:
        print(f"{GREEN}All phases updated successfully.{RESET}")
        print(f"\n{CYAN}Next steps:{RESET}")
        print(f"  1. python scripts/validate_schema.py")
        print(f"  2. python scripts/lite_audit.py")
        print(f"  3. python scripts/export_questions.py")
    else:
        print(f"{RED}Some phases had errors. Check output above.{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
