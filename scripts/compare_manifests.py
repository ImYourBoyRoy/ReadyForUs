import json
import os

phases = ['phase_0', 'phase_1', 'phase_1.5', 'phase_2', 'phase_2.5']
base_dir = r'c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f: return json.load(f)

ref_manifest = load_json(os.path.join(base_dir, 'phase_1', 'phase_1_manifest_schema.json'))

results = []
results.append("Reference: phase_1_manifest_schema.json")

for p in phases:
    path = os.path.join(base_dir, p, f'{p}_manifest_schema.json')
    if not os.path.exists(path):
        results.append(f"{p}: MISSING")
        continue

    data = load_json(path)
    if data == ref_manifest:
        results.append(f"{p}: MATCH")
    else:
        results.append(f"{p}: MISMATCH")
        # specific diffs
        for k in ref_manifest:
            if k not in data:
                results.append(f"  - Missing key in {p}: {k}")
            elif data[k] != ref_manifest[k]:
                results.append(f"  - Mismatch value in {p} for key: {k}")
                # simple recursive print for intro if that's the issue
                if isinstance(data[k], dict) and isinstance(ref_manifest[k], dict):
                     if data[k] != ref_manifest[k]:
                         results.append(f"    - Deep diff in {k}: {data[k]} vs {ref_manifest[k]}")

        for k in data:
            if k not in ref_manifest:
                results.append(f"  - Extra key in {p}: {k}")

with open('schema_manifest_check_results.txt', 'w') as f:
    f.write('\n'.join(results))
