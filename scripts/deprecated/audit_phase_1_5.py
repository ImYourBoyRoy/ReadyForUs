
import json
import os
import glob

def audit_phase_1_5():
    questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1.5\questions"
    files = sorted(glob.glob(os.path.join(questions_dir, "q*.json")))
    
    print(f"Found {len(files)} question files in Phase 1.5.")
    print("-" * 60)
    print(f"{'ID':<6} | {'Type':<15} | {'Ex Needs Review':<5}")
    print("-" * 60)

    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                print(f"Error decoding {file_path}")
                continue
        
        q_id = data.get('id', '???')
        q_type = data.get('type', 'unknown')
        examples = data.get('examples', [])
        
        needs_review = "NO"
        # Check for prescriptive words or specific stories
        for ex in examples:
            if any(x in ex.lower() for x in ["divorce", "years ago", "month", "--"]): 
                 needs_review = "YES"

        print(f"{q_id:<6} | {q_type:<15} | {needs_review:<5}")
        if needs_review != "NO":
             print(f"   Ex: {examples}")

    print("-" * 60)

if __name__ == "__main__":
    audit_phase_1_5()
