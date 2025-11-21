#!/usr/bin/env python3

import requests
import json
import os

def create_github_issue(title, body, labels):
    """Create a GitHub issue directly"""
    url = "https://api.github.com/repos/hadysysdev/solana_migration_tool/issues"
    
    # Try without token first (might work if permissions are granted)
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    
    # If token is available, use it
    token = os.getenv('GITHUB_TOKEN')
    if token:
        headers["Authorization"] = f"token {token}"
    
    data = {
        "title": title,
        "body": body,
        "labels": labels
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 201:
            issue_data = response.json()
            print(f"✅ Created: {issue_data['html_url']}")
            return issue_data['html_url']
        else:
            print(f"❌ Failed to create '{title}': {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating '{title}': {str(e)}")
        return None

def main():
    print("Creating GitHub issues for W3Swap audit remediation...")
    print("Repository: hadysysdev/solana_migration_tool")
    print()
    
    # Issues to create
    issues = [
        ("1_secure_pda_checks.md", "Secure PDA checks", ["audit", "security", "severity/high", "component:onchain"]),
        ("2_guard_swap_reentry.md", "Guard swap reentry", ["audit", "security", "severity/high", "component:onchain", "backend:meteora", "backend:jupiter"]),
        ("3_strengthen_math_controls.md", "Strengthen math controls", ["audit", "severity/medium", "component:onchain"]),
        ("4_safe_account_init.md", "Safe account init", ["audit", "severity/medium", "component:onchain"]),
        ("5_handle_token2022_quirks.md", "Handle token-2022 quirks", ["audit", "severity/medium", "component:onchain", "token2022"]),
        ("6_validate_token_owners_rentexempt.md", "Validate token owners/rent-exempt", ["audit", "severity/medium", "component:onchain"]),
        ("7_validate_remaining_accounts.md", "Validate remaining accounts", ["audit", "severity/low", "component:onchain"]),
        ("8_normalize_error_handling.md", "Normalize error handling", ["audit", "severity/low", "component:onchain"]),
        ("9_audit_event_fields.md", "Audit event fields", ["audit", "severity/low", "component:onchain"]),
        ("10_dust_handling_policy.md", "Dust handling policy", ["audit", "severity/low", "component:onchain"]),
        ("11_split_lp_activation.md", "Split LP activation (fund_init_lp + activation gating)", ["audit", "feature", "severity/medium", "component:onchain", "lp"])
    ]
    
    created_urls = []
    
    for filename, title, labels in issues:
        print(f"Creating: {title}")
        
        # Read issue body
        try:
            with open(f"github_issues/{filename}", 'r') as f:
                body = f.read()
        except FileNotFoundError:
            print(f"❌ File not found: github_issues/{filename}")
            continue
        
        # Create issue
        url = create_github_issue(title, body, labels)
        if url:
            created_urls.append(url)
    
    print()
    print("=" * 50)
    print(f"Created {len(created_urls)} issues:")
    for url in created_urls:
        print(f"  - {url}")
    print()
    print("Repository: https://github.com/hadysysdev/solana_migration_tool/issues")

if __name__ == "__main__":
    main()