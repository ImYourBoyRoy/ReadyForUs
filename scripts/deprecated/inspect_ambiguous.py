
import json

def inspect():
    with open(r'c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_0\questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', {})
    q_ids = ['q12', 'q13', 'q15', 'q16', 'q17', 'q29', 'q30', 'q32', 'q33', 'q35']
    
    for qid in q_ids:
        q = questions.get(qid)
        if q:
            print(f"--- {qid}: {q['title']} ---")
            for o in q.get('options', []):
                print(f"  {o['label']}")

if __name__ == "__main__":
    inspect()
