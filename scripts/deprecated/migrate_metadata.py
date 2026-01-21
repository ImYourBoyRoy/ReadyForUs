# ./scripts/migrate_metadata.py
"""
One-time migration script to extract metadata from questions.json into manifest.json.
Removes schema_version, artifact, and intro from questions.json files.
"""
import json
import os

def migrate_phase(phase_path):
    questions_path = os.path.join(phase_path, 'questions.json')
    
    with open(questions_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Remove metadata keys
    removed = []
    for key in ['schema_version', 'artifact', 'intro']:
        if key in data:
            del data[key]
            removed.append(key)
    
    with open(questions_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  Removed keys: {removed}")
    return len(removed) > 0

if __name__ == '__main__':
    phases = ['data/phase_0', 'data/phase_1.5']
    
    for phase in phases:
        print(f"Processing {phase}...")
        if migrate_phase(phase):
            print(f"  [OK] {phase}/questions.json updated")
        else:
            print(f"  - No changes needed")
    
    print("\nMigration complete!")
