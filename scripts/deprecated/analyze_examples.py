
import json

def analyze():
    with open(r'c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_0\questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', {})
    
    print("ID | Issue | Example | Options (First 3)")
    print("---|---|---|---")

    for qid in sorted(questions.keys(), key=lambda k: questions[k].get('order', 999)):
        q = questions[qid]
        examples = q.get('examples', [])
        current_ex = examples[0] if examples else ""
        options = q.get('options', [])
        labels = {o['label'] for o in options}
        
        if q['type'] in ['single_select', 'multi_select']:
            # Check if example starts with any label
            starts_with_label = any(current_ex.startswith(l) or l.startswith(current_ex) for l in labels)
            
            if not starts_with_label:
                opt_str = "; ".join([o['label'] for o in options[:3]])
                print(f"{qid} | No Match | {current_ex} | {opt_str}")
                
        elif q['type'] in ['free_text', 'compound']:
            # List them so I can review validity
            print(f"{qid} | Free/Comp | {current_ex} | (N/A)")

if __name__ == "__main__":
    analyze()
