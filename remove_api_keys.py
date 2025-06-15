#!/usr/bin/env python3
"""Remove API key dependencies from all route files"""

import re
import os

def remove_api_key_deps(file_path):
    """Remove API key dependencies from a Python file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Remove ", api_key: str = Depends(verify_api_key)" and similar
    content = re.sub(r',\s*api_key:\s*str\s*=\s*Depends\(verify_api_key[_optional]*\)', '', content)
    
    # Pattern 2: Remove "api_key: str = Depends(verify_api_key)" when it's the only parameter
    content = re.sub(r'\(\s*api_key:\s*str\s*=\s*Depends\(verify_api_key[_optional]*\)\s*\)', '()', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {file_path}")
    else:
        print(f"ℹ️  No changes: {file_path}")

# Files to process
files = [
    'api/routes/alerts.py',
    'api/routes/anomalies.py', 
    'api/routes/correlation.py'
]

for file_path in files:
    remove_api_key_deps(file_path)

print("Done!")
