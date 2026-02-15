"""
Quality Gate Runner
===================

Runs the most important validation, audit, and export checks in one command.
Designed as a pre-push safety net for large questionnaire datasets.

Usage:
    python scripts/quality_gate.py
    python scripts/quality_gate.py --clean-exports
    python scripts/quality_gate.py --skip-deep-scan --skip-lite-audit
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path


def run_step(name: str, command: list[str], cwd: Path) -> tuple[bool, float]:
    print(f"\n[RUN] {name}")
    print("      " + " ".join(command))
    start = time.perf_counter()
    completed = subprocess.run(command, cwd=str(cwd))
    elapsed = time.perf_counter() - start
    ok = completed.returncode == 0
    print(f"[{'PASS' if ok else 'FAIL'}] {name} ({elapsed:.2f}s)")
    return ok, elapsed


def main() -> int:
    parser = argparse.ArgumentParser(description="Run consolidated pre-push quality checks.")
    parser.add_argument(
        "--clean-exports",
        action="store_true",
        help="Clear exports/ before regeneration."
    )
    parser.add_argument(
        "--skip-export",
        action="store_true",
        help="Skip question export regeneration."
    )
    parser.add_argument(
        "--skip-lite-audit",
        action="store_true",
        help="Skip lite/full manifest distribution audit."
    )
    parser.add_argument(
        "--skip-deep-scan",
        action="store_true",
        help="Skip deep integrity scan (slower, may include non-blocking warnings)."
    )
    parser.add_argument(
        "--skip-prompt-format-test",
        action="store_true",
        help="Skip node-based prompt formatting smoke test."
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    if not data_dir.exists():
        print(f"[FAIL] Missing data directory: {data_dir}")
        return 1

    phases = sorted([p.name for p in data_dir.iterdir() if p.is_dir() and p.name.startswith("phase_")])
    if not phases:
        print("[FAIL] No phase directories found under data/")
        return 1

    if args.clean_exports:
        exports_dir = repo_root / "exports"
        if exports_dir.exists():
            shutil.rmtree(exports_dir)
        exports_dir.mkdir(parents=True, exist_ok=True)
        print(f"[INFO] Reset exports directory: {exports_dir}")

    py = sys.executable
    steps: list[tuple[str, list[str]]] = []

    if not args.skip_export:
        export_cmd = [py, "scripts/export_questions.py"]
        if args.clean_exports:
            export_cmd.append("--clean")
        steps.append(("Export Questions", export_cmd))

    steps.extend([
        ("Validate Schema (strict)", [py, "scripts/validate_schema.py", "--strict"]),
        ("Validate Manifest", [py, "scripts/validate_manifest.py"]),
        ("Validate Prompts", [py, "scripts/validate_prompts.py"]),
        ("Validate Manifest IDs", [py, "scripts/validate_manifest_ids.py"]),
        ("Audit Questions Schema", [py, "scripts/audit_questions_schema.py"]),
        ("Audit Other Fields", [py, "scripts/audit_questions_other_fields.py"]),
    ])

    for phase in phases:
        steps.append((f"Review Compliance: {phase}", [py, "scripts/review_compliance.py", "--phase", phase]))

    if not args.skip_lite_audit:
        steps.append(("Lite Audit", [py, "scripts/lite_audit.py"]))

    if not args.skip_deep_scan:
        steps.append(("Deep Integrity Scan", [py, "scripts/deep_integrity_scan.py"]))

    if not args.skip_prompt_format_test:
        if shutil.which("node"):
            steps.append(("Prompt Formatting Test", ["node", "scripts/test_prompt_formatting.js"]))
        else:
            print("[WARN] Node not found: skipping prompt formatting test.")

    results: list[tuple[str, bool, float]] = []
    for name, command in steps:
        ok, elapsed = run_step(name, command, repo_root)
        results.append((name, ok, elapsed))

    passed = sum(1 for _, ok, _ in results if ok)
    failed = len(results) - passed
    total_seconds = sum(elapsed for _, _, elapsed in results)

    print("\n" + "=" * 72)
    print("QUALITY GATE SUMMARY")
    print("=" * 72)
    for name, ok, elapsed in results:
        print(f"{'PASS' if ok else 'FAIL':<5} {name} ({elapsed:.2f}s)")
    print("-" * 72)
    print(f"TOTAL: {passed} passed, {failed} failed, {total_seconds:.2f}s")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

