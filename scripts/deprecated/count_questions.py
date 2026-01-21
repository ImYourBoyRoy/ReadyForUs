# ./scripts/count_questions.py
"""
Utility to count questions in each manifest for verification.
"""
import json
import os

def count_phase(phase_path):
    questions_path = os.path.join(phase_path, 'questions.json')
    
    with open(questions_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    manifests = data.get('manifests', {})
    
    lite_count = len(manifests.get('lite', {}).get('question_ids', []))
    full_count = len(manifests.get('full', {}).get('question_ids', []))
    
    return lite_count, full_count

if __name__ == '__main__':
    phases = ['data/phase_0', 'data/phase_1.5']
    
    print("Question Counts by Phase:")
    print("=" * 40)
    
    for phase in phases:
        lite, full = count_phase(phase)
        print(f"{phase}:")
        print(f"  Lite: {lite}")
        print(f"  Full: {full}")
        print()
