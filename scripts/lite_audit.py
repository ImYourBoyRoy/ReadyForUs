# ./scripts/lite_audit.py
"""
Lite / Full Manifest Audit Tool
================================

Generates a concise report of every phase's Lite vs Full question distribution.
Shows per-section coverage, total ratios, and flags phases that exceed the 50% Lite threshold.

Usage:
    python scripts/lite_audit.py

Key Inputs:
    - data/phase_*/questions.json

Key Outputs:
    - Console report with per-phase breakdown
    - exports/lite_audit_report.txt (saved copy)

Operational Notes:
    - Read-only. Does not modify any data files.
    - Uses the `manifests` and `tags.included_in_manifests` fields.
"""

import json
import glob
import os

BOLD = "\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def audit_phase(path):
    """Audit a single phase and return structured results."""
    data = load_json(path)
    phase_dir = os.path.basename(os.path.dirname(path))
    
    questions = data.get("questions", {})
    sections = data.get("sections", [])
    manifests = data.get("manifests", {})
    
    lite_manifest_ids = set(manifests.get("lite", {}).get("question_ids", []))
    full_manifest_ids = set(manifests.get("full", {}).get("question_ids", []))
    
    total = len(questions)
    lite_count = len(lite_manifest_ids)
    full_only_count = total - lite_count
    ratio = (lite_count / total * 100) if total > 0 else 0
    over_limit = ratio > 50
    
    # Per-section breakdown
    section_data = []
    for s in sections:
        sid = s.get("id")
        stitle = s.get("title")
        sec_q_ids = s.get("question_ids", [])
        sec_total = len(sec_q_ids)
        sec_lite = len([qid for qid in sec_q_ids if qid in lite_manifest_ids])
        sec_full_only = sec_total - sec_lite
        
        q_details = []
        for qid in sec_q_ids:
            q = questions.get(qid, {})
            is_lite = qid in lite_manifest_ids
            tag_manifests = q.get("tags", {}).get("included_in_manifests", [])
            tag_lite = "lite" in tag_manifests
            # Check for tag/manifest mismatch
            mismatch = (is_lite != tag_lite)
            q_details.append({
                "id": qid,
                "title": q.get("title", "???"),
                "type": q.get("type", "???"),
                "is_lite": is_lite,
                "tag_lite": tag_lite,
                "mismatch": mismatch,
            })
        
        section_data.append({
            "id": sid,
            "title": stitle,
            "total": sec_total,
            "lite": sec_lite,
            "full_only": sec_full_only,
            "questions": q_details,
        })
    
    return {
        "phase": phase_dir,
        "total": total,
        "lite_count": lite_count,
        "full_only_count": full_only_count,
        "ratio_pct": ratio,
        "over_limit": over_limit,
        "sections": section_data,
        "lite_manifest_ids": sorted(lite_manifest_ids),
        "full_manifest_ids": sorted(full_manifest_ids),
    }

def format_report(results):
    lines = []
    lines.append("=" * 80)
    lines.append("LITE / FULL MANIFEST AUDIT REPORT")
    lines.append("=" * 80)
    lines.append("")
    
    # Summary table
    lines.append(f"{'PHASE':<16} {'TOTAL':>6} {'LITE':>6} {'FULL-ONLY':>10} {'RATIO':>8} {'STATUS':>10}")
    lines.append("-" * 60)
    for r in results:
        status = f"{RED}OVER{RESET}" if r['over_limit'] else f"{GREEN}OK{RESET}"
        status_plain = "OVER 50%" if r['over_limit'] else "OK"
        lines.append(
            f"{r['phase']:<16} {r['total']:>6} {r['lite_count']:>6} "
            f"{r['full_only_count']:>10} {r['ratio_pct']:>7.1f}% {status_plain:>10}"
        )
    lines.append("")
    
    # Per-phase detail
    for r in results:
        lines.append("=" * 80)
        lines.append(f"PHASE: {r['phase'].upper()}")
        lines.append(f"  Total: {r['total']}  |  Lite: {r['lite_count']}  |  Full-Only: {r['full_only_count']}  |  Ratio: {r['ratio_pct']:.1f}%")
        if r['over_limit']:
            target = r['total'] // 2
            excess = r['lite_count'] - target
            lines.append(f"  ⚠️  OVER 50% — need to remove {excess} question(s) from Lite")
        lines.append("-" * 80)
        
        mismatches = []
        for sec in r['sections']:
            lines.append(f"  [{sec['id']}] {sec['title']}  ({sec['lite']}/{sec['total']} lite)")
            for q in sec['questions']:
                marker = "LITE" if q['is_lite'] else "FULL"
                warn = " ⚠️ TAG MISMATCH" if q['mismatch'] else ""
                lines.append(f"      {q['id']:>4}: [{marker:<4}] [{q['type']:<14}] {q['title']}{warn}")
                if q['mismatch']:
                    mismatches.append(q['id'])
        
        if mismatches:
            lines.append(f"\n  TAG MISMATCHES: {', '.join(mismatches)}")
            lines.append(f"  (Manifest says one thing, question tags say another)")
        lines.append("")
    
    return "\n".join(lines)

def main():
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    data_dir = os.path.join(base_dir, "data")
    export_dir = os.path.join(base_dir, "exports")
    
    os.makedirs(export_dir, exist_ok=True)
    
    pattern = os.path.join(data_dir, "phase_*", "questions.json")
    files = sorted(glob.glob(pattern))
    
    if not files:
        print(f"{RED}No questions.json files found.{RESET}")
        return
    
    results = []
    for f in files:
        results.append(audit_phase(f))
    
    report = format_report(results)
    print(report)
    
    # Save plain-text version
    out_path = os.path.join(export_dir, "lite_audit_report.txt")
    with open(out_path, 'w', encoding='utf-8') as fout:
        fout.write(report)
    print(f"\n{GREEN}Report saved to {out_path}{RESET}")

if __name__ == "__main__":
    main()
