# ./scripts/audit_questions.py
"""
Question Audit Tool - Comprehensive Analysis for Ready for Us PWA
==================================================================

Performs comprehensive auditing and analysis of questionnaire questions
across all phases, checking structure, examples, validation, and more.

Usage:
    python scripts/audit_questions.py [--phase PHASE] [--format FORMAT] [--output FILE]
    python scripts/audit_questions.py --phase phase_1 --format json
    python scripts/audit_questions.py --check missing_examples,validation

CLI Arguments:
    --phase: Optional. Specific phase to audit (e.g., phase_0, phase_1). Default: all phases
    --format: Optional. Output format: text, json, or markdown. Default: text
    --output: Optional. File path to save audit report. Default: stdout
    --check: Optional. Comma-separated list of specific checks to run. Default: all
    --verbose: Optional. Enable detailed logging

Available Checks:
    - missing_examples: Questions without examples
    - validation: Validation coverage analysis
    - multi_select_limits: Multi-select questions without max limits
    - ranking_candidates: Questions that might benefit from ranking
    - long_prompts: Prompts exceeding 200 characters
    - options_review: Review options for select-type questions
    - compound_fields: Analyze compound question fields

Inputs:
    - data/{phase}/questions.json
    - data/{phase}/manifest.json (optional, for phase titles)

Outputs:
    - Audit report to stdout or specified file
    - Statistics: question counts, type distribution, manifest distribution
    - Issue reports: missing examples, validation gaps, etc.

Operational Notes:
    - Auto-discovers all data/phase_* directories
    - Safe read-only operation with no side effects
    - Can filter by specific checks to reduce output
    
Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from collections import defaultdict


class QuestionAuditor:
    """Audits questionnaire questions for quality and completeness."""
    
    ALL_CHECKS = [
        'missing_examples',
        'validation',
        'multi_select_limits',
        'ranking_candidates',
        'long_prompts',
        'options_review',
        'compound_fields'
    ]
    
    def __init__(self, data_dir: Path, enabled_checks: Optional[List[str]] = None, verbose: bool = False):
        self.data_dir = data_dir
        self.enabled_checks = set(enabled_checks) if enabled_checks else set(self.ALL_CHECKS)
        self.verbose = verbose
        self.results = []
    
    def log(self, message: str) -> None:
        """Log message if verbose enabled."""
        if self.verbose:
            print(f"[DEBUG] {message}", file=sys.stderr)
    
    def discover_phases(self) -> List[str]:
        """Auto-discover all phase directories."""
        phases = []
        for item in self.data_dir.iterdir():
            if item.is_dir() and item.name.startswith("phase"):
                phases.append(item.name)
        phases.sort()
        return phases
    
    def audit_phase(self, phase_name: str) -> Dict:
        """Audit a single phase and return results."""
        phase_dir = self.data_dir / phase_name
        questions_path = phase_dir / "questions.json"
        manifest_path = phase_dir / "manifest.json"
        
        if not questions_path.exists():
            return {
                'phase': phase_name,
                'error': 'questions.json not found',
                'stats': {},
                'issues': {}
            }
        
        # Load phase data
        with open(questions_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Get phase title from manifest if available
        phase_title = phase_name
        if manifest_path.exists():
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
                phase_title = manifest.get("artifact", {}).get("title", phase_name)
        
        self.log(f"Auditing {phase_name} ({phase_title})")
        
        # Initialize results
        issues = defaultdict(list)
        stats = {
            'total': len(data.get('questions', {})),
            'by_type': defaultdict(int),
            'with_examples': 0,
            'with_validation': 0,
            'lite_count': 0,
            'full_only_count': 0
        }
        
        # Get manifest data
        manifests = data.get('manifests', {})
        lite_ids = set(manifests.get('lite', {}).get('question_ids', []))
        full_ids = set(manifests.get('full', {}).get('question_ids', []))
        
        # Process each question
        questions = data.get('questions', {})
        for qid in sorted(questions.keys(), key=lambda x: questions[x].get('order', 0)):
            q = questions[qid]
            q_type = q.get('type', 'unknown')
            stats['by_type'][q_type] += 1
            
            # Manifest stats
            if qid in lite_ids:
                stats['lite_count'] += 1
            if qid in full_ids and qid not in lite_ids:
                stats['full_only_count'] += 1
            
            # Run enabled checks
            if 'missing_examples' in self.enabled_checks:
                self._check_examples(qid, q, issues, stats)
            
            if 'validation' in self.enabled_checks:
                self._check_validation(qid, q, issues, stats)
            
            if 'multi_select_limits' in self.enabled_checks:
                self._check_multi_select_limits(qid, q, q_type, issues)
            
            if 'ranking_candidates' in self.enabled_checks:
                self._check_ranking_candidates(qid, q, q_type, issues)
            
            if 'long_prompts' in self.enabled_checks:
                self._check_long_prompts(qid, q, issues)
            
            if 'options_review' in self.enabled_checks:
                self._check_options(qid, q, q_type, issues)
            
            if 'compound_fields' in self.enabled_checks:
                self._check_compound_fields(qid, q, q_type, issues)
        
        return {
            'phase': phase_name,
            'phase_title': phase_title,
            'stats': dict(stats),
            'issues': dict(issues)
        }
    
    def _check_examples(self, qid: str, q: Dict, issues: Dict, stats: Dict) -> None:
        """Check for missing or empty examples."""
        examples = q.get('examples', [])
        if not examples:
            issues['missing_examples'].append({
                'qid': qid,
                'title': q.get('title', '')
            })
        elif all(e.strip() == '' for e in examples):
            issues['empty_examples'].append({
                'qid': qid,
                'title': q.get('title', '')
            })
        else:
            stats['with_examples'] += 1
    
    def _check_validation(self, qid: str, q: Dict, issues: Dict, stats: Dict) -> None:
        """Check validation coverage."""
        has_validation = False
        
        if q.get('validation'):
            has_validation = True
        elif q.get('type') == 'compound':
            if any(f.get('validation') for f in q.get('fields', [])):
                has_validation = True
        
        if has_validation:
            stats['with_validation'] += 1
    
    def _check_multi_select_limits(self, qid: str, q: Dict, q_type: str, issues: Dict) -> None:
        """Check multi-select questions for max limits."""
        if q_type == 'multi_select':
            if not q.get('validation', {}).get('max_selected'):
                issues['multi_select_no_limit'].append({
                    'qid': qid,
                    'title': q.get('title', '')
                })
    
    def _check_ranking_candidates(self, qid: str, q: Dict, q_type: str, issues: Dict) -> None:
        """Check for questions that might benefit from ranking."""
        prompt = q.get('prompt', '').lower()
        title = q.get('title', '').lower()
        combined = prompt + ' ' + title
        ranking_keywords = ['top', 'rank', 'priority', 'most important', 'order']
        
        has_ranking = False
        if q_type == 'compound':
            for field in q.get('fields', []):
                if field.get('type') == 'ranked_select':
                    has_ranking = True
                    break
        
        if any(kw in combined for kw in ranking_keywords) and not has_ranking:
            issues['potential_ranking_candidates'].append({
                'qid': qid,
                'title': q.get('title', ''),
                'type': q_type
            })
    
    def _check_long_prompts(self, qid: str, q: Dict, issues: Dict) -> None:
        """Check for prompts exceeding 200 characters."""
        prompt = q.get('prompt', '')
        if len(prompt) > 200:
            issues['long_prompts'].append({
                'qid': qid,
                'title': q.get('title', ''),
                'length': len(prompt)
            })
    
    def _check_options(self, qid: str, q: Dict, q_type: str, issues: Dict) -> None:
        """Review options for select-type questions."""
        if q_type in ['single_select', 'multi_select']:
            options = q.get('options', [])
            if not options:
                issues['questions_without_options'].append({
                    'qid': qid,
                    'title': q.get('title', ''),
                    'type': q_type
                })
    
    def _check_compound_fields(self, qid: str, q: Dict, q_type: str, issues: Dict) -> None:
        """Analyze compound question fields."""
        if q_type == 'compound':
            fields = q.get('fields', [])
            if not fields:
                issues['compound_without_fields'].append({
                    'qid': qid,
                    'title': q.get('title', '')
                })
    
    def format_text(self, results: List[Dict]) -> str:
        """Format audit results as text."""
        lines = []
        lines.append("=" * 70)
        lines.append(" QUESTION AUDIT REPORT - Ready for Us PWA")
        lines.append("=" * 70)
        lines.append("")
        
        for result in results:
            if 'error' in result:
                lines.append(f"\n[ERROR] {result['phase']}: {result['error']}")
                continue
            
            lines.append("=" * 70)
            lines.append(f" {result['phase_title']} ({result['phase']})")
            lines.append("=" * 70)
            
            # Statistics
            stats = result['stats']
            lines.append("\n[STATISTICS]")
            lines.append(f"  Total questions: {stats['total']}")
            lines.append(f"  Lite mode: {stats['lite_count']}")
            lines.append(f"  Full-only: {stats['full_only_count']}")
            
            if stats['total'] > 0:
                example_pct = (stats['with_examples'] * 100) // stats['total']
                lines.append(f"  With examples: {stats['with_examples']} ({example_pct}%)")
                lines.append(f"  With validation: {stats['with_validation']}")
            
            lines.append("\n  By type:")
            for q_type, count in sorted(stats['by_type'].items()):
                lines.append(f"    {q_type}: {count}")
            
            # Issues
            issues = result['issues']
            lines.append("\n[ISSUES FOUND]")
            
            if not any(issues.values()):
                lines.append("  No issues found!")
            
            for issue_type, issue_list in issues.items():
                if not issue_list:
                    continue
                
                title = issue_type.replace('_', ' ').title()
                lines.append(f"\n  {title} ({len(issue_list)}):")
                
                for item in issue_list[:10]:  # Limit to 10 items
                    if 'length' in item:
                        lines.append(f"    {item['qid']}: {item['title']} ({item['length']} chars)")
                    elif 'type' in item:
                        lines.append(f"    {item['qid']} [{item['type']}]: {item['title']}")
                    else:
                        lines.append(f"    {item['qid']}: {item['title']}")
                
                if len(issue_list) > 10:
                    lines.append(f"    ... and {len(issue_list) - 10} more")
            
            lines.append("")
        
        lines.append("=" * 70)
        lines.append(" END OF REPORT")
        lines.append("=" * 70)
        
        return "\n".join(lines)
    
    def format_json(self, results: List[Dict]) -> str:
        """Format audit results as JSON."""
        return json.dumps(results, indent=2, ensure_ascii=False)
    
    def format_markdown(self, results: List[Dict]) -> str:
        """Format audit results as Markdown."""
        lines = []
        lines.append("# Question Audit Report - Ready for Us PWA\n")
        
        for result in results:
            if 'error' in result:
                lines.append(f"## {result['phase']}\n")
                lines.append(f"**Error**: {result['error']}\n")
                continue
            
            lines.append(f"## {result['phase_title']} ({result['phase']})\n")
            
            # Statistics
            stats = result['stats']
            lines.append("### Statistics\n")
            lines.append(f"- **Total questions**: {stats['total']}")
            lines.append(f"- **Lite mode**: {stats['lite_count']}")
            lines.append(f"- **Full-only**: {stats['full_only_count']}")
            
            if stats['total'] > 0:
                example_pct = (stats['with_examples'] * 100) // stats['total']
                lines.append(f"- **With examples**: {stats['with_examples']} ({example_pct}%)")
                lines.append(f"- **With validation**: {stats['with_validation']}")
            
            lines.append("\n**By type:**\n")
            for q_type, count in sorted(stats['by_type'].items()):
                lines.append(f"- `{q_type}`: {count}")
            
            # Issues
            issues = result['issues']
            lines.append("\n### Issues Found\n")
            
            if not any(issues.values()):
                lines.append("✓ No issues found!\n")
            
            for issue_type, issue_list in issues.items():
                if not issue_list:
                    continue
                
                title = issue_type.replace('_', ' ').title()
                lines.append(f"#### {title} ({len(issue_list)})\n")
                
                for item in issue_list[:10]:
                    if 'length' in item:
                        lines.append(f"- `{item['qid']}`: {item['title']} ({item['length']} chars)")
                    elif 'type' in item:
                        lines.append(f"- `{item['qid']}` [{item['type']}]: {item['title']}")
                    else:
                        lines.append(f"- `{item['qid']}`: {item['title']}")
                
                if len(issue_list) > 10:
                    lines.append(f"\n*... and {len(issue_list) - 10} more*\n")
                
                lines.append("")
        
        lines.append("---\n")
        lines.append("*Report generated by audit_questions.py*\n")
        
        return "\n".join(lines)


def main():
    """Main entry point for Question Auditor CLI."""
    parser = argparse.ArgumentParser(
        description="Question Audit Tool - Comprehensive analysis for Ready for Us PWA",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Audit all phases:
    python scripts/audit_questions.py
  
  Audit specific phase with JSON output:
    python scripts/audit_questions.py --phase phase_1 --format json
  
  Run specific checks only:
    python scripts/audit_questions.py --check missing_examples,validation
  
  Export audit report to file:
    python scripts/audit_questions.py --output audit_report.md --format markdown
        """
    )
    
    parser.add_argument(
        '--phase',
        type=str,
        default=None,
        help='Specific phase to audit (e.g., phase_0). Default: all phases'
    )
    
    parser.add_argument(
        '--format',
        type=str,
        choices=['text', 'json', 'markdown'],
        default='text',
        help='Output format. Default: text'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default=None,
        help='File path to save audit report. Default: stdout'
    )
    
    parser.add_argument(
        '--check',
        type=str,
        default=None,
        help=f'Comma-separated list of checks to run. Available: {", ".join(QuestionAuditor.ALL_CHECKS)}. Default: all'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    # Parse checks
    enabled_checks = None
    if args.check:
        enabled_checks = [c.strip() for c in args.check.split(',')]
        invalid = [c for c in enabled_checks if c not in QuestionAuditor.ALL_CHECKS]
        if invalid:
            print(f"[ERROR] Invalid check(s): {', '.join(invalid)}", file=sys.stderr)
            print(f"Available checks: {', '.join(QuestionAuditor.ALL_CHECKS)}", file=sys.stderr)
            sys.exit(1)
    
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "data"
    
    if not data_dir.exists():
        print(f"[ERROR] Data directory not found: {data_dir}", file=sys.stderr)
        sys.exit(1)
    
    # Initialize auditor
    auditor = QuestionAuditor(data_dir, enabled_checks=enabled_checks, verbose=args.verbose)
    
    # Get phases to audit
    if args.phase:
        phases = [args.phase]
        if not (data_dir / args.phase).exists():
            print(f"[ERROR] Phase directory not found: {args.phase}", file=sys.stderr)
            sys.exit(1)
    else:
        phases = auditor.discover_phases()
        if not phases:
            print("[ERROR] No phases found in data/ directory", file=sys.stderr)
            sys.exit(1)
    
    # Run audit
    results = []
    for phase in phases:
        result = auditor.audit_phase(phase)
        results.append(result)
    
    # Format output
    if args.format == 'json':
        output = auditor.format_json(results)
    elif args.format == 'markdown':
        output = auditor.format_markdown(results)
    else:
        output = auditor.format_text(results)
    
    # Write output
    if args.output:
        output_path = Path(args.output)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"[SUCCESS] Audit report saved to: {output_path}", file=sys.stderr)
    else:
        print(output)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
