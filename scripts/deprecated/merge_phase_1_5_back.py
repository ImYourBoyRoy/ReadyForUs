
import json
import os
import glob
import shutil

def merge_phase_1_5_back():
    main_file_path = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1.5\questions.json"
    questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1.5\questions"
    
    print(f"Reading main file: {main_file_path}")
    try:
        with open(main_file_path, 'r', encoding='utf-8') as f:
            main_data = json.load(f)
    except Exception as e:
        print(f"Error reading main file: {e}")
        return

    if 'questions' not in main_data:
        print("Error: 'questions' key not found in main file.")
        return

    files = glob.glob(os.path.join(questions_dir, "q*.json"))
    print(f"Found {len(files)} individual question files to merge.")

    updates_count = 0
    for file_path in files:
        filename = os.path.basename(file_path)
        qid = filename.replace(".json", "")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                individual_data = json.load(f)
            
            # Replace the question object in the main dictionary
            main_data['questions'][qid] = individual_data
            updates_count += 1
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    # Backup
    backup_path = main_file_path + ".bak"
    shutil.copy2(main_file_path, backup_path)
    print(f"Backup created at: {backup_path}")

    try:
        with open(main_file_path, 'w', encoding='utf-8') as f:
            json.dump(main_data, f, indent=2, ensure_ascii=False)
        print(f"Successfully updated {updates_count} questions in Phase 1.5 questions.json")
    except Exception as e:
        print(f"Error writing to main file: {e}")

if __name__ == "__main__":
    merge_phase_1_5_back()
