#!/usr/bin/env python3
"""
GitHub Issue Creation Script for W3Swap Audit Remediation
Creates GitHub issues from markdown files using GitHub API
"""

import os
import sys
import requests
import json
from pathlib import Path

class GitHubIssueCreator:
    def __init__(self, token=None, repo="hadysysdev/solana_migration_tool"):
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.repo = repo
        self.base_url = f"https://api.github.com/repos/{self.repo}/issues"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"token {self.token}" if self.token else None
        }
        
    def create_issue(self, title, body, labels):
        """Create a single GitHub issue"""
        if not self.token:
            print(f"ERROR: No GitHub token provided. Would create issue: {title}")
            return {"html_url": f"https://github.com/{self.repo}/issues/MOCK"}
            
        data = {
            "title": title,
            "body": body,
            "labels": labels
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=data)
            if response.status_code == 201:
                issue_data = response.json()
                print(f"✅ Created issue: {issue_data['html_url']}")
                return issue_data
            else:
                print(f"❌ Failed to create issue '{title}': {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error creating issue '{title}': {str(e)}")
            return None
    
    def create_issues_from_files(self):
        """Create all issues from markdown files in github_issues directory"""
        issues_dir = Path("github_issues")
        if not issues_dir.exists():
            print(f"❌ Directory {issues_dir} not found")
            return []
        
        # Issue configuration mapping
        issue_configs = {
            "1_secure_pda_checks.md": {
                "title": "Secure PDA checks",
                "labels": ["audit", "security", "severity/high", "component:onchain"]
            },
            "2_guard_swap_reentry.md": {
                "title": "Guard swap reentry", 
                "labels": ["audit", "security", "severity/high", "component:onchain", "backend:meteora", "backend:jupiter"]
            },
            "3_strengthen_math_controls.md": {
                "title": "Strengthen math controls",
                "labels": ["audit", "severity/medium", "component:onchain"]
            },
            "4_safe_account_init.md": {
                "title": "Safe account init",
                "labels": ["audit", "severity/medium", "component:onchain"]
            },
            "5_handle_token2022_quirks.md": {
                "title": "Handle token-2022 quirks",
                "labels": ["audit", "severity/medium", "component:onchain", "token2022"]
            },
            "6_validate_token_owners_rentexempt.md": {
                "title": "Validate token owners/rent-exempt",
                "labels": ["audit", "severity/medium", "component:onchain"]
            },
            "7_validate_remaining_accounts.md": {
                "title": "Validate remaining accounts",
                "labels": ["audit", "severity/low", "component:onchain"]
            },
            "8_normalize_error_handling.md": {
                "title": "Normalize error handling",
                "labels": ["audit", "severity/low", "component:onchain"]
            },
            "9_audit_event_fields.md": {
                "title": "Audit event fields",
                "labels": ["audit", "severity/low", "component:onchain"]
            },
            "10_dust_handling_policy.md": {
                "title": "Dust handling policy",
                "labels": ["audit", "severity/low", "component:onchain"]
            },
            "11_split_lp_activation.md": {
                "title": "Split LP activation (fund_init_lp + activation gating)",
                "labels": ["audit", "feature", "severity/medium", "component:onchain", "lp"]
            }
        }
        
        created_issues = []
        
        for filename, config in issue_configs.items():
            file_path = issues_dir / filename
            if file_path.exists():
                print(f"Creating issue from {filename}...")
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    body = f.read()
                
                issue = self.create_issue(
                    title=config["title"],
                    body=body,
                    labels=config["labels"]
                )
                
                if issue:
                    created_issues.append(issue)
            else:
                print(f"❌ File not found: {file_path}")
        
        return created_issues

def main():
    print("GitHub Issue Creation Script for W3Swap Audit Remediation")
    print("=" * 60)
    
    # Check for GitHub token
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("⚠️  WARNING: No GITHUB_TOKEN environment variable found.")
        print("   Issues will be simulated (mock URLs only).")
        print("   To create real issues, set GITHUB_TOKEN with repo write access.")
        print()
    
    # Create issue creator
    creator = GitHubIssueCreator(token=token)
    
    # Create issues
    issues = creator.create_issues_from_files()
    
    # Summary
    print("\n" + "=" * 60)
    print(f"Issue Creation Summary:")
    print(f"Total issues processed: {len(issues)}")
    
    if issues:
        print(f"Created issue URLs:")
        for issue in issues:
            print(f"  - {issue['html_url']}")
    else:
        print("No issues were created.")
    
    if not token:
        print("\n🔧 To create real issues:")
        print("1. Generate a GitHub Personal Access Token with 'repo' scope")
        print("2. Set environment variable: export GITHUB_TOKEN=your_token")
        print("3. Run this script again")

if __name__ == "__main__":
    main()