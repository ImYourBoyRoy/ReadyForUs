# ./scripts/fix_phase15_validation.py
"""
Add max_selected validation to Phase 1.5 multi_select questions that are missing it.
"""
import json

# Questions that need max_selected based on their context
VALIDATION_LIMITS = {
    "q01": 5,   # Why dating - top reasons
    "q02": 5,   # What feels comfortable
    "q11": 5,   # Affection preferences
    "q20": 4,   # Faith alignment options
    "q22": 5,   # DTR meaning
    "q25": 3,   # Conflict style (typically 1-3 styles)
    "q26": 5,   # De-escalation
    "q30": 4,   # Repair ritual
    "q38": 5    # Boundaries with others
}

def main():
    with open('data/phase_1.5/questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated = 0
    for qid, max_val in VALIDATION_LIMITS.items():
        if qid in data['questions']:
            q = data['questions'][qid]
            if q.get('type') == 'multi_select':
                if not q.get('validation'):
                    q['validation'] = {}
                if not q['validation'].get('max_selected'):
                    q['validation']['max_selected'] = max_val
                    updated += 1
                    print(f"Added max_selected={max_val} to {qid}: {q.get('title', '')}")
                else:
                    print(f"Skipped {qid}: already has max_selected")
    
    with open('data/phase_1.5/questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated {updated} questions with validation limits.")

if __name__ == '__main__':
    main()
