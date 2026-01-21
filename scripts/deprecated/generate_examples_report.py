# ./scripts/generate_examples_report.py
"""
Generate a detailed report of questions missing examples with their structure
so examples can be systematically added.
"""
import json

def main():
    with open('data/phase_0/questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = sorted(data['questions'].items(), key=lambda x: x[1]['order'])
    
    missing = []
    for qid, q in questions:
        examples = q.get('examples', [])
        if not examples or all(e.strip() == '' for e in examples):
            missing.append((qid, q))
    
    print(f"Questions missing examples: {len(missing)}\n")
    
    for qid, q in missing:
        print(f"=== {qid}: {q.get('title', '')} ===")
        print(f"Type: {q.get('type', '')}")
        print(f"Prompt: {q.get('prompt', '')[:100]}...")
        
        qtype = q.get('type', '')
        if qtype == 'single_select':
            options = q.get('options', [])
            print(f"Options: {[o['label'] for o in options[:5]]}...")
        elif qtype == 'multi_select':
            options = q.get('options', [])
            print(f"Options: {[o['label'] for o in options[:5]]}...")
        elif qtype == 'compound':
            fields = q.get('fields', [])
            for f in fields[:3]:
                print(f"  Field: {f.get('key')} ({f.get('type')})")
        print()

if __name__ == '__main__':
    main()
