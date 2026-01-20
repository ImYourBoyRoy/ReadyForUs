# ./scripts/bump_version.py
"""
Version Bumper for Ready for Us PWA
===================================

Updates the application version across all necessary files to ensure
proper cache busting and asset reloading.

Usage:
    python scripts/bump_version.py <new_version>

Example:
    python scripts/bump_version.py 2.4.0

Files Updated:
    - js/html-loader.js (CACHE_VERSION)
    - js/data-loader.js (CACHE_VERSION)
    - js/sw.js (CACHE_NAME, STATIC_ASSETS)
    - index.html (CSS/JS links)
"""

import sys
import re
import os

def bump_version(new_version):
    """Updates version strings in all target files."""
    
    # validating version format (simple x.y.z)
    if not re.match(r'^\d+\.\d+\.\d+$', new_version):
        print(f"Error: Invalid version format '{new_version}'. Expected format: x.y.z (e.g., 2.4.0)")
        sys.exit(1)

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Bumping version to v{new_version}...")
    
    files_to_update = [
        {
            'path': 'js/html-loader.js',
            'pattern': r"(CACHE_VERSION:\s*['\"])([\d\.]+)(['\"])",
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'HTML Loader CACHE_VERSION'
        },
        {
            'path': 'js/data-loader.js',
            'pattern': r"(CACHE_VERSION:\s*['\"])([\d\.]+)(['\"])",
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'Data Loader CACHE_VERSION'
        },
        {
            'path': 'js/sw.js',
            'pattern': r"(const CACHE_NAME = 'readyforus-v)([\d\.]+)(['\"];)",
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'Service Worker CACHE_NAME'
        },
        {
            'path': 'js/sw.js',
            'pattern': r"(\?v=)([\d\.]+)(['\"])",  # Matches ?v=x.y.z in asset list
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'Service Worker Assets'
        },
        {
            'path': 'index.html',
            'pattern': r"(\?v=)([\d\.]+)([\"'])", # Matches ?v=x.y.z in link/script tags
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'Index HTML Assets'
        },
        {
            'path': 'js/app/dashboard.js',
            'pattern': r"(const v = DataLoader\.CACHE_VERSION \|\| ')([\d\.]+)(['\"];)",
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'Dashboard JS Fallback Version'
        },
        {
            'path': 'js/app/ai-prompts.js',
            'pattern': r"(const version = DataLoader\.CACHE_VERSION \|\| ')([\d\.]+)(['\"];)",
            'replacement': f"\\g<1>{new_version}\\g<3>",
            'desc': 'AI Prompts JS Fallback Version'
        }
    ]

    for file_info in files_to_update:
        file_path = os.path.join(project_root, file_info['path'])
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file needs update
            if re.search(file_info['pattern'], content):
                new_content = re.sub(file_info['pattern'], file_info['replacement'], content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"[UPDATED] {file_info['desc']} in {file_info['path']}")
                else:
                    print(f"[SKIPPED] No changes needed for {file_info['desc']} in {file_info['path']}")
            else:
                 print(f"[WARNING] Pattern not found for {file_info['desc']} in {file_info['path']}")

        except Exception as e:
            print(f"[ERROR] Failed to update {file_info['path']}: {e}")

    print("\nVersion bump complete! Don't forget to commit your changes.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/bump_version.py <new_version>")
        sys.exit(1)
    
    bump_version(sys.argv[1])
