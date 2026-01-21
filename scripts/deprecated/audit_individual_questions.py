
import json
import os
import glob

def audit_individual_questions():
    questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_0\questions"
    files = sorted(glob.glob(os.path.join(questions_dir, "q*.json")))
    
    print(f"Found {len(files)} question files.")
    print("-" * 60)
    print(f"{'ID':<6} | {'Type':<15} | {'Opt':<4} | {'Ex':<4} | {'Status':<20}")
    print("-" * 60)

    issues_found = 0

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
        options = data.get('options', [])
        
        # Count options for compound fields if main options are empty
        if not options and q_type == 'compound':
            for field in data.get('fields', []):
                if 'options' in field:
                    options.extend(field['options'])
        
        opt_count = len(options)
        ex_count = len(examples)
        
        status = "OK"
        if q_type in ['single_select', 'multi_select', 'ranked_select'] and opt_count > 0:
            if ex_count < 2: # Ideally should match opt_count, but at least > 1
                 status = "FEW EXAMPLES"
                 issues_found += 1
            elif ex_count < opt_count: 
                 # This is common if "prefer_not" or "other" don't have explicit examples sometimes
                 if ex_count < opt_count - 2:
                     status = "GAP IN EXAMPLES"
                     # issues_found += 1 # Strict check
        
        if q_type == 'free_text' and ex_count < 2:
             status = "FEW EXAMPLES (Free)"
             issues_found += 1

        print(f"{q_id:<6} | {q_type:<15} | {opt_count:<4} | {ex_count:<4} | {status:<20}")

    print("-" * 60)
    print(f"Audit complete. Potentially under-served questions: {issues_found}")

if __name__ == "__main__":
    audit_individual_questions()
