# Secure PDA checks

**Labels:** audit, security, severity/high, component:onchain

## Problem
PDA (Program Derived Address) validation is insufficient across multiple instructions in the W3Swap program. Current PDA checks in files like `programs/w3swap/src/instructions/platform_management.rs`, `programs/w3swap/src/instructions/migration.rs`, and `programs/w3swap/src/instructions/lp_management.rs` rely on basic seed validation but may not fully validate PDA ownership and derivation consistency.

## Suggested Solution
1. Add comprehensive PDA validation utility functions in `programs/w3swap/src/utils.rs`
2. Implement PDA ownership verification using assert_eq checks for derived addresses
3. Add PDA bump validation for all derived accounts
4. Include PDA validation in all instruction account constraints
5. Use Anchor's seeds::program constraint where applicable

## Acceptance Criteria
- All PDA derivations include explicit ownership validation
- PDA bump values are validated against derived bumps
- PDA validation utilities are centralized and reused across instructions
- All account constraints include proper PDA validation
- Tests cover PDA validation edge cases

## Links
Refer to audit sections on PDA validation in `audits/w3swap_audit.md`