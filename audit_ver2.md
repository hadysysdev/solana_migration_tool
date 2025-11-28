# Smart Contract Audit Report - Version 2

## Executive Summary
This audit covers the `w3swap` Solana smart contract. 
**Status of previous audit (Ver 1):** Most critical issues (Compilation Error, Manual Instruction Data) have been **FIXED**. 
**New Findings:** A critical scalability issue was found in the Allowlist/Denylist implementation that renders it unusable for large lists. The Meteora integration still relies on hardcoded values.

## Issues Ranked by Severity

### 1. [High] Unusable Allowlist/Denylist for Large Sets
**Location**: `programs/w3swap/src/instructions/project_lifecycle.rs` (Instruction `create_project_init`) and `state.rs`

**Issue Details**:
The `create_project_init` instruction accepts `allowlist: Vec<Pubkey>` and `denylist: Vec<Pubkey>` as arguments in `CreateProjectParams`.
```rust
pub struct CreateProjectParams {
    // ...
    pub allowlist: Vec<Pubkey>,
    pub denylist: Vec<Pubkey>,
}
```
If a user attempts to provide a list with more than ~30 addresses, the serialized instruction data will exceed the Solana transaction size limit (1232 bytes).
`MAX_ALLOWLIST_ENTRIES` is set to 1000. A list of 1000 pubkeys is 32,000 bytes, which is impossible to send in a single transaction.
**Impact**: The Allowlist/Denylist feature is effectively broken for any project needing more than a handful of addresses.
**User Impact**: Admins will fail to create projects if they try to use this feature as intended.

**Suggested Solution**:
1. Remove `allowlist` and `denylist` vectors from `CreateProjectParams`.
2. Initialize the project with empty lists (or `None`).
3. Create separate instructions `add_to_allowlist` and `add_to_denylist` that accept a batch of addresses (e.g., up to 20) and append them to the project account.
4. Ensure the `Project` account is allocated with sufficient space (which is already handled by `allocate_project_account` and `expand_project_account`, but verify the logic supports incremental updates).

**Agent Prompt**:
```text
Refactor `programs/w3swap/src/instructions/project_lifecycle.rs` to fix the transaction size limit issue with allowlists.
1. Modify `CreateProjectParams` struct to REMOVE `allowlist` and `denylist` fields.
2. Update `create_project_init` to initialize `project.allowlist` and `project.denylist` as `None` or empty vectors based on `allowlist_enabled` flags.
3. Create a new instruction `add_to_allowlist` in `project_lifecycle.rs` (or a new file `access_control.rs`) that takes `project_id` and `new_entries: Vec<Pubkey>`.
4. In `add_to_allowlist`, verify the project exists and the signer is the project admin. Append `new_entries` to `project.allowlist`. Ensure `MAX_ALLOWLIST_ENTRIES` is not exceeded.
5. Do the same for `add_to_denylist`.
6. Update `state.rs` if necessary to ensure `Project` struct can handle these updates.
```

---

### 2. [Medium] Hardcoded Meteora Discriminator & Struct
**Location**: `programs/w3swap/src/liquidity/meteora.rs`

**Issue Details**:
The code still uses a hardcoded discriminator and a locally defined `MeteoraInitPoolArgs` struct.
```rust
const CREATE_CUSTOMIZABLE_PERMISSIONLESS_LB_PAIR_DISCRIMINATOR: [u8; 8] = [55, 198, 230, 203, 16, 237, 240, 173];
```
While better than manual byte packing, this creates a fragile dependency. If Meteora updates their program, this integration breaks.

**Suggested Solution**:
Integrate the official `lb_clmm` crate to derive the instruction builder or discriminator dynamically. If that is not possible due to version conflicts, add a comprehensive test suite that forks mainnet/devnet state and verifies this instruction against the actual Meteora program.

**Agent Prompt**:
```text
Improve the Meteora integration in `programs/w3swap/src/liquidity/meteora.rs`.
1. Attempt to add `lb_clmm` (Meteora DLMM) crate to `Cargo.toml`.
2. Refactor `validate_and_build_initialize_pool` to use the crate's instruction builder.
3. If the crate is incompatible, create a new test file `tests/meteora_integration.ts` that:
    - Forks mainnet.
    - Calls `initialize_liquidity_pool` with `PoolType::MeteoraDlmm`.
    - Verifies that the CPI succeeds and a pool is created.
    - This ensures the hardcoded discriminator is correct.
```

---

### 3. [Medium] Blind CPI Execution in Liquidation
**Location**: `programs/w3swap/src/instructions/liquidation.rs` (`swap_old_token_batch`) and `lp_management.rs` (`finalize_settlement`)

**Issue Details**:
These instructions accept `ix_data: Vec<u8>` and pass it directly to a CPI call to `route_program`.
```rust
let ix = anchor_lang::solana_program::instruction::Instruction {
    program_id: backend_program,
    accounts: metas,
    data: ix_data,
};
```
While `route_program` is allowlisted, the `ix_data` is opaque. A malicious or buggy admin could sign a transaction that does something unexpected (e.g., transfers funds to a random address instead of swapping, if the target program allows it).
**Impact**: Potential loss of funds if admin keys are compromised or misused, or if the frontend constructs bad data.

**Suggested Solution**:
Validate `ix_data` where possible. For Jupiter, this is hard due to dynamic routes. For Meteora, you can verify the instruction discriminator matches "Swap".
At a minimum, ensure the `wsol_vault` balance *increases* (which is already done via `min_out` check).
The current `min_out` check is a good safeguard, but decoding the instruction would be safer.

**Agent Prompt**:
```text
Enhance security in `swap_old_token_batch` in `programs/w3swap/src/instructions/liquidation.rs`.
1. Add a comment warning about "Blind CPI" risks.
2. Ensure that the `min_out` check is strictly enforced (it is currently).
3. Consider adding a check: if `backend` is `Meteora`, verify that `ix_data` starts with the "Swap" discriminator for Meteora DLMM.
4. Verify that `wsol_vault` is NOT passed as a signer (it shouldn't be, the PDA signs).
```

---

### 4. [Low] Missing Rent Reclaim for Users
**Location**: `programs/w3swap/src/instructions/migration.rs`

**Issue Details**:
Users create a `UserMigration` PDA to track their migration. There is no instruction to close this account.
**Impact**: User's rent SOL (approx 0.002 SOL) is locked forever in the PDA.
**User Impact**: Minor financial loss (rent).

**Suggested Solution**:
Add a `close_user_migration` instruction.

**Agent Prompt**:
```text
Add a `close_user_migration` instruction to `programs/w3swap/src/instructions/migration.rs`.
1. Define `CloseUserMigration` context with:
    - `user_migration` (mut, close = user, seeds = [...], has_one = user)
    - `user` (Signer)
    - `project` (Constraint: migration is over OR refund claimed)
2. Implement `close_user_migration` function.
3. Allow closing ONLY if `project.status` is `Ended/Finalized` OR if the user has claimed a refund (if refunds are implemented).
```

---

### 5. [Low] Fragile Project Account Allocation
**Location**: `programs/w3swap/src/instructions/project_lifecycle.rs`

**Issue Details**:
The `allocate_project_account` and `expand_project_account` instructions use manual system program calls and reallocations. This is complex and prone to errors if `Project` struct layout changes significantly (though `ProjectHeader` mitigates this).
**Impact**: Maintenance burden.

**Suggested Solution**:
Keep as is for now since it solves the 10KB limit, but ensure `ProjectHeader` is always kept in sync with the first fields of `Project`. Add a test to verify offsets.

**Agent Prompt**:
```text
Add a unit test in `programs/w3swap/src/lib.rs` (or `state.rs`) to verify `ProjectHeader` compatibility.
1. Create a test `test_project_header_alignment`.
2. Instantiate a `Project` struct with dummy data.
3. Serialize it.
4. Deserialize the first N bytes into `ProjectHeader`.
5. Assert that `header.discriminator`, `header.project_id`, and `header.project_admin` match the `Project` fields.
```
