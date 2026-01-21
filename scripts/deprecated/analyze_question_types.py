# ./scripts/analyze_question_types.py
"""
Analyze question types in each phase and identify enhancement opportunities.
"""
import json
import os

def analyze_phase(phase_path, phase_name):
    questions_path = os.path.join(phase_path, 'questions.json')
    
    with open(questions_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"\n{'='*60}")
    print(f"{phase_name}")
    print(f"{'='*60}")
    
    # Count types
    type_counts = {}
    compound_field_types = {}
    
    questions = sorted(data['questions'].items(), key=lambda x: x[1]['order'])
    
    for qid, q in questions:
        qtype = q.get('type', 'unknown')
        type_counts[qtype] = type_counts.get(qtype, 0) + 1
        
        # For compound, analyze field types
        if qtype == 'compound':
            for field in q.get('fields', []):
                ftype = field.get('type', 'unknown')
                compound_field_types[ftype] = compound_field_types.get(ftype, 0) + 1
    
    print("\nQuestion Type Distribution:")
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")
    
    if compound_field_types:
        print("\nCompound Field Types Used:")
        for t, c in sorted(compound_field_types.items()):
            print(f"  {t}: {c}")
    
    # Identify candidates for enhancement
    print("\n--- Enhancement Candidates ---")
    
    ranking_candidates = []
    for qid, q in questions:
        title = q.get('title', '')
        prompt = q.get('prompt', '')
        qtype = q.get('type', '')
        
        # Look for ranking keywords
        ranking_keywords = ['top 3', 'top 5', 'rank', 'priorit', 'most important', 'order']
        combined = (title + ' ' + prompt).lower()
        
        if any(kw in combined for kw in ranking_keywords):
            # Check if already using ranked_select
            is_ranked = False
            if qtype == 'compound':
                for field in q.get('fields', []):
                    if field.get('type') == 'ranked_select':
                        is_ranked = True
                        break
            
            if not is_ranked:
                ranking_candidates.append((qid, title, qtype))
    
    if ranking_candidates:
        print("\nQuestions that might benefit from ranked_select:")
        for qid, title, qtype in ranking_candidates:
            print(f"  {qid} [{qtype}]: {title}")
    else:
        print("\nNo obvious ranking candidates found.")
    
    # Look for multi_select that might benefit from ranking
    print("\nMulti-select questions (could add optional ranking):")
    for qid, q in questions:
        if q.get('type') == 'multi_select':
            print(f"  {qid}: {q.get('title')}")

if __name__ == '__main__':
    analyze_phase('data/phase_0', 'PHASE 0: Pre-Dating Readiness')
    analyze_phase('data/phase_1.5', 'PHASE 1.5: Slow Build Check-In')
