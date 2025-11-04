# Validate remaining accounts

**Labels:** audit, severity/low, component:onchain

## Problem
Instructions that accept `remaining_accounts` parameters, particularly in swap execution and LP management, may not adequately validate these accounts. This could lead to security vulnerabilities through malicious account injection.

## Suggested Solution
1. Add comprehensive validation for remaining_accounts parameters
2. Implement account type validation for dynamic accounts
3. Add account ownership and program validation
4. Implement safe account metadata extraction
5. Add bounds checking for remaining_accounts arrays

## Acceptance Criteria
- All remaining_accounts are properly validated
- Account types and ownership are verified
- Dynamic account handling is secure
- Account injection attacks are prevented
- Remaining_accounts validation is comprehensive

## Links
Refer to audit sections on remaining accounts validation in `audits/w3swap_audit.md`