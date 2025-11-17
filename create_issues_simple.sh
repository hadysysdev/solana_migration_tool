#!/bin/bash

# Simple script to create GitHub issues using curl
REPO="hadysysdev/solana_migration_tool"
ISSUES_DIR="github_issues"

echo "Creating GitHub issues for W3Swap audit remediation..."
echo "Repository: $REPO"
echo ""

# Check if we can access the repo
echo "Checking repository access..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/$REPO")
if [ "$HTTP_STATUS" -ne 200 ]; then
    echo "❌ Cannot access repository $REPO (HTTP $HTTP_STATUS)"
    echo "Please ensure you have proper permissions"
    exit 1
fi

echo "✅ Repository accessible"
echo ""

# Function to create an issue
create_issue() {
    local file="$1"
    local title="$2"
    local labels="$3"
    
    if [ ! -f "$file" ]; then
        echo "❌ File not found: $file"
        return 1
    fi
    
    echo "Creating issue: $title"
    
    # Read the issue body
    body=$(cat "$file")
    
    # Create the issue using curl
    response=$(curl -s -X POST \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO/issues" \
        -d "{\"title\":\"$title\",\"body\":\"$body\",\"labels\":[$labels]}")
    
    # Extract the issue URL
    issue_url=$(echo "$response" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$issue_url" ]; then
        echo "✅ Created: $issue_url"
        return 0
    else
        echo "❌ Failed to create issue"
        echo "Response: $response"
        return 1
    fi
}

# Create all issues
echo "Creating 11 GitHub issues..."
echo ""

create_issue "$ISSUES_DIR/1_secure_pda_checks.md" "Secure PDA checks" '"audit","security","severity/high","component:onchain"'

create_issue "$ISSUES_DIR/2_guard_swap_reentry.md" "Guard swap reentry" '"audit","security","severity/high","component:onchain","backend:meteora","backend:jupiter"'

create_issue "$ISSUES_DIR/3_strengthen_math_controls.md" "Strengthen math controls" '"audit","severity/medium","component:onchain"'

create_issue "$ISSUES_DIR/4_safe_account_init.md" "Safe account init" '"audit","severity/medium","component:onchain"'

create_issue "$ISSUES_DIR/5_handle_token2022_quirks.md" "Handle token-2022 quirks" '"audit","severity/medium","component:onchain","token2022"'

create_issue "$ISSUES_DIR/6_validate_token_owners_rentexempt.md" "Validate token owners/rent-exempt" '"audit","severity/medium","component:onchain"'

create_issue "$ISSUES_DIR/7_validate_remaining_accounts.md" "Validate remaining accounts" '"audit","severity/low","component:onchain"'

create_issue "$ISSUES_DIR/8_normalize_error_handling.md" "Normalize error handling" '"audit","severity/low","component:onchain"'

create_issue "$ISSUES_DIR/9_audit_event_fields.md" "Audit event fields" '"audit","severity/low","component:onchain"'

create_issue "$ISSUES_DIR/10_dust_handling_policy.md" "Dust handling policy" '"audit","severity/low","component:onchain"'

create_issue "$ISSUES_DIR/11_split_lp_activation.md" "Split LP activation (fund_init_lp + activation gating)" '"audit","feature","severity/medium","component:onchain","lp"'

echo ""
echo "✅ GitHub issue creation process completed!"
echo "Repository: https://github.com/$REPO/issues"