# Guard swap reentry

**Labels:** audit, security, severity/high, component:onchain, backend:meteora, backend:jupiter

## Problem
Swap execution functions in `programs/w3swap/src/instructions/lp_management.rs` (ExecuteMeteoraSwap and ExecuteJupiterSwap) lack reentry protection mechanisms. This could allow malicious actors to call swap functions multiple times within the same transaction or exploit state transitions during execution.

## Suggested Solution
1. Add reentry protection using a global reentry guard in PlatformConfig
2. Implement atomic state transitions during swap execution
3. Add transaction-level locks for critical swap operations
4. Validate swap execution context and prevent duplicate calls
5. Use Anchor's `#[access_control]` macros for reentry protection

## Acceptance Criteria
- Reentry guard prevents multiple simultaneous swap executions
- State transitions are atomic and consistent
- Swap execution includes proper validation checks
- Cross-Program Invocation (CPI) calls are protected
- Tests cover reentry attack scenarios

## Links
Refer to audit sections on reentry protection in `audits/w3swap_audit.md`