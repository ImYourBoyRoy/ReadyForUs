# ./scripts/questions_manager.py
"""
Questions Manager - Dynamic Export/Merge Tool for Ready for Us PWA
===================================================================

Unified tool for exporting and merging questions across all phases.
Replaces phase-specific export/merge scripts with dynamic phase detection.

Usage:
    python scripts/questions_manager.py --action export [--phase PHASE] [--verbose]
    python scripts/questions_manager.py --action merge [--phase PHASE] [--verbose]

CLI Arguments:
    --action: Required. Either 'export' or 'merge'
    --phase: Optional. Specific phase (e.g., phase_0, phase_1, phase_1.5). Default: all phases
    --verbose: Optional. Enable detailed logging
    --format: Optional. Export format for text export: 'txt' or 'none'. Default: 'txt'

Inputs:
    Export: data/{phase}/questions.json
    Merge: data/{phase}/questions/*.json (individual question files)

Outputs:
    Export: 
        - data/{phase}/questions/{qid}.json (individual JSON files)
        - data/{phase}/questions.txt (human-readable text export)
    Merge:
        - data/{phase}/questions.json (updated master file)
        - data/{phase}/questions.json.bak (automatic backup)

Operational Notes:
    - Auto-discovers all data/phase_* directories
    - Creates backups before merge operations
    - Validates JSON structure before writing
    - Idempotent: safe to run multiple times
    
Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import os
import sys
import argparse
import glob
import shutil
from pathlib import Path
from typing import List, Dict, Optional


class QuestionsManager:
    """Manages export and merge operations for questionnaire phases."""
    
    def __init__(self, base_dir: str, verbose: bool = False):
        self.base_dir = Path(base_dir)
        self.data_dir = self.base_dir / "data"
        self.verbose = verbose
    
    def log(self, message: str, level: str = "INFO") -> None:
        """Log message if verbose mode enabled."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            prefix = f"[{level}]" if level else ""
            print(f"{prefix} {message}")
    
    def discover_phases(self) -> List[str]:
        """Auto-discover all phase directories."""
        if not self.data_dir.exists():
            self.log(f"Data directory not found: {self.data_dir}", "ERROR")
            return []
        
        phases = []
        for item in self.data_dir.iterdir():
            if item.is_dir() and item.name.startswith("phase"):
                phases.append(item.name)
        
        phases.sort()
        self.log(f"Discovered phases: {', '.join(phases)}")
        return phases
    
    def export_phase(self, phase_name: str, export_txt: bool = True) -> bool:
        """Export questions from phase to individual JSON files and optional text file."""
        phase_dir = self.data_dir / phase_name
        questions_json = phase_dir / "questions.json"
        output_dir = phase_dir / "questions"
        
        if not questions_json.exists():
            self.log(f"Skipping {phase_name}: questions.json not found", "WARNING")
            return False
        
        self.log(f"Exporting {phase_name}...")
        
        try:
            with open(questions_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            self.log(f"Error reading {questions_json}: {e}", "ERROR")
            return False
        
        # Create output directory
        output_dir.mkdir(exist_ok=True)
        self.log(f"Created directory: {output_dir}")
        
        # Export individual JSON files
        questions = data.get('questions', {})
        self.log(f"Found {len(questions)} questions to export")
        
        for q_id, q_data in questions.items():
            file_path = output_dir / f"{q_id}.json"
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(q_data, f, indent=2, ensure_ascii=False)
                self.log(f"  Exported: {q_id}.json")
            except Exception as e:
                self.log(f"Error writing {file_path}: {e}", "ERROR")
        
        # Export text file for human review
        if export_txt:
            self._export_text_file(phase_name, phase_dir, data)
        
        print(f"[SUCCESS] Exported {len(questions)} questions from {phase_name}")
        return True
    
    def _export_text_file(self, phase_name: str, phase_dir: Path, data: Dict) -> None:
        """Export questions to human-readable text file."""
        txt_path = phase_dir / "questions.txt"
        sections = data.get("sections", [])
        questions_map = data.get("questions", {})
        
        # Collect all question IDs in order
        ordered_ids = []
        for section in sections:
            ordered_ids.extend(section.get("question_ids", []))
        
        # Remove duplicates while preserving order
        seen = set()
        unique_ordered_ids = []
        for qid in ordered_ids:
            if qid not in seen:
                unique_ordered_ids.append(qid)
                seen.add(qid)
        
        # Add orphan questions not in sections
        for qid in questions_map:
            if qid not in seen:
                unique_ordered_ids.append(qid)
        
        # Generate text output
        output_lines = [
            f"Questions Export for {phase_name}",
            "=" * 40,
            ""
        ]
        
        for qid in unique_ordered_ids:
            q_data = questions_map.get(qid)
            if q_data:
                output_lines.append("")
                output_lines.append(f"[{qid}] {q_data.get('title', 'Untitled')}")
                output_lines.append(f"{q_data.get('prompt', '')}")
                
                # For compound questions, list sub-field labels
                if q_data.get('type') == 'compound' and 'fields' in q_data:
                    for field in q_data['fields']:
                        output_lines.append(f"  - {field.get('label', '')}")
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(output_lines))
        
        self.log(f"  Created text export: questions.txt")
    
    def merge_phase(self, phase_name: str) -> bool:
        """Merge individual question JSON files back into master questions.json."""
        phase_dir = self.data_dir / phase_name
        main_file = phase_dir / "questions.json"
        questions_dir = phase_dir / "questions"
        
        if not main_file.exists():
            self.log(f"Skipping {phase_name}: questions.json not found", "WARNING")
            return False
        
        if not questions_dir.exists():
            self.log(f"Skipping {phase_name}: questions/ directory not found", "WARNING")
            return False
        
        self.log(f"Merging {phase_name}...")
        
        # Read main file
        try:
            with open(main_file, 'r', encoding='utf-8') as f:
                main_data = json.load(f)
        except Exception as e:
            self.log(f"Error reading {main_file}: {e}", "ERROR")
            return False
        
        if 'questions' not in main_data:
            self.log(f"Error: 'questions' key not found in {main_file}", "ERROR")
            return False
        
        # Find all individual question files
        files = list(questions_dir.glob("q*.json"))
        self.log(f"Found {len(files)} individual question files to merge")
        
        updates_count = 0
        for file_path in files:
            qid = file_path.stem  # filename without extension
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    individual_data = json.load(f)
                
                # Update the question in main data
                main_data['questions'][qid] = individual_data
                updates_count += 1
                self.log(f"  Merged: {qid}")
                
            except Exception as e:
                self.log(f"Error processing {file_path.name}: {e}", "ERROR")
        
        # Create backup
        backup_path = str(main_file) + ".bak"
        shutil.copy2(main_file, backup_path)
        self.log(f"Backup created: {Path(backup_path).name}")
        
        # Write updated data back to main file
        try:
            with open(main_file, 'w', encoding='utf-8') as f:
                json.dump(main_data, f, indent=2, ensure_ascii=False)
            print(f"[SUCCESS] Merged {updates_count} questions into {phase_name}/questions.json")
            return True
        except Exception as e:
            self.log(f"Error writing to {main_file}: {e}", "ERROR")
            return False


def main():
    """Main entry point for Questions Manager CLI."""
    parser = argparse.ArgumentParser(
        description="Questions Manager - Export/Merge tool for Ready for Us PWA",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Export all phases:
    python scripts/questions_manager.py --action export
  
  Export specific phase:
    python scripts/questions_manager.py --action export --phase phase_1
  
  Merge all phases:
    python scripts/questions_manager.py --action merge --verbose
  
  Merge specific phase:
    python scripts/questions_manager.py --action merge --phase phase_0
        """
    )
    
    parser.add_argument(
        '--action',
        required=True,
        choices=['export', 'merge'],
        help='Action to perform: export (JSON to files) or merge (files to JSON)'
    )
    
    parser.add_argument(
        '--phase',
        type=str,
        default=None,
        help='Specific phase to process (e.g., phase_0, phase_1, phase_1.5). Default: all phases'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    parser.add_argument(
        '--format',
        type=str,
        choices=['txt', 'none'],
        default='txt',
        help='Export text format (export only). Default: txt'
    )
    
    args = parser.parse_args()
    
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Initialize manager
    manager = QuestionsManager(project_root, verbose=args.verbose)
    
    # Get phases to process
    if args.phase:
        phases = [args.phase]
        if not (manager.data_dir / args.phase).exists():
            print(f"[ERROR] Phase directory not found: {args.phase}")
            sys.exit(1)
    else:
        phases = manager.discover_phases()
        if not phases:
            print("[ERROR] No phases found in data/ directory")
            sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"Questions Manager - {args.action.upper()} Operation")
    print(f"{'='*60}")
    print(f"Phases: {', '.join(phases)}\n")
    
    # Execute action
    success_count = 0
    fail_count = 0
    
    for phase in phases:
        if args.action == 'export':
            result = manager.export_phase(phase, export_txt=(args.format == 'txt'))
        else:  # merge
            result = manager.merge_phase(phase)
        
        if result:
            success_count += 1
        else:
            fail_count += 1
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Operation complete: {success_count} succeeded, {fail_count} failed")
    print(f"{'='*60}\n")
    
    sys.exit(0 if fail_count == 0 else 1)


if __name__ == "__main__":
    main()
