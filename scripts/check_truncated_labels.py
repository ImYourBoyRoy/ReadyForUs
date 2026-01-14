# ./scripts/check_truncated_labels.py
import json
from pathlib import Path

d = json.load(open(Path(__file__).parent.parent / 'data/phase_1/questions.json'))

# Check for labels that look truncated (end with space, incomplete phrase, etc.)
issues = []

for q_id, q in d['questions'].items():
    # Check prompt
    if q['prompt'].endswith(' ') or q['prompt'].endswith('"'):
        issues.append(f"{q_id}.prompt ends with: ...{q['prompt'][-30:]}")
    
    # Check fields
    for f in q.get('fields', []):
        label = f.get('label', '')
        # Check for truncated patterns
        if label.endswith(' ') or label.endswith("'") or label.endswith('you') or label.endswith('doesn'):
            issues.append(f"{q_id}.{f['key']}: '{label}'")

if issues:
    print("TRUNCATED LABELS FOUND:")
    for i in issues:
        print(f"  - {i}")
else:
    print("No truncated labels found!")
