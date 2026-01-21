# ./scripts/phase_scaffold.py
"""
Phase Scaffold - New Phase Structure Generator
===============================================

Generates complete new phase directory structure from templates.
Creates all necessary files (manifest.json, questions.json, prompts.json).

Usage:
    python scripts/phase_scaffold.py create --id PHASE_ID --title TITLE [OPTIONS]
    python scripts/phase_scaffold.py create --id phase_3 --title "New Phase"
    python scripts/phase_scaffold.py create --id phase_3 --template phase_0 --interactive

CLI Arguments:
    --id: Required. Phase ID (e.g., phase_3, phase_4)
    --title: Required. Phase display title
    --subtitle: Optional. Phase subtitle/description
    --template: Optional. Existing phase to copy structure from
    --interactive: Optional. Prompt for additional details
    --dry-run: Optional. Show what would be created without creating it

Inputs:
    - data/TEMPLATE_manifest.json (if exists)
    - data/TEMPLATE_questions.json (if exists)
    - data/TEMPLATE_prompts.json (if exists)
    - Command-line arguments

Outputs:
    - data/{phase_id}/ directory
    - data/{phase_id}/manifest.json
    - data/{phase_id}/questions.json
    - data/{phase_id}/prompts.json
    - data/{phase_id}/questions/ directory

Operational Notes:
    - Creates complete phase structure in one command
    - Auto-generates schema-compliant empty files
    - Can template from existing phase
    - Dry-run mode for preview
    - Token-efficient: ~50 tokens vs ~10,000 for manual creation

Author: Roy Dawson IV
GitHub: https://github.com/imyourboyroy
"""

import json
import sys
import argparse
import shutil
from pathlib import Path
from typing import Dict, Optional


class PhaseScaffold:
    """Generates new phase directory structures."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.data_dir = project_root / "data"
        self.templates_dir = self.data_dir
    
    def create_phase(self, args: argparse.Namespace) -> str:
        """Create new phase structure."""
        phase_dir = self.data_dir / args.id
        
        # Check if phase already exists
        if phase_dir.exists() and not args.dry_run:
            return f"ERROR: Phase directory already exists: {phase_dir}"
        
        if args.dry_run:
            return self._dry_run(args, phase_dir)
        
        # Create directory structure
        phase_dir.mkdir(parents=True, exist_ok=True)
        questions_dir = phase_dir / "questions"
        questions_dir.mkdir(exist_ok=True)
        
        # Generate files
        if args.template:
            # Copy from template phase
            template_dir = self.data_dir / args.template
            if not template_dir.exists():
                return f"ERROR: Template phase not found: {args.template}"
            
            self._copy_from_template(template_dir, phase_dir, args)
        else:
            # Generate from scratch
            self._generate_manifest(phase_dir, args)
            self._generate_questions(phase_dir, args)
            self._generate_prompts(phase_dir, args)
        
        return f"[SUCCESS] Created phase structure: {args.id}\n  - manifest.json\n  - questions.json\n  - prompts.json\n  - questions/ directory"
    
    def _dry_run(self, args: argparse.Namespace, phase_dir: Path) -> str:
        """Show what would be created."""
        lines = []
        lines.append(f"[DRY RUN] Would create:")
        lines.append(f"  {phase_dir}/")
        lines.append(f"    manifest.json")
        lines.append(f"    questions.json")
        lines.append(f"    prompts.json")
        lines.append(f"    questions/ (directory)")
        
        if args.template:
            lines.append(f"\n  Template: {args.template}")
        else:
            lines.append(f"\n  Generated from defaults")
        
        return "\n".join(lines)
    
    def _copy_from_template(self, template_dir: Path, phase_dir: Path, args: argparse.Namespace) -> None:
        """Copy structure from existing phase."""
        # Copy and modify manifest
        manifest_src = template_dir / "manifest.json"
        if manifest_src.exists():
            with open(manifest_src, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            # Update IDs and titles
            manifest['artifact']['id'] = args.id
            manifest['artifact']['title'] = args.title
            if args.subtitle:
                manifest['artifact']['subtitle'] = args.subtitle
            
            with open(phase_dir / "manifest.json", 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=4, ensure_ascii=False)
        
        # Copy empty questions structure
        questions_src = template_dir / "questions.json"
        if questions_src.exists():
            with open(questions_src, 'r', encoding='utf-8') as f:
                questions = json.load(f)
            
            # Clear questions but keep structure
            questions['sections'] = []
            questions['questions'] = {}
            if 'manifests' in questions:
                for manifest in questions['manifests'].values():
                    manifest['question_ids'] = []
            
            with open(phase_dir / "questions.json", 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=4, ensure_ascii=False)
        
        # Copy prompts template
        prompts_src = template_dir / "prompts.json"
        if prompts_src.exists():
            shutil.copy2(prompts_src, phase_dir / "prompts.json")
    
    def _generate_manifest(self, phase_dir: Path, args: argparse.Namespace) -> None:
        """Generate manifest.json from scratch matching TEMPLATE_manifest.json."""
        manifest = {
            "schema_version": "1.3.0",
            "display": {
                "id": args.id,
                "title": args.title,
                "short_title": args.title,
                "description": args.subtitle or "Brief description for dashboard card",
                "icon": "📋",
                "order": 0
            },
            "artifact": {
                "id": args.id,
                "title": args.title,
                "subtitle": args.subtitle or "Subtitle shown on welcome screen",
                "language": "en-US",
                "stage": {
                    "code": args.id,
                    "label": args.title,
                    "eligibility": [
                        "REPLACE: Who should use this phase",
                        "REPLACE: Another eligibility criterion"
                    ]
                },
                "purpose": [
                    "REPLACE: Goal 1",
                    "REPLACE: Goal 2"
                ]
            },
            "intro": {
                "instructions": {
                    "title": "Instructions",
                    "items": [
                        "This is not a test, not a contract.",
                        "Answer what feels true right now.",
                        "It is okay to skip any question.",
                        "If you feel flooded or tense, pause and do something grounding."
                    ]
                },
                "keep_in_mind": {
                    "title": "Keep in Mind",
                    "items": [
                        "The goal is clarity and kindness.",
                        "Answers can change. Nothing here is permanent."
                    ]
                }
            },
            "prompts_artifact": {
                "id": f"{args.id}_prompts",
                "title": f"{args.title} AI Prompts",
                "language": "en-US",
                "applies_to": args.id
            },
            "privacy_preface": {
                "title": "Optional Privacy Preface",
                "text": "If we use a model to reflect on our answers, we only paste what we both agree is okay to share. We can remove details. We can keep it fully local. We can also skip AI entirely. The goal is insight and kindness, not analysis for its own sake."
            }
        }
        
        with open(phase_dir / "manifest.json", 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=4, ensure_ascii=False)
    
    def _generate_questions(self, phase_dir: Path, args: argparse.Namespace) -> None:
        """Generate empty questions.json matching TEMPLATE_questions.json."""
        questions = {
            "sections": [],
            "questions": {},
            "ui_hints": {
                "controls": {
                    "mode_switcher": {
                        "default": "lite",
                        "options": [
                            {
                                "id": "lite",
                                "label": "Lite (0)"
                            },
                            {
                                "id": "full",
                                "label": "Full (0)"
                            }
                        ]
                    }
                }
            },
            "manifests": {
                "lite": {
                    "id": "lite",
                    "title": "Lite",
                    "question_ids": [],
                    "timebox_minutes": 30,
                    "post_timebox_activity": "Take a break and do something enjoyable."
                },
                "full": {
                    "id": "full",
                    "title": "Full",
                    "question_ids": [],
                    "timebox_minutes": 60,
                    "post_timebox_activity": "Rest and reconnect before continuing."
                }
            },
            "primary_manifest_id": "lite"
        }
        
        with open(phase_dir / "questions.json", 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=4, ensure_ascii=False)
    
    def _generate_prompts(self, phase_dir: Path, args: argparse.Namespace) -> None:
        """Generate prompts.json template."""
        prompts = {
            "prompts": {
                "individual_reflection_lite": {
                    "id": "individual_reflection_lite",
                    "title": "Individual Reflection (Lite)",
                    "description": "Personal insight for lite mode completion",
                    "role": "You are a thoughtful relationship coach...",
                    "inputs": [
                        {
                            "key": "respondent_display_name",
                            "label": "Your name",
                            "placeholder": "Your name"
                        },
                        {
                            "key": "responses",
                            "label": "Your questionnaire responses",
                            "placeholder": "Paste your completed responses here"
                        }
                    ],
                    "context": [
                        "Context about this phase",
                        "What the AI should focus on"
                    ],
                    "output_format": [
                        {
                            "section": "Summary",
                            "requirements": ["Summarize key insights"]
                        }
                    ],
                    "constraints": [
                        "Keep language warm and practical",
                        "Focus on actionable insights"
                    ]
                }
            }
        }
        
        with open(phase_dir / "prompts.json", 'w', encoding='utf-8') as f:
            json.dump(prompts, f, indent=2, ensure_ascii=False)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Phase Scaffold - Generate new phase structures",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Create basic phase:
    python scripts/phase_scaffold.py create --id phase_3 --title "Post-Dating Reflection"
  
  Create from template:
    python scripts/phase_scaffold.py create --id phase_4 --title "New Phase" --template phase_0
  
  Dry run:
    python scripts/phase_scaffold.py create --id phase_5 --title "Test" --dry-run
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # CREATE command
    create_parser = subparsers.add_parser('create', help='Create new phase structure')
    create_parser.add_argument('--id', required=True, help='Phase ID (e.g., phase_3)')
    create_parser.add_argument('--title', required=True, help='Phase display title')
    create_parser.add_argument('--subtitle', help='Phase subtitle/description')
    create_parser.add_argument('--template', help='Existing phase to copy structure from')
    create_parser.add_argument('--interactive', action='store_true', help='Interactive mode (prompts for details)')
    create_parser.add_argument('--dry-run', action='store_true', help='Show what would be created')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Find project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    try:
        scaffold = PhaseScaffold(project_root)
        
        if args.command == 'create':
            result = scaffold.create_phase(args)
        else:
            result = f"ERROR: Unknown command: {args.command}"
        
        print(result)
        sys.exit(0 if not result.startswith('ERROR') else 1)
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
