# ./scripts/migrate_prompts_metadata.py
"""
Migration script to remove metadata from prompts.json files.
The metadata has already been moved to manifest.json.
"""
import json
import os

def migrate_prompts(phase_path):
    prompts_path = os.path.join(phase_path, 'prompts.json')
    
    with open(prompts_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Remove metadata keys - only keep 'prompts'
    removed = []
    for key in ['schema_version', 'artifact', 'privacy_preface']:
        if key in data:
            del data[key]
            removed.append(key)
    
    with open(prompts_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  Removed keys: {removed}")
    return len(removed) > 0

if __name__ == '__main__':
    phases = ['data/phase_0', 'data/phase_1.5']
    
    for phase in phases:
        print(f"Processing {phase}/prompts.json...")
        if migrate_prompts(phase):
            print(f"  [OK] Updated")
        else:
            print(f"  - No changes needed")
    
    print("\nMigration complete!")
