
import json
import os
import shutil

def export_phase_1_5_questions():
    input_file = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1.5\questions.json"
    output_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1.5\questions"

    # Create directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")
    else:
        print(f"Directory already exists: {output_dir}")

    # Read the monolithic file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        return

    questions = data.get('questions', {})
    print(f"Found {len(questions)} questions to export.")

    for q_id, q_data in questions.items():
        file_path = os.path.join(output_dir, f"{q_id}.json")
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(q_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error writing {file_path}: {e}")

    print("Phase 1.5 Export complete.")

if __name__ == "__main__":
    export_phase_1_5_questions()
