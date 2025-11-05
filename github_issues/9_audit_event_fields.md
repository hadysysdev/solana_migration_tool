# Audit event fields

**Labels:** audit, severity/low, component:onchain

## Problem
Event emission in `programs/w3swap/src/events.rs` may include sensitive or unnecessary information, and some critical events may be missing. Event fields may not be properly validated before emission.

## Suggested Solution
1. Audit all event fields for sensitive information exposure
2. Add missing critical events for important state transitions
3. Implement event field validation and sanitization
4. Standardize event structure and naming conventions
5. Add event indexing and filtering capabilities

## Acceptance Criteria
- Event fields are audited and sanitized
- Critical events are emitted for all important operations
- Event structure is consistent and well-documented
- No sensitive information is exposed in events
- Event emission is comprehensive and reliable

## Links
Refer to audit sections on event security in `audits/w3swap_audit.md`