# ./scripts/full_question_audit.py
"""
Comprehensive question audit script for Ready for Us.
Analyzes all questions for structure optimization, examples, and AI-readability.
"""
import json
import os

def audit_phase(phase_path, phase_name):
    questions_path = os.path.join(phase_path, 'questions.json')
    
    with open(questions_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"\n{'='*70}")
    print(f" {phase_name}")
    print(f"{'='*70}")
    
    questions = sorted(data['questions'].items(), key=lambda x: x[1]['order'])
    
    issues = {
        'missing_examples': [],
        'empty_examples': [],
        'vague_prompts': [],
        'multi_select_no_limit': [],
        'potential_ranking_candidates': [],
        'long_prompts': [],
        'missing_validation': [],
        'unclear_answer_schema': []
    }
    
    stats = {
        'total': len(questions),
        'by_type': {},
        'with_examples': 0,
        'with_validation': 0,
        'lite_count': 0,
        'full_only_count': 0
    }
    
    for qid, q in questions:
        qtype = q.get('type', 'unknown')
        stats['by_type'][qtype] = stats['by_type'].get(qtype, 0) + 1
        
        # Check manifests
        tags = q.get('tags', {})
        manifests = tags.get('included_in_manifests', [])
        if 'lite' in manifests:
            stats['lite_count'] += 1
        if manifests == ['full']:
            stats['full_only_count'] += 1
        
        # Check examples
        examples = q.get('examples', [])
        if not examples:
            issues['missing_examples'].append((qid, q.get('title', '')))
        elif examples == [] or all(e.strip() == '' for e in examples):
            issues['empty_examples'].append((qid, q.get('title', '')))
        else:
            stats['with_examples'] += 1
        
        # Check validation
        if q.get('validation') or (qtype == 'compound' and any(f.get('validation') for f in q.get('fields', []))):
            stats['with_validation'] += 1
        
        # Check multi_select without limits
        if qtype == 'multi_select':
            if not q.get('validation', {}).get('max_selected'):
                issues['multi_select_no_limit'].append((qid, q.get('title', '')))
        
        # Check for ranking keywords in non-ranked questions
        prompt = q.get('prompt', '').lower()
        title = q.get('title', '').lower()
        combined = prompt + ' ' + title
        ranking_keywords = ['top', 'rank', 'priority', 'most important', 'order']
        
        has_ranking = False
        if qtype == 'compound':
            for field in q.get('fields', []):
                if field.get('type') == 'ranked_select':
                    has_ranking = True
                    break
        
        if any(kw in combined for kw in ranking_keywords) and not has_ranking:
            issues['potential_ranking_candidates'].append((qid, q.get('title', ''), qtype))
        
        # Check for long prompts
        if len(q.get('prompt', '')) > 200:
            issues['long_prompts'].append((qid, q.get('title', ''), len(q.get('prompt', ''))))
    
    # Print stats
    print("\n[STATISTICS]")
    print(f"  Total questions: {stats['total']}")
    print(f"  Lite mode: {stats['lite_count']}")
    print(f"  Full-only: {stats['full_only_count']}")
    print(f"  With examples: {stats['with_examples']} ({100*stats['with_examples']//stats['total']}%)")
    print(f"  With validation: {stats['with_validation']}")
    print("\n  By type:")
    for t, c in sorted(stats['by_type'].items()):
        print(f"    {t}: {c}")
    
    # Print issues
    print("\n[ISSUES FOUND]")
    
    if issues['missing_examples']:
        print(f"\n  Missing examples ({len(issues['missing_examples'])}):")
        for qid, title in issues['missing_examples'][:10]:  # Limit output
            print(f"    {qid}: {title}")
        if len(issues['missing_examples']) > 10:
            print(f"    ... and {len(issues['missing_examples']) - 10} more")
    
    if issues['multi_select_no_limit']:
        print(f"\n  Multi-select without max_selected ({len(issues['multi_select_no_limit'])}):")
        for qid, title in issues['multi_select_no_limit']:
            print(f"    {qid}: {title}")
    
    if issues['potential_ranking_candidates']:
        print(f"\n  Potential ranking candidates ({len(issues['potential_ranking_candidates'])}):")
        for qid, title, qtype in issues['potential_ranking_candidates']:
            print(f"    {qid} [{qtype}]: {title}")
    
    if issues['long_prompts']:
        print(f"\n  Long prompts (>200 chars) ({len(issues['long_prompts'])}):")
        for qid, title, length in issues['long_prompts']:
            print(f"    {qid}: {title} ({length} chars)")
    
    return issues, stats

def main():
    print("\n" + "="*70)
    print(" FULL QUESTION AUDIT - Ready for Us")
    print("="*70)
    
    phase0_issues, phase0_stats = audit_phase('data/phase_0', 'PHASE 0: Pre-Dating Readiness')
    phase15_issues, phase15_stats = audit_phase('data/phase_1.5', 'PHASE 1.5: Slow Build Check-In')
    
    print("\n" + "="*70)
    print(" SUMMARY")
    print("="*70)
    print(f"\nPhase 0: {phase0_stats['total']} questions, {len(phase0_issues['missing_examples'])} missing examples")
    print(f"Phase 1.5: {phase15_stats['total']} questions, {len(phase15_issues['missing_examples'])} missing examples")

if __name__ == '__main__':
    main()
