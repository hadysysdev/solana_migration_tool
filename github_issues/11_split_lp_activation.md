# Split LP activation (fund_init_lp + activation gating)

**Labels:** audit, feature, severity/medium, component:onchain, lp

## Problem
Current LP activation process combines funding and activation in a single operation, which may not provide sufficient flexibility and control for project administrators. The process could benefit from being split into separate funding and activation steps.

## Suggested Solution
1. Split LP activation into separate funding and activation instructions
2. Add fund_init_lp instruction for LP funding preparation
3. Implement activation gating with proper validation
4. Add LP configuration validation before activation
5. Implement proper state management for LP lifecycle

## Acceptance Criteria
- LP funding and activation are separate operations
- Activation gating includes comprehensive validation
- LP configuration is validated before activation
- State transitions are properly managed
- LP lifecycle is flexible and secure

## Links
Refer to audit sections on LP activation in `audits/w3swap_audit.md`