# ./scripts/validate_schema.py
"""
Schema Validator - Questions.json Validation Tool
==================================================

Validates questions.json files against SCHEMA.md without manual inspection.
Catches errors before runtime with comprehensive structural and reference validation.

Usage:
    python scripts/validate_schema.py [--phase PHASE] [--format FORMAT] [--strict]
    python scripts/validate_schema.py --phase phase_0
    python scripts/validate_schema.py --check structure,references --format json

CLI Arguments:
    --phase: Optional. Specific phase to validate. Default: all phases
    --format: Optional. Output format (text, json, markdown). Default: text
    --output: Optional. File path to save validation report
    --check: Optional. Comma-separated checks to run. Default: all
    --strict: Optional. Fail on warnings (not just errors)
    --verbose: Optional. Show detailed validation info

Available Checks:
    structure: Required fields present (id, title, type, etc.)
    types: Question types are valid 
    references: section_id and question_id references exist
    manifests: Manifest question_ids point to real questions
    options: Options have value and label
    fields: Compound field structures valid
    duplicates: No duplicate IDs or order numbers
    orphans: All questions in at least one section
    syntax: JSON is well-formed

Inputs:
    - data/{phase}/questions.json
    - data/SCHEMA.md (reference)

Outputs:
    - Validation report to stdout or file
    - Exit code: 0 (pass), 1 (fail)
    - Concise error/warning messages

Operational Notes:
    - Read-only operation (no modifications)
    - Fast validation (<1 second per phase)
    - Can run in CI/CD pipelines
    - Strict mode for pre-commit hooks
    - Token-efficient: ~10 tokens to run vs ~2,000 for manual review

Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict


class SchemaValidator:
    """Validates questions.json against schema requirements."""
    
    VALID_TYPES = ['free_text', 'single_select', 'multi_select', 'ranked_select', 'compound']
    VALID_MANIFESTS = ['lite', 'full']
    REQUIRED_QUESTION_FIELDS = ['id', 'section_id', 'order', 'title', 'prompt', 'type', 'answer_schema', 'examples', 'tags']
    
    ALL_CHECKS = [
        'structure',
        'types',
        'references',
        'manifests',
        'options',
        'fields',
        'duplicates',
        'orphans',
        'best_practices',
        'syntax'
    ]
    
    def __init__(self, enabled_checks: List[str] = None, strict: bool = False, verbose: bool = False):
        self.enabled_checks = set(enabled_checks) if enabled_checks else set(self.ALL_CHECKS)
        self.strict = strict
        self.verbose = verbose
    
    def validate_phase(self, phase_dir: Path) -> Dict:
        """Validate a single phase. Returns validation results."""
        questions_file = phase_dir / "questions.json"
        
        if not questions_file.exists():
            return {
                'phase': phase_dir.name,
                'status': 'ERROR',
                'message': 'questions.json not found',
                'errors': [],
                'warnings': []
            }
        
        # Load and validate JSON syntax
        try:
            with open(questions_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return {
                'phase': phase_dir.name,
                'status': 'ERROR',
                'message': f'JSON syntax error: {e}',
                'errors': [str(e)],
                'warnings': []
            }
        
        errors = []
        warnings = []
        
        # Run enabled checks
        if 'structure' in self.enabled_checks:
            errors.extend(self._check_structure(data))
        
        if 'types' in self.enabled_checks:
            errors.extend(self._check_types(data))
        
        if 'references' in self.enabled_checks:
            errors.extend(self._check_references(data))
        
        if 'manifests' in self.enabled_checks:
            errors.extend(self._check_manifests(data))
        
        if 'options' in self.enabled_checks:
            errors.extend(self._check_options(data))
        
        if 'fields' in self.enabled_checks:
            errors.extend(self._check_fields(data))
        
        if 'duplicates' in self.enabled_checks:
            errors.extend(self._check_duplicates(data))
        
        if 'orphans' in self.enabled_checks:
            warnings_found = self._check_orphans(data)
            if self.strict:
                errors.extend(warnings_found)
            else:
                warnings.extend(warnings_found)
        
        if 'best_practices' in self.enabled_checks:
            warnings_found = self._check_best_practices(data)
            if self.strict:
                errors.extend(warnings_found)
            else:
                warnings.extend(warnings_found)
        
        # Determine status
        if errors:
            status = 'FAIL'
        elif warnings:
            status = 'WARN'
        else:
            status = 'PASS'
        
        return {
            'phase': phase_dir.name,
            'status': status,
            'errors': errors,
            'warnings': warnings,
            'checks_run': list(self.enabled_checks)
        }
    
    def _check_structure(self, data: Dict) -> List[str]:
        """Check required top-level structure."""
        errors = []
        
        if 'sections' not in data:
            errors.append("Missing 'sections' array")
        if 'questions' not in data:
            errors.append("Missing 'questions' object")
        if 'manifests' not in data:
            errors.append("Missing 'manifests' object")
        
        # Check questions have required fields
        for qid, q in data.get('questions', {}).items():
            missing = [f for f in self.REQUIRED_QUESTION_FIELDS if f not in q]
            if missing:
                errors.append(f"{qid}: Missing required fields: {', '.join(missing)}")
        
        return errors
    
    def _check_types(self, data: Dict) -> List[str]:
        """Validate question types."""
        errors = []
        
        for qid, q in data.get('questions', {}).items():
            qtype = q.get('type')
            if qtype and qtype not in self.VALID_TYPES:
                errors.append(f"{qid}: Invalid type '{qtype}'. Must be one of {self.VALID_TYPES}")
        
        return errors
    
    def _check_references(self, data: Dict) -> List[str]:
        """Check section_id references exist."""
        errors = []
        
        section_ids = {s['id'] for s in data.get('sections', [])}
        
        for qid, q in data.get('questions', {}).items():
            section_id = q.get('section_id')
            if section_id and section_id not in section_ids:
                errors.append(f"{qid}: Invalid section_id '{section_id}' (section doesn't exist)")
        
        return errors
    
    def _check_manifests(self, data: Dict) -> List[str]:
        """Validate manifest question_id references."""
        errors = []
        
        question_ids = set(data.get('questions', {}).keys())
        
        for manifest_name, manifest in data.get('manifests', {}).items():
            for qid in manifest.get('question_ids', []):
                if qid not in question_ids:
                    errors.append(f"Manifest '{manifest_name}': References non-existent question '{qid}'")
        
        return errors
    
    def _check_options(self, data: Dict) -> List[str]:
        """Validate options for select-type questions."""
        errors = []
        
        for qid, q in data.get('questions', {}).items():
            if q.get('type') in ['single_select', 'multi_select']:
                options = q.get('options', [])
                
                if not options:
                    errors.append(f"{qid}: Select-type question missing options array")
                
                for i, opt in enumerate(options):
                    if 'value' not in opt:
                        errors.append(f"{qid}: Option {i} missing 'value'")
                    if 'label' not in opt:
                        errors.append(f"{qid}: Option {i} missing 'label'")
        
        return errors
    
    def _check_best_practices(self, data: Dict) -> List[str]:
        """Check best practices (returns warnings, not errors)."""
        warnings = []
        
        for qid, q in data.get('questions', {}).items():
            # Warn if multi_select has no max limit (can cause analysis paralysis)
            if q.get('type') == 'multi_select':
                if 'max' not in q:
                    num_options = len(q.get('options', []))
                    warnings.append(f"{qid}: multi_select has no max limit ({num_options} options). Consider adding max to prevent analysis paralysis.")
        
        return warnings
    
    def _check_fields(self, data: Dict) -> List[str]:
        """Validate compound field structures."""
        errors = []
        
        for qid, q in data.get('questions', {}).items():
            if q.get('type') == 'compound':
                fields = q.get('fields', [])
                
                if not fields:
                    errors.append(f"{qid}: Compound question missing 'fields' array")
                
                for field in fields:
                    if 'key' not in field:
                        errors.append(f"{qid}: Compound field missing 'key'")
                    if 'type' not in field:
                        errors.append(f"{qid}: Compound field missing 'type'")
                    if 'label' not in field:
                        errors.append(f"{qid}: Compound field missing 'label'")
        
        return errors
    
    def _check_duplicates(self, data: Dict) -> List[str]:
        """Check for duplicate IDs and order numbers."""
        errors = []
        
        # Check duplicate question IDs (shouldn't happen with dict keys, but check anyway)
        question_ids = list(data.get('questions', {}).keys())
        if len(question_ids) != len(set(question_ids)):
            duplicates = [qid for qid in question_ids if question_ids.count(qid) > 1]
            errors.append(f"Duplicate question IDs found: {', '.join(set(duplicates))}")
        
        # Check duplicate order numbers within sections
        for section in data.get('sections', []):
            section_questions = section.get('question_ids', [])
            orders = {}
            
            for qid in section_questions:
                if qid in data.get('questions', {}):
                    order = data['questions'][qid].get('order')
                    if order in orders:
                        errors.append(f"Section {section['id']}: Duplicate order {order} ({orders[order]} and {qid})")
                    orders[order] = qid
        
        return errors
    
    def _check_orphans(self, data: Dict) -> List[str]:
        """Find questions not in any section."""
        warnings = []
        
        # Get all questions in sections
        questions_in_sections = set()
        for section in data.get('sections', []):
            questions_in_sections.update(section.get('question_ids', []))
        
        # Find orphans
        all_questions = set(data.get('questions', {}).keys())
        orphans = all_questions - questions_in_sections
        
        if orphans:
            warnings.append(f"Orphan questions (not in any section): {', '.join(sorted(orphans))}")
        
        return warnings
    
    def format_text(self, results: List[Dict]) -> str:
        """Format validation results as text."""
        lines = []
        lines.append("=" * 70)
        lines.append(" SCHEMA VALIDATION REPORT")
        lines.append("=" * 70)
        lines.append("")
        
        total_pass = sum(1 for r in results if r['status'] == 'PASS')
        total_warn = sum(1 for r in results if r['status'] == 'WARN')
        total_fail = sum(1 for r in results if r['status'] == 'FAIL')
        
        for result in results:
            status_symbol = {
                'PASS': '[PASS]',
                'WARN': '[WARN]',
                'FAIL': '[FAIL]',
                'ERROR': '[ERROR]'
            }.get(result['status'], '[?]')
            
            lines.append(f"{status_symbol} {result['phase']}: {result['status']}")
            
            if result.get('message'):
                lines.append(f"  {result['message']}")
            
            if result.get('errors'):
                lines.append(f"  ERRORS ({len(result['errors'])}):")
                for error in result['errors'][:10]:
                    lines.append(f"    - {error}")
                if len(result['errors']) > 10:
                    lines.append(f"    ... and {len(result['errors']) - 10} more")
            
            if result.get('warnings'):
                lines.append(f"  WARNINGS ({len(result['warnings'])}):")
                for warning in result['warnings'][:10]:
                    lines.append(f"    - {warning}")
                if len(result['warnings']) > 10:
                    lines.append(f"    ... and {len(result['warnings']) - 10} more")
            
            lines.append("")
        
        lines.append("=" * 70)
        lines.append(f" SUMMARY: {total_pass} passed, {total_warn} warnings, {total_fail} failed")
        lines.append("=" * 70)
        
        return "\n".join(lines)
    
    def format_json(self, results: List[Dict]) -> str:
        """Format validation results as JSON."""
        return json.dumps(results, indent=2, ensure_ascii=False)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Schema Validator - Validate questions.json against SCHEMA.md",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--phase', help='Specific phase to validate (default: all)')
    parser.add_argument('--format', choices=['text', 'json'], default='text')
    parser.add_argument('--output', help='Save report to file')
    parser.add_argument('--check', help=f'Checks to run (comma-separated). Available: {", ".join(SchemaValidator.ALL_CHECKS)}')
    parser.add_argument('--strict', action='store_true', help='Fail on warnings')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Parse checks
    enabled_checks = None
    if args.check:
        enabled_checks = [c.strip() for c in args.check.split(',')]
        invalid = [c for c in enabled_checks if c not in SchemaValidator.ALL_CHECKS]
        if invalid:
            print(f"ERROR: Invalid check(s): {', '.join(invalid)}")
            print(f"Available: {', '.join(SchemaValidator.ALL_CHECKS)}")
            sys.exit(1)
    
    # Find project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "data"
    
    if not data_dir.exists():
        print(f"ERROR: Data directory not found: {data_dir}")
        sys.exit(1)
    
    # Get phases to validate
    if args.phase:
        phases = [data_dir / args.phase]
        if not phases[0].exists():
            print(f"ERROR: Phase directory not found: {args.phase}")
            sys.exit(1)
    else:
        phases = [p for p in data_dir.iterdir() if p.is_dir() and p.name.startswith('phase')]
        phases.sort()
    
    # Run validation
    validator = SchemaValidator(enabled_checks=enabled_checks, strict=args.strict, verbose=args.verbose)
    results = []
    
    for phase_dir in phases:
        result = validator.validate_phase(phase_dir)
        results.append(result)
    
    # Format output
    if args.format == 'json':
        output = validator.format_json(results)
    else:
        output = validator.format_text(results)
    
    # Output
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"✓ Validation report saved to: {args.output}")
    else:
        print(output)
    
    # Exit code
    has_failures = any(r['status'] in ['FAIL', 'ERROR'] for r in results)
    sys.exit(1 if has_failures else 0)


if __name__ == "__main__":
    main()
