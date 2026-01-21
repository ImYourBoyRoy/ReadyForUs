
import json
import os
import glob

# The "Absolute Best" Lite List (18 Questions)
# Focused on: Status, Safety, Readiness, Intent, Values, Logistics, Dealbreakers.
LITE_IDS = [
    'q01', # Current Relationship Status
    'q03', # Ex Entanglement Check
    'q04', # Emotional Closure
    'q05', # Relational Safety (ADDED)
    'q07', # Honest Motivation Check
    'q11', # Dealbreakers
    'q12', # Disclosures (My Baggage)
    'q13', # Sexual Integrity
    'q14', # Intimacy Timeline
    'q27', # Conflict Repair (ADDED/KEPT)
    'q30', # Faith Profile
    'q31', # Non-Negotiable Values
    'q35', # Dating Toward (Intent)
    'q36', # Exclusivity & Labels
    'q39', # Kids Situation
    'q40', # Time Availability
    'q41', # Financial Reality (ADDED)
    'q46'  # Readiness Self-Assessment
]

def update_lite_tags():
    questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1\questions"
    files = glob.glob(os.path.join(questions_dir, "q*.json"))
    
    print(f"Scanning {len(files)} files to update Lite tags...")
    
    updated_count = 0
    
    for file_path in files:
        filename = os.path.basename(file_path)
        qid = filename.replace(".json", "")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue
            
        tags = data.get('tags', {})
        manifests = tags.get('included_in_manifests', [])
        
        is_lite = qid in LITE_IDS
        has_lite_tag = 'lite' in manifests
        
        changed = False
        
        if is_lite and not has_lite_tag:
            manifests.append('lite')
            # Ensure proper order or just add it
            changed = True
            print(f"[{qid}] + Added 'lite'")
            
        elif not is_lite and has_lite_tag:
            manifests.remove('lite')
            changed = True
            print(f"[{qid}] - Removed 'lite'")
            
        if changed:
            data['tags']['included_in_manifests'] = manifests
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            updated_count += 1

    print(f"Update complete. Optimized Lite list applied to {updated_count} files.")

if __name__ == "__main__":
    update_lite_tags()
