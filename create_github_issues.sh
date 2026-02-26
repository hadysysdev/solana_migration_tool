#!/bin/bash

# Script to create GitHub issues from markdown files
# Usage: ./create_github_issues.sh

REPO="hadysysdev/solana_migration_tool"

echo "Creating GitHub issues for W3Swap audit remediation..."

# Issue 1: Secure PDA checks
echo "Creating issue 1: Secure PDA checks"
gh issue create --repo "$REPO" \
  --title "Secure PDA checks" \
  --label "audit,security,severity/high,component:onchain" \
  --body "$(cat github_issues/1_secure_pda_checks.md)"

# Issue 2: Guard swap reentry
echo "Creating issue 2: Guard swap reentry"
gh issue create --repo "$REPO" \
  --title "Guard swap reentry" \
  --label "audit,security,severity/high,component:onchain,backend:meteora,backend:jupiter" \
  --body "$(cat github_issues/2_guard_swap_reentry.md)"

# Issue 3: Strengthen math controls
echo "Creating issue 3: Strengthen math controls"
gh issue create --repo "$REPO" \
  --title "Strengthen math controls" \
  --label "audit,severity/medium,component:onchain" \
  --body "$(cat github_issues/3_strengthen_math_controls.md)"

# Issue 4: Safe account init
echo "Creating issue 4: Safe account init"
gh issue create --repo "$REPO" \
  --title "Safe account init" \
  --label "audit,severity/medium,component:onchain" \
  --body "$(cat github_issues/4_safe_account_init.md)"

# Issue 5: Handle token-2022 quirks
echo "Creating issue 5: Handle token-2022 quirks"
gh issue create --repo "$REPO" \
  --title "Handle token-2022 quirks" \
  --label "audit,severity/medium,component:onchain,token2022" \
  --body "$(cat github_issues/5_handle_token2022_quirks.md)"

# Issue 6: Validate token owners/rent-exempt
echo "Creating issue 6: Validate token owners/rent-exempt"
gh issue create --repo "$REPO" \
  --title "Validate token owners/rent-exempt" \
  --label "audit,severity/medium,component:onchain" \
  --body "$(cat github_issues/6_validate_token_owners_rentexempt.md)"

# Issue 7: Validate remaining accounts
echo "Creating issue 7: Validate remaining accounts"
gh issue create --repo "$REPO" \
  --title "Validate remaining accounts" \
  --label "audit,severity/low,component:onchain" \
  --body "$(cat github_issues/7_validate_remaining_accounts.md)"

# Issue 8: Normalize error handling
echo "Creating issue 8: Normalize error handling"
gh issue create --repo "$REPO" \
  --title "Normalize error handling" \
  --label "audit,severity/low,component:onchain" \
  --body "$(cat github_issues/8_normalize_error_handling.md)"

# Issue 9: Audit event fields
echo "Creating issue 9: Audit event fields"
gh issue create --repo "$REPO" \
  --title "Audit event fields" \
  --label "audit,severity/low,component:onchain" \
  --body "$(cat github_issues/9_audit_event_fields.md)"

# Issue 10: Dust handling policy
echo "Creating issue 10: Dust handling policy"
gh issue create --repo "$REPO" \
  --title "Dust handling policy" \
  --label "audit,severity/low,component:onchain" \
  --body "$(cat github_issues/10_dust_handling_policy.md)"

# Issue 11: Split LP activation
echo "Creating issue 11: Split LP activation"
gh issue create --repo "$REPO" \
  --title "Split LP activation (fund_init_lp + activation gating)" \
  --label "audit,feature,severity/medium,component:onchain,lp" \
  --body "$(cat github_issues/11_split_lp_activation.md)"

echo "All 11 GitHub issues have been created successfully!"
echo "Repository: $REPO"