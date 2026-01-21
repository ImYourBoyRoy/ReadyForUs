# ./scripts/validate_manifest.py
"""
Manifest Validator - Validate manifest.json Structure
======================================================

Validates manifest.json files to ensure they match the expected structure
for the Ready for Us PWA. Prevents breaking the web app with incorrect structure.

Usage:
    python scripts/validate_manifest.py [--phase PHASE]
    python scripts/validate_manifest.py --phase phase_0
    python scripts/validate_manifest.py  # validates all phases

CLI Arguments:
    --phase: Optional. Specific phase to validate. Default: all phases
    --strict: Optional. Fail on warnings (not just errors)
    --format: Optional. Output format (text, json). Default: text

Inputs:
    - data/{phase}/manifest.json

Outputs:
    - Validation report with errors/warnings
    - Exit code: 0 (pass), 1 (fail)

Operational Notes:
    - Checks all required fields exist
    - Validates field types and structures
    - Ensures consistency with production manifests
    - Token-efficient: ~10 tokens to run

Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List


class ManifestValidator:
    """Validates manifest.json files against expected structure."""
    
    REQUIRED_FIELDS = {
        'schema_version': str,
        'display': dict,
        'artifact': dict,
        'intro': dict,
        'prompts_artifact': dict,
        'privacy_preface': dict
    }
    
    REQUIRED_DISPLAY_FIELDS = {
        'id': str,
        'title': str,
        'short_title': str,
        'description': str,
        'icon': str,
        'menu_icon': str,
        'order': int
    }
    
    REQUIRED_ARTIFACT_FIELDS = {
        'id': str,
        'title': str,
        'subtitle': str,
        'language': str,
        'stage': dict,
        'purpose': list
    }
    
    def __init__(self, strict: bool = False):
        self.strict = strict
    
    def validate_manifest(self, manifest_path: Path) -> Dict:
        """Validate a single manifest.json file."""
        phase_name = manifest_path.parent.name
        
        if not manifest_path.exists():
            return {
                'phase': phase_name,
                'status': 'ERROR',
                'errors': ['manifest.json not found'],
                'warnings': []
            }
        
        # Load manifest
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return {
                'phase': phase_name,
                'status': 'ERROR',
                'errors': [f'JSON syntax error: {e}'],
                'warnings': []
            }
        
        errors = []
        warnings = []
        
        # Check top-level fields
        for field, expected_type in self.REQUIRED_FIELDS.items():
            if field not in data:
                errors.append(f"Missing required field: {field}")
            elif not isinstance(data[field], expected_type):
                errors.append(f"Field '{field}' should be {expected_type.__name__}, got {type(data[field]).__name__}")
        
        # Check display fields
        if 'display' in data:
            for field, expected_type in self.REQUIRED_DISPLAY_FIELDS.items():
                if field not in data['display']:
                    errors.append(f"Missing display.{field}")
                elif not isinstance(data['display'][field], expected_type):
                    errors.append(f"display.{field} should be {expected_type.__name__}")
        
        # Check artifact fields
        if 'artifact' in data:
            for field, expected_type in self.REQUIRED_ARTIFACT_FIELDS.items():
                if field not in data['artifact']:
                    errors.append(f"Missing artifact.{field}")
                elif not isinstance(data['artifact'][field], expected_type):
                    errors.append(f"artifact.{field} should be {expected_type.__name__}")
            
            # Check stage structure
            if 'stage' in data['artifact']:
                stage = data['artifact']['stage']
                if 'code' not in stage:
                    errors.append("Missing artifact.stage.code")
                if 'label' not in stage:
                    errors.append("Missing artifact.stage.label")
                if 'eligibility' not in stage:
                    errors.append("Missing artifact.stage.eligibility")
                elif not isinstance(stage['eligibility'], list):
                    errors.append("artifact.stage.eligibility should be a list")
        
        # Check intro structure
        if 'intro' in data:
            intro = data['intro']
            if 'instructions' not in intro:
                errors.append("Missing intro.instructions")
            elif not isinstance(intro['instructions'], dict):
                errors.append("intro.instructions should be object")
            else:
                if 'title' not in intro['instructions']:
                    warnings.append("Missing intro.instructions.title")
                if 'items' not in intro['instructions']:
                    errors.append("Missing intro.instructions.items")
                elif not isinstance(intro['instructions']['items'], list):
                    errors.append("intro.instructions.items should be array")
            
            if 'keep_in_mind' not in intro:
                errors.append("Missing intro.keep_in_mind")
            elif not isinstance(intro['keep_in_mind'], dict):
                errors.append("intro.keep_in_mind should be object")
            else:
                if 'title' not in intro['keep_in_mind']:
                    warnings.append("Missing intro.keep_in_mind.title")
                if 'items' not in intro['keep_in_mind']:
                    errors.append("Missing intro.keep_in_mind.items")
                elif not isinstance(intro['keep_in_mind']['items'], list):
                    errors.append("intro.keep_in_mind.items should be array")
        
        # Check prompts_artifact
        if 'prompts_artifact' in data:
            pa = data['prompts_artifact']
            for field in ['id', 'title', 'language', 'applies_to']:
                if field not in pa:
                    errors.append(f"Missing prompts_artifact.{field}")
        
        # Check privacy_preface
        if 'privacy_preface' in data:
            pp = data['privacy_preface']
            if 'title' not in pp:
                warnings.append("Missing privacy_preface.title")
            if 'text' not in pp:
                errors.append("Missing privacy_preface.text")
        
        # Determine status
        if errors:
            status = 'FAIL'
        elif warnings and self.strict:
            status = 'FAIL'
        elif warnings:
            status = 'WARN'
        else:
            status = 'PASS'
        
        return {
            'phase': phase_name,
            'status': status,
            'errors': errors,
            'warnings': warnings
        }
    
    def format_text(self, results: List[Dict]) -> str:
        """Format validation results as text."""
        lines = []
        lines.append("=" * 70)
        lines.append(" MANIFEST VALIDATION REPORT")
        lines.append("=" * 70)
        lines.append("")
        
        for result in results:
            status_symbol = {
                'PASS': '[PASS]',
                'WARN': '[WARN]',
                'FAIL': '[FAIL]',
                'ERROR': '[ERROR]'
            }.get(result['status'], '[?]')
            
            lines.append(f"{status_symbol} {result['phase']}: {result['status']}")
            
            if result.get('errors'):
                lines.append(f"  ERRORS ({len(result['errors'])}):")
                for error in result['errors']:
                    lines.append(f"    - {error}")
            
            if result.get('warnings'):
                lines.append(f"  WARNINGS ({len(result['warnings'])}):")
                for warning in result['warnings']:
                    lines.append(f"    - {warning}")
            
            lines.append("")
        
        total_pass = sum(1 for r in results if r['status'] == 'PASS')
        total_warn = sum(1 for r in results if r['status'] == 'WARN')
        total_fail = sum(1 for r in results if r['status'] == 'FAIL')
        
        lines.append("=" * 70)
        lines.append(f" SUMMARY: {total_pass} passed, {total_warn} warnings, {total_fail} failed")
        lines.append("=" * 70)
        
        return "\n".join(lines)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Manifest Validator - Validate manifest.json structure"
    )
    
    parser.add_argument('--phase', help='Specific phase to validate (default: all)')
    parser.add_argument('--strict', action='store_true', help='Fail on warnings')
    parser.add_argument('--format', choices=['text', 'json'], default='text')
    
    args = parser.parse_args()
    
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
    validator = ManifestValidator(strict=args.strict)
    results = []
    
    for phase_dir in phases:
        manifest_path = phase_dir / "manifest.json"
        result = validator.validate_manifest(manifest_path)
        results.append(result)
    
    # Format output
    if args.format == 'json':
        print(json.dumps(results, indent=2))
    else:
        print(validator.format_text(results))
    
    # Exit code
    has_failures = any(r['status'] in ['FAIL', 'ERROR'] for r in results)
    sys.exit(1 if has_failures else 0)


if __name__ == "__main__":
    main()
