
import json

FIXES = {
    "q01": "Cautiously ready (I can date lightly while working on myself)",
    "q11": "Never married",
    "q12": "Mixed",
    "q13": "Friendly contact (occasional)",
    "q15": "Minor",
    "q16": "Yes",
    "q29": "Secure (comfortable with closeness and independence)",
    "q30": "1-2 days",
    "q32": "Stay honest even if it risks the relationship",
    "q33": "Strong (clear + kind + consistent)",
    "q35": "Mild worry but I regulate",
    "q39": "Aligned (my behavior matches my values)",
    "q42": "Intentional dating (clear path to commitment)",
    "q44": "Dinner/coffee talk",
    "q74": "Hold boundary clearly - I would talk about it openly.",
    "q75": "Clearer intentions early - I want more communication.",
    "q77": "Moderate - I have student loans (~$20k) and a car payment.",
    "q79": "Willing - I prefer direct and honest feedback."
}

def apply_fixes():
    path = r'c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_0\questions.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', {})
    updated_count = 0
    
    for qid, new_ex in FIXES.items():
        if qid in questions:
            questions[qid]['examples'] = [new_ex]
            updated_count += 1
            print(f"Updated {qid}")
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Total updated: {updated_count}")

if __name__ == "__main__":
    apply_fixes()
