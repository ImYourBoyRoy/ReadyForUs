# ./scripts/analyze_questions.py
"""
Analyze questions in each phase to extract titles and sections.
"""
import json
import os

def analyze_phase(phase_path, phase_name):
    questions_path = os.path.join(phase_path, 'questions.json')
    
    with open(questions_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"\n{phase_name}")
    print("=" * 60)
    
    # Get sections
    sections = {s['id']: s['title'] for s in data.get('sections', [])}
    
    # Get lite and full question lists
    manifests = data.get('manifests', {})
    lite_ids = set(manifests.get('lite', {}).get('question_ids', []))
    full_ids = set(manifests.get('full', {}).get('question_ids', []))
    
    # Sort questions by order
    questions = sorted(data['questions'].items(), key=lambda x: x[1]['order'])
    
    current_section = None
    for qid, q in questions:
        section_id = q.get('section_id')
        if section_id != current_section:
            current_section = section_id
            print(f"\n### {sections.get(section_id, 'Unknown Section')}")
        
        mode = "L+F" if qid in lite_ids else "F"
        print(f"  {qid} [{mode}]: {q['title']}")

if __name__ == '__main__':
    analyze_phase('data/phase_0', 'PHASE 0: Pre-Dating Readiness')
    analyze_phase('data/phase_1.5', 'PHASE 1.5: Slow Build Check-In')
