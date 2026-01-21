# ./scripts/question_properties.py
"""
Question Properties Manager - Bulk Property Updates
===================================================

Manages structural properties of questions (max, min, validation rules) with bulk operations.
Designed for maintenance tasks like adding max limits to all multi-select questions.

Usage:
    python scripts/question_properties.py set-max --phase PHASE --questions q06,q18,q22 --value 7
    python scripts/question_properties.py set-max --phase PHASE --type multi_select --value 5
    python scripts/question_properties.py remove-max --phase PHASE --question q06
    python scripts/question_properties.py list-props --phase PHASE --type multi_select

Commands:
    set-max: Set max limit on select-type questions
    remove-max: Remove max limit
    set-min: Set min limit on number/multi-select questions
    list-props: List current properties for questions matching criteria

CLI Arguments:
    --phase: Required. Phase directory (e.g., phase_0)
    --questions: Comma-separated question IDs (e.g., q01,q02,q03)
    --type: Filter by question type (e.g., multi_select)
    --value: Property value to set
    --question: Single question ID

Inputs:
    - data/{phase}/questions.json

Outputs:
    - data/{phase}/questions.json (updated)
    - data/{phase}/questions.json.bak (automatic backup)
    - Summary report of changes

Operational Notes:
    - Creates automatic backup before modifications
    - Validates all changes before committing  
    - Supports bulk operations across multiple questions
    - Token-efficient: ~20 tokens for bulk update vs ~500 for manual editing

Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import sys
import argparse
import shutil
from pathlib import Path
from typing import Dict, List, Set


class QuestionPropertiesManager:
    """Manages structural properties of questions."""
    
    def __init__(self, phase: str, project_root: Path):
        self.phase = phase
        self.phase_dir = project_root / "data" / phase
        self.questions_file = self.phase_dir / "questions.json"
        
        if not self.questions_file.exists():
            raise FileNotFoundError(f"questions.json not found in {self.phase_dir}")
    
    def _load_questions(self) -> Dict:
        """Load questions.json file."""
        with open(self.questions_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _save_questions(self, data: Dict, backup: bool = True) -> None:
        """Save questions.json with optional backup."""
        if backup:
            backup_path = self.questions_file.with_suffix('.json.bak')
            shutil.copy2(self.questions_file, backup_path)
        
        with open(self.questions_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def set_max(self, question_ids: List[str], max_value: int) -> str:
        """Set max limit on questions."""
        data = self._load_questions()
        updated = []
        errors = []
        
        for qid in question_ids:
            if qid not in data['questions']:
                errors.append(f"{qid}: not found")
                continue
            
            q = data['questions'][qid]
            qtype = q.get('type')
            
            if qtype not in ['multi_select', 'ranked_select']:
                errors.append(f"{qid}: type '{qtype}' doesn't support max (must be multi_select or ranked_select)")
                continue
            
            q['max'] = max_value
            updated.append(qid)
        
        if updated:
            self._save_questions(data, backup=True)
        
        result = []
        result.append(f"[SUCCESS] Set max={max_value} on {len(updated)} question(s)")
        if updated:
            result.append(f"  Updated: {', '.join(updated)}")
        if errors:
            result.append(f"  Errors: {len(errors)}")
            for err in errors:
                result.append(f"    - {err}")
        
        return '\n'.join(result)
    
    def remove_max(self, question_ids: List[str]) -> str:
        """Remove max limit from questions."""
        data = self._load_questions()
        updated = []
        
        for qid in question_ids:
            if qid in data['questions'] and 'max' in data['questions'][qid]:
                del data['questions'][qid]['max']
                updated.append(qid)
        
        if updated:
            self._save_questions(data, backup=True)
        
        return f"[SUCCESS] Removed max from {len(updated)} question(s): {', '.join(updated)}"
    
    def set_min(self, question_ids: List[str], min_value: int) -> str:
        """Set min limit on questions."""
        data = self._load_questions()
        updated = []
        errors = []
        
        for qid in question_ids:
            if qid not in data['questions']:
                errors.append(f"{qid}: not found")
                continue
            
            q = data['questions'][qid]
            qtype = q.get('type')
            
            if qtype not in ['multi_select', 'ranked_select']:
                errors.append(f"{qid}: type '{qtype}' doesn't support min")
                continue
            
            q['min'] = min_value
            updated.append(qid)
        
        if updated:
            self._save_questions(data, backup=True)
        
        result = []
        result.append(f"[SUCCESS] Set min={min_value} on {len(updated)} question(s)")
        if updated:
            result.append(f"  Updated: {', '.join(updated)}")
        if errors:
            result.append(f"  Errors: {len(errors)}")
            for err in errors:
                result.append(f"    - {err}")
        
        return '\n'.join(result)
    
    def list_properties(self, question_type: str = None) -> str:
        """List properties for questions matching criteria."""
        data = self._load_questions()
        results = []
        
        for qid, q in sorted(data['questions'].items()):
            if question_type and q.get('type') != question_type:
                continue
            
            props = []
            if 'max' in q:
                props.append(f"max={q['max']}")
            if 'min' in q:
                props.append(f"min={q['min']}")
            
            qtype = q.get('type', 'unknown')
            title = q.get('title', 'Untitled')
            
            if question_type or props:  # Only show if filtering or has props
                prop_str = ', '.join(props) if props else 'no limits'
                results.append(f"{qid} [{qtype}]: {title} ({prop_str})")
        
        if not results:
            return f"No questions found" + (f" of type '{question_type}'" if question_type else "")
        
        return '\n'.join(results)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Question Properties Manager - Bulk property updates',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # set-max command
    set_max_parser = subparsers.add_parser('set-max', help='Set max limit on questions')
    set_max_parser.add_argument('--phase', required=True, help='Phase ID (e.g., phase_0)')
    set_max_parser.add_argument('--questions', help='Comma-separated question IDs (e.g., q01,q02)')
    set_max_parser.add_argument('--type', help='Apply to all questions of this type (e.g., multi_select)')
    set_max_parser.add_argument('--value', required=True, type=int, help='Max value')
    
    # remove-max command
    remove_max_parser = subparsers.add_parser('remove-max', help='Remove max limit')
    remove_max_parser.add_argument('--phase', required=True, help='Phase ID')
    remove_max_parser.add_argument('--questions', required=True, help='Comma-separated question IDs')
    
    # set-min command
    set_min_parser = subparsers.add_parser('set-min', help='Set min limit on questions')
    set_min_parser.add_argument('--phase', required=True, help='Phase ID')
    set_min_parser.add_argument('--questions', help='Comma-separated question IDs')
    set_min_parser.add_argument('--type', help='Apply to all questions of this type')
    set_min_parser.add_argument('--value', required=True, type=int, help='Min value')
    
    # list-props command
    list_props_parser = subparsers.add_parser('list-props', help='List question properties')
    list_props_parser.add_argument('--phase', required=True, help='Phase ID')
    list_props_parser.add_argument('--type', help='Filter by question type')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Find project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    try:
        manager = QuestionPropertiesManager(args.phase, project_root)
        
        if args.command == 'set-max':
            if args.questions:
                qids = [q.strip() for q in args.questions.split(',')]
            elif args.type:
                # Get all questions of this type
                data = manager._load_questions()
                qids = [qid for qid, q in data['questions'].items() if q.get('type') == args.type]
                if not qids:
                    print(f"No questions found of type '{args.type}'")
                    sys.exit(1)
            else:
                print("ERROR: Must specify either --questions or --type")
                sys.exit(1)
            
            result = manager.set_max(qids, args.value)
            print(result)
        
        elif args.command == 'remove-max':
            qids = [q.strip() for q in args.questions.split(',')]
            result = manager.remove_max(qids)
            print(result)
        
        elif args.command == 'set-min':
            if args.questions:
                qids = [q.strip() for q in args.questions.split(',')]
            elif args.type:
                data = manager._load_questions()
                qids = [qid for qid, q in data['questions'].items() if q.get('type') == args.type]
                if not qids:
                    print(f"No questions found of type '{args.type}'")
                    sys.exit(1)
            else:
                print("ERROR: Must specify either --questions or --type")
                sys.exit(1)
            
            result = manager.set_min(qids, args.value)
            print(result)
        
        elif args.command == 'list-props':
            result = manager.list_properties(args.type)
            print(result)
    
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
