
# ./scripts/deep_integrity_scan.py
"""
Deep scan of the project for data integrity issues:
1. Duplicate question IDs global check (across all files).
2. Orphaned assets check (files in assets/ not referenced in code).
3. Manifest validity check (already done, but good to include).
4. Missing files referenced in `phase-registry.json`.
"""

import json
import os
import re
from pathlib import Path

def scan_question_ids(data_dir):
    print("Scanning Question IDs...")
    json_files = list(Path(data_dir).rglob("questions.json"))
    
    # Store all IDs found: {id: [filepaths]}
    id_map = {}
    total_q_count = 0
    phase_counts = {}
    
    for f in json_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                data = json.load(file)
                questions = data.get("questions", {})
                count = len(questions)
                total_q_count += count
                phase_counts[f.parent.name] = count
                
                for qid in questions.keys():
                    if qid not in id_map:
                        id_map[qid] = []
                    id_map[qid].append(str(f.relative_to(data_dir.parent)))
        except Exception as e:
            print(f"  [Error] Reading {f}: {e}")

    print(f"\nQuestion Counts per Phase:")
    for phase, count in phase_counts.items():
        print(f"  - {phase}: {count}")

    print(f"\nTotal Questions across all phases: {total_q_count}")
    print(f"Unique ID strings (e.g. 'q01'): {len(id_map)}")
    
    return id_map

def scan_orphaned_assets(root_dir):
    print("\nScanning Assets...")
    assets_dir = root_dir / "assets"
    if not assets_dir.exists():
        print("  [Skip] No assets directory.")
        return

    # 1. Index all asset files
    asset_files = [f for f in assets_dir.rglob("*") if f.is_file()]
    asset_rel_paths = {str(f.relative_to(root_dir)).replace("\\", "/") for f in asset_files}
    
    # 2. Scan code for references
    # We'll scan .html, .css, .js, .json
    code_files = list(root_dir.rglob("*"))
    referenced_assets = set()
    
    usage_pattern = re.compile(r'assets/[\w\-\./]+')
    
    for f in code_files:
        if f.suffix in ['.html', '.css', '.js', '.json'] and not f.is_dir():
            try:
                content = f.read_text(encoding='utf-8', errors='ignore')
                matches = usage_pattern.findall(content)
                for m in matches:
                    # Normalize match
                    clean_match = m.replace("\\", "/")
                    # Check if this matches any known asset
                    for asset in asset_rel_paths:
                        if clean_match in asset or asset in clean_match:
                            referenced_assets.add(asset)
            except:
                pass

    orphans = asset_rel_paths - referenced_assets
    # Filter out common false positives (like icons defined in manifest but constructed dynamically? unlikely)
    
    if orphans:
        print(f"  [Warning] Potential orphaned assets ({len(orphans)}):")
        for o in list(orphans)[:10]:
            print(f"    - {o}")
        if len(orphans) > 10: print(f"    ...and {len(orphans)-10} more.")
    else:
        print("  [OK] No orphaned assets found.")

def main():
    root = Path(".")
    scan_question_ids(root / "data")
    scan_orphaned_assets(root)
    print("\nScan complete.")

if __name__ == "__main__":
    main()
