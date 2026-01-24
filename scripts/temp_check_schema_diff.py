import json
import os
import sys

phases = ['phase_0', 'phase_1', 'phase_1.5', 'phase_2', 'phase_2.5']
base_dir = r'c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f: return json.load(f)

ref_manifest_path = os.path.join(base_dir, 'phase_1', 'phase_1_manifest_schema.json')
ref_prompts_path = os.path.join(base_dir, 'phase_1', 'phase_1_prompts_schema.json')

try:
    ref_manifest = load_json(ref_manifest_path)
    ref_prompts = load_json(ref_prompts_path)
except FileNotFoundError:
    print('Reference phase_1 schemas found not found!')
    sys.exit(1)

print('--- Checking Manifests ---')
for p in phases:
    path = os.path.join(base_dir, p, f'{p}_manifest_schema.json')
    if not os.path.exists(path):
        print(f'{p}: MISSING')
        continue
    
    data = load_json(path)
    if data == ref_manifest:
        print(f'{p}: MATCH')
    else:
        print(f'{p}: MISMATCH')
        # Print differing keys
        set_ref = set(ref_manifest.keys())
        set_data = set(data.keys())
        if set_ref != set_data:
            print(f"  Keys diff: {set_ref ^ set_data}")
        
        # Deep compare for first level
        for k in ref_manifest:
            if k in data and data[k] != ref_manifest[k]:
                 print(f"  Field '{k}' mismatch")

print('\n--- Checking Prompts ---')
for p in phases:
    path = os.path.join(base_dir, p, f'{p}_prompts_schema.json')
    if not os.path.exists(path):
        print(f'{p}: MISSING')
        continue

    data = load_json(path)
    if data == ref_prompts:
        print(f'{p}: MATCH')
    else:
        print(f'{p}: MISMATCH')
        for k in ref_prompts:
            if k in data and data[k] != ref_prompts[k]:
                 print(f"  Field '{k}' mismatch")
