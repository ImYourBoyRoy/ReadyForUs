# ./scripts/validate_prompts.py
"""
Prompts Validator - Validate prompts.json Structure
====================================================

Validates prompts.json files to ensure they match the expected structure
defined in TEMPLATE_prompts.json.

Usage:
    python scripts/validate_prompts.py --phase PHASE_ID
    python scripts/validate_prompts.py                    # Validate all phases

Inputs:
    - data/PHASE_ID/prompts.json

Outputs:
    - Exit code 0 if all validations pass
    - Exit code 1 if any validation fails
    - Validation report to stdout

Operational Notes:
    - Reports missing required fields
    - Validates prompt structure (id, title, description, role, inputs, context, output_format, constraints)
    - Checks for all four required prompts: individual_reflection_lite, individual_reflection_full, couple_reflection_lite, couple_reflection_full
    - Token-efficient: ~10 tokens to run

Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List


class PromptsValidator:
    """Validates prompts.json files against expected structure."""
    
    REQUIRED_PROMPTS = [
        'individual_reflection_lite',
        'individual_reflection_full',
        'couple_reflection_lite',
        'couple_reflection_full'
    ]
    
    REQUIRED_PROMPT_FIELDS = {
        'id': str,
        'title': str,
        'description': str,
        'role': str,
        'inputs': list,
        'context': list,
        'output_format': list,
        'constraints': list
    }
    
    REQUIRED_INPUT_FIELDS = {
        'key': str,
        'label': str,
        'placeholder': str
    }
    
    REQUIRED_OUTPUT_FORMAT_FIELDS = {
        'section': str,
        'requirements': list
    }
    
    def __init__(self, strict: bool = False):
        self.strict = strict
    
    def validate_prompts(self, prompts_path: Path) -> Dict:
        """Validate a single prompts.json file."""
        result = {
            'path': str(prompts_path),
            'phase': prompts_path.parent.name,
            'status': 'PASS',
            'errors': [],
            'warnings': []
        }
        
        # Check file exists
        if not prompts_path.exists():
            result['status'] = 'FAIL'
            result['errors'].append('File does not exist')
            return result
        
        # Load JSON
        try:
            with open(prompts_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            result['status'] = 'FAIL'
            result['errors'].append(f'Invalid JSON: {e}')
            return result
        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f'Error reading file: {e}')
            return result
        
        # Check root structure
        if 'prompts' not in data:
            result['status'] = 'FAIL'
            result['errors'].append('Missing root "prompts" object')
            return result
        
        prompts = data['prompts']
        if not isinstance(prompts, dict):
            result['status'] = 'FAIL'
            result['errors'].append('"prompts" must be an object/dict')
            return result
        
        # Check required prompts exist
        for required_prompt in self.REQUIRED_PROMPTS:
            if required_prompt not in prompts:
                result['status'] = 'FAIL'
                result['errors'].append(f'Missing required prompt: {required_prompt}')
        
        # Validate each prompt
        for prompt_name, prompt_data in prompts.items():
            # Check prompt is a dict
            if not isinstance(prompt_data, dict):
                result['status'] = 'FAIL'
                result['errors'].append(f'{prompt_name}: must be an object')
                continue
            
            # Check required fields
            for field, field_type in self.REQUIRED_PROMPT_FIELDS.items():
                if field not in prompt_data:
                    result['status'] = 'FAIL'
                    result['errors'].append(f'{prompt_name}: missing required field "{field}"')
                elif not isinstance(prompt_data[field], field_type):
                    result['status'] = 'FAIL'
                    result['errors'].append(
                        f'{prompt_name}.{field}: expected {field_type.__name__}, '
                        f'got {type(prompt_data[field]).__name__}'
                    )
            
            # Validate inputs array
            if 'inputs' in prompt_data and isinstance(prompt_data['inputs'], list):
                for idx, input_field in enumerate(prompt_data['inputs']):
                    if not isinstance(input_field, dict):
                        result['status'] = 'FAIL'
                        result['errors'].append(
                            f'{prompt_name}.inputs[{idx}]: must be an object'
                        )
                        continue
                    
                    for req_field, req_type in self.REQUIRED_INPUT_FIELDS.items():
                        if req_field not in input_field:
                            result['status'] = 'FAIL'
                            result['errors'].append(
                                f'{prompt_name}.inputs[{idx}]: missing "{req_field}"'
                            )
                        elif not isinstance(input_field[req_field], req_type):
                            result['status'] = 'FAIL'
                            result['errors'].append(
                                f'{prompt_name}.inputs[{idx}].{req_field}: expected {req_type.__name__}, '
                                f'got {type(input_field[req_field]).__name__}'
                            )
            
            # Validate output_format array
            if 'output_format' in prompt_data and isinstance(prompt_data['output_format'], list):
                for idx, section in enumerate(prompt_data['output_format']):
                    if not isinstance(section, dict):
                        result['status'] = 'FAIL'
                        result['errors'].append(
                            f'{prompt_name}.output_format[{idx}]: must be an object'
                        )
                        continue
                    
                    for req_field, req_type in self.REQUIRED_OUTPUT_FORMAT_FIELDS.items():
                        if req_field not in section:
                            result['status'] = 'FAIL'
                            result['errors'].append(
                                f'{prompt_name}.output_format[{idx}]: missing "{req_field}"'
                            )
                        elif not isinstance(section[req_field], req_type):
                            result['status'] = 'FAIL'
                            result['errors'].append(
                                f'{prompt_name}.output_format[{idx}].{req_field}: expected {req_type.__name__}, '
                                f'got {type(section[req_field]).__name__}'
                            )
            
            # Validate constraints array
            if 'constraints' in prompt_data and isinstance(prompt_data['constraints'], list):
                if len(prompt_data['constraints']) == 0:
                    result['warnings'].append(
                        f'{prompt_name}.constraints: empty array, consider adding constraints'
                    )
                for idx, constraint in enumerate(prompt_data['constraints']):
                    if not isinstance(constraint, str):
                        result['status'] = 'FAIL'
                        result['errors'].append(
                            f'{prompt_name}.constraints[{idx}]: must be a string'
                        )
            
            # Validate context array
            if 'context' in prompt_data and isinstance(prompt_data['context'], list):
                if len(prompt_data['context']) == 0:
                    result['warnings'].append(
                        f'{prompt_name}.context: empty array, consider adding context'
                    )
                for idx, context_item in enumerate(prompt_data['context']):
                    if not isinstance(context_item, str):
                        result['status'] = 'FAIL'
                        result['errors'].append(
                            f'{prompt_name}.context[{idx}]: must be a string'
                        )
            
            # Check for placeholder text that should be replaced
            placeholder_patterns = ['REPLACE:', 'REPLACE_', 'TODO:', 'FIXME:']
            for field in ['title', 'description', 'role']:
                if field in prompt_data and isinstance(prompt_data[field], str):
                    for pattern in placeholder_patterns:
                        if pattern in prompt_data[field]:
                            result['warnings'].append(
                                f'{prompt_name}.{field}: contains placeholder text "{pattern}"'
                            )
        
        # Treat warnings as errors in strict mode
        if self.strict and result['warnings']:
            result['status'] = 'FAIL'
        
        return result
    
    def format_text(self, results: List[Dict]) -> str:
        """Format validation results as text."""
        lines = []
        lines.append('=' * 70)
        lines.append(' PROMPTS VALIDATION REPORT')
        lines.append('=' * 70)
        lines.append('')
        
        passed = 0
        warnings = 0
        failed = 0
        
        for r in results:
            status_symbol = {
                'PASS': '[PASS]',
                'WARN': '[WARN]',
                'FAIL': '[FAIL]'
            }.get(r['status'], '[????]')
            
            lines.append(f"{status_symbol} {r['phase']}: {r['status']}")
            
            if r['errors']:
                for err in r['errors']:
                    lines.append(f"  ❌ {err}")
                failed += 1
            elif r['warnings']:
                for warn in r['warnings']:
                    lines.append(f"  ⚠️  {warn}")
                warnings += 1
            else:
                passed += 1
        
        lines.append('')
        lines.append('=' * 70)
        lines.append(f' SUMMARY: {passed} passed, {warnings} warnings, {failed} failed')
        lines.append('=' * 70)
        
        return '\n'.join(lines)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Validate prompts.json structure for phases'
    )
    parser.add_argument(
        '--phase',
        help='Phase ID to validate (e.g., phase_0, phase_1). If omitted, validates all phases.'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Treat warnings as errors'
    )
    parser.add_argument(
        '--format',
        choices=['text', 'json'],
        default='text',
        help='Output format'
    )
    
    args = parser.parse_args()
    
    # Find data directory
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'
    
    if not data_dir.exists():
        print(f'Error: data directory not found at {data_dir}', file=sys.stderr)
        sys.exit(1)
    
    # Collect phases to validate
    if args.phase:
        phases = [data_dir / args.phase]
        if not phases[0].exists():
            print(f'Error: phase directory not found: {phases[0]}', file=sys.stderr)
            sys.exit(1)
    else:
        # Find all phase directories
        phases = sorted([p for p in data_dir.iterdir() if p.is_dir() and p.name.startswith('phase_')])
    
    # Validate each phase
    validator = PromptsValidator(strict=args.strict)
    results = []
    
    for phase_dir in phases:
        prompts_path = phase_dir / 'prompts.json'
        result = validator.validate_prompts(prompts_path)
        results.append(result)
    
    # Output results
    if args.format == 'json':
        print(json.dumps(results, indent=2))
    else:
        print(validator.format_text(results))
    
    # Exit code
    has_failures = any(r['status'] == 'FAIL' for r in results)
    sys.exit(1 if has_failures else 0)


if __name__ == "__main__":
    main()
