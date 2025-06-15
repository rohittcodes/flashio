#!/usr/bin/env python3
"""Clean up unused API verification functions and Header imports"""

import re
import os

def clean_file(file_path):
    """Clean up a single file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remove Header from imports
    content = re.sub(r',\s*Header', '', content)
    content = re.sub(r'Header,\s*', '', content)
    
    # Remove unused verification functions
    content = re.sub(r'async def verify_api_key[^}]*?return x_api_key\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'async def verify_api_key_optional[^}]*?return x_api_key\n\n', '', content, flags=re.DOTALL)
    
    # Remove credential manager imports and initialization if no longer used
    if 'verify_api_key' not in content:
        content = re.sub(r'from utils\.encryption import CredentialManager\n', '', content)
        content = re.sub(r'credential_manager = CredentialManager\(\)\n', '', content)
        content = re.sub(r'# Initialize credential manager.*?\n', '', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {file_path}")
    else:
        print(f"ℹ️  No changes: {file_path}")

# Files to process
files = [
    'api/routes/credentials.py',
    'api/routes/alerts.py',
    'api/routes/anomalies.py', 
    'api/routes/correlation.py'
]

for file_path in files:
    clean_file(file_path)

print("Done!")
