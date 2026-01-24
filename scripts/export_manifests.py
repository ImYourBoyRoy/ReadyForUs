# ./scripts/export_manifests.py
"""
Export Manifests
================

Exports all `manifest.json` files from `data/phase_*` directories to `exports/manifests/`.

Usage:
    python scripts/export_manifests.py

Key Inputs:
    - data/phase_*/manifest.json

Key Outputs:
    - exports/manifests/phase_[id]_manifest.json
"""

import json
import glob
import os
import shutil

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def main():
    print(f"{BOLD}Starting Manifest Export...{RESET}\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    data_dir = os.path.join(base_dir, "data")
    export_dir = os.path.join(base_dir, "exports", "manifests")
    
    os.makedirs(export_dir, exist_ok=True)
    
    # Dynamic pattern to catch all phases
    pattern = os.path.join(data_dir, "phase_*", "manifest.json")
    files = glob.glob(pattern)
    files.sort()
    
    if not files:
        print(f"{RED}No manifest.json files found.{RESET}")
        return

    count = 0
    for file_path in files:
        phase_dir_name = os.path.basename(os.path.dirname(file_path))
        target_name = f"{phase_dir_name}_manifest.json"
        target_path = os.path.join(export_dir, target_name)
        
        try:
            # We copy valid JSON to ensure it is formatted nicely? 
            # Or just copy the file. Let's load and dump to ensure pretty print.
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            with open(target_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
                
            print(f"Exported {BOLD}{phase_dir_name}{RESET} -> {target_name}")
            count += 1
        except Exception as e:
            print(f"{RED}Failed to export {target_name}: {e}{RESET}")
                
    print(f"\n{GREEN}Success! Exported {count} manifest files to {export_dir}{RESET}")

if __name__ == "__main__":
    main()
