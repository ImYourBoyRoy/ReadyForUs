
import json
import os

def audit_examples():
    file_path = r'c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_0\questions.json'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', {})
    
    print("# Phase 0 Question Examples Audit\n")
    print("| ID | Title | Type | Current Examples | Options/Context |")
    print("|---|---|---|---|---|")
    
    # Sort by order if possible, else by ID
    sorted_q_ids = sorted(questions.keys(), key=lambda k: questions[k].get('order', 999))
    
    for qid in sorted_q_ids:
        q = questions[qid]
        title = q.get('title', 'N/A')
        q_type = q.get('type', 'N/A')
        examples = q.get('examples', [])
        options = q.get('options', [])
        
        # Format examples
        examples_str = "<br>".join([f"`{ex}`" for ex in examples]) or "(None)"
        
        # Format options summary
        if options:
            opt_summary = ", ".join([f"{o.get('value')} ({o.get('label')[:30]}...)" for o in options[:5]])
            if len(options) > 5:
                opt_summary += "..."
        else:
            opt_summary = "N/A"
            
        print(f"| {qid} | {title} | {q_type} | {examples_str} | {opt_summary} |")

if __name__ == "__main__":
    audit_examples()
