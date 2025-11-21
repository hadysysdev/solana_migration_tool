#!/bin/bash

echo "=== GITHUB ISSUE CREATION ==="
echo "Since you mentioned GitHub permissions are granted, let's try to create issues."
echo ""

# First, let's check if we can access the repository
echo "Testing repository access..."
curl -s "https://api.github.com/repos/hadysysdev/solana_migration_tool" > /tmp/repo_check.json

if grep -q '"id"' /tmp/repo_check.json; then
    echo "✅ Repository accessible"
else
    echo "❌ Cannot access repository"
    cat /tmp/repo_check.json
    exit 1
fi

echo ""
echo "To create issues, you need to set your GitHub token:"
echo "export GITHUB_TOKEN=your_github_personal_access_token"
echo ""
echo "Then run: python3 create_issues_direct.py"
echo ""
echo "Or manually create issues at:"
echo "https://github.com/hadysysdev/solana_migration_tool/issues/new"