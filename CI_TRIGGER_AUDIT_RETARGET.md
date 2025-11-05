# CI Trigger for Audit Branch

This file was created to trigger CI runs after retargeting PRs to the audit branch.

## Retargeting Summary

All relevant PRs have been successfully retargeted to the `audit` branch:

- PR #5: [audit] feat: safe CPI adapters for Meteora and Jupiter DEX integration
- PR #4: [audit] feat: batched old-token liquidation with Jupiter/Meteora backends  
- PR #1: [audit] Static audit: programs/w3swap (report only)

This commit ensures CI runs against the audit branch for all retargeted PRs.

## Audit Workflow

All audit-related work is now consolidated into the `audit` branch for streamlined review and deployment.
