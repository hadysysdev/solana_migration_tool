# Validate token owners/rent-exempt

**Labels:** audit, severity/medium, component:onchain

## Problem
Token account validation across migration and LP management instructions may not adequately validate token account ownership and rent-exempt status. This could lead to vulnerabilities in token transfer operations.

## Suggested Solution
1. Add comprehensive token account ownership validation
2. Implement rent-exempt status checks for all token accounts
3. Validate token account authorities and delegations
4. Add checks for token account mint consistency
5. Implement token account balance validation

## Acceptance Criteria
- Token account ownership is properly validated
- Rent-exempt status is verified for all accounts
- Token account authorities are correctly checked
- Mint consistency is validated across operations
- Token account state is secure throughout operations

## Links
Refer to audit sections on token validation in `audits/w3swap_audit.md`