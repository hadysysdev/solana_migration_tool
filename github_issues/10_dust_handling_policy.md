# Dust handling policy

**Labels:** audit, severity/low, component:onchain

## Problem
The program may not have a clear policy for handling dust amounts (very small token amounts) during migrations, swaps, and LP operations. This could lead to user experience issues or potential exploits.

## Suggested Solution
1. Define and implement a dust handling policy
2. Add minimum amount validation for token operations
3. Implement dust collection or burning mechanisms
4. Add user notifications for dust amounts
5. Configure dust thresholds per operation type

## Acceptance Criteria
- Dust handling policy is clearly defined and implemented
- Minimum amount validation prevents dust creation
- Dust collection mechanisms are in place
- Users are informed about dust amounts
- Dust handling is consistent across all operations

## Links
Refer to audit sections on dust handling in `audits/w3swap_audit.md`