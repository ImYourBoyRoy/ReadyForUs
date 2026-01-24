import json
import os

# Define the phases to checks
PHASES = ['phase_0', 'phase_1', 'phase_1.5', 'phase_2', 'phase_2.5']
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

GENERIC_LABELS = [
    "Notes",
    "Notes (optional)",
    "Optional",
    "Any context you want to add", # Check if this is considered generic by user or specific? 
    # The user said "Any context you want to add" is helpful labeling in step 308, so I might need to be careful.
    # But later in Step 359 user said "Notes (optional)" is junk.
    # Let's count "Notes" and "Notes (optional)" as definitely generic.
    # "Any context you want to add" might be borderline, but usually implies generic. 
    # Let's list what we find first.
]

DEFINITELY_GENERIC = [
    "Notes",
    "Notes (optional)",
    "notes",
    "notes (optional)"
]

def analyze_file(phase):
    file_path = os.path.join(DATA_DIR, phase, 'questions.json')
    if not os.path.exists(file_path):
        print(f"Skipping {phase}: File not found")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Skipping {phase}: Invalid JSON")
            return

    questions = data.get('questions', {})
    
    total_notes_fields = 0
    generic_notes_fields = 0
    specific_notes_fields = 0
    
    saved_lines_estimate = 0
    saved_chars_estimate = 0

    print(f"\n--- Analysis for {phase} ---")

    for q_id, q_data in questions.items():
        if q_data.get('type') == 'compound':
            fields = q_data.get('fields', [])
            for field in fields:
                if field.get('key') == 'notes':
                    total_notes_fields += 1
                    label = field.get('label', '')
                    
                    # Heuristic for generic: Exact match or very simple
                    is_generic = label in DEFINITELY_GENERIC or label.lower() == "notes (optional)" or label.lower() == "notes"
                    
                    if is_generic:
                        generic_notes_fields += 1
                        # Estimate savings: 
                        # - json block for field approx 5-8 lines
                        # - entry in answer_schema approx 1 line
                        saved_lines_estimate += 6 
                        # Rough char count
                        saved_chars_estimate += len(str(field)) + 20 # +20 for schema entry
                    else:
                        specific_notes_fields += 1
                        print(f"  [Specific] {q_id}: \"{label}\"")

    print(f"Total 'notes' fields: {total_notes_fields}")
    print(f"Generic (Removable): {generic_notes_fields}")
    print(f"Specific (Keep):     {specific_notes_fields}")
    print(f"Est. Lines Saved:    {saved_lines_estimate}")
    
    return generic_notes_fields, saved_lines_estimate

def main():
    output_lines = []
    total_generic = 0
    total_lines = 0
    
    output_lines.append("Analyzing 'notes' field usage in data files...")
    
    for phase in PHASES:
        # Redirect print for individual file analysis is tricky without refactor, 
        # so let's just use the return values for the summary and maybe refactor slightly if needed.
        # Ideally, I'd capture the per-phase output too.
        # Let's just rewrite the analyze_file to return a string log too.
        pass
    
    # Actually, simpler: just redirect stdout in the script execution or simpler yet,
    # just open a file and write to it.
    
    # Use absolute path to be sure
    output_path = r'C:\Users\Roy\Desktop\AI\Slow-Build-Check-In\debug_notes_analysis.txt'
    with open(output_path, 'w', encoding='utf-8') as outfile:
        outfile.write("Analysis Report\n")
        
        for phase in PHASES:
            generic, lines = analyze_file_to_log(phase, outfile)
            total_generic += generic
            total_lines += lines
            
        outfile.write("\n========================================\n")
        outfile.write(f"GRAND TOTALS\n")
        outfile.write(f"Generic fields to remove: {total_generic}\n")
        outfile.write(f"Estimated lines saved:    {total_lines}\n")
        outfile.write("========================================\n")
        
def analyze_file_to_log(phase, outfile):
    file_path = os.path.join(DATA_DIR, phase, 'questions.json')
    if not os.path.exists(file_path):
        outfile.write(f"Skipping {phase}: File not found\n")
        return 0, 0

    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            outfile.write(f"Skipping {phase}: Invalid JSON\n")
            return 0, 0

    questions = data.get('questions', {})
    
    generic_notes_fields = 0
    saved_lines_estimate = 0

    outfile.write(f"\n--- Analysis for {phase} ---\n")

    for q_id, q_data in questions.items():
        if q_data.get('type') == 'compound':
            fields = q_data.get('fields', [])
            for field in fields:
                if field.get('key') == 'notes':
                    label = field.get('label', '')
                    is_generic = label in DEFINITELY_GENERIC or label.lower() == "notes (optional)" or label.lower() == "notes"
                    
                    if is_generic:
                        generic_notes_fields += 1
                        saved_lines_estimate += 6 
                    else:
                        outfile.write(f"  [Specific] {q_id}: \"{label}\"\n")

    return generic_notes_fields, saved_lines_estimate


if __name__ == '__main__':
    main()
