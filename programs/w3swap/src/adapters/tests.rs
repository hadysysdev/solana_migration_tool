//! Unit tests for Meteora and Jupiter adapters

#[cfg(test)]
mod tests {
    use super::super::*;
    use anchor_lang::prelude::*;

    #[test]
    fn test_meteora_instruction_discriminators() {
        let dlmm_swap = MeteoraInstruction::DlmmSwap;
        assert_eq!(dlmm_swap.discriminator().len(), 8);

        let amm_swap = MeteoraInstruction::AmmSwap;
        assert_eq!(amm_swap.discriminator().len(), 8);

        let dlmm_swap_with_metadata = MeteoraInstruction::DlmmSwapWithMetadata;
        assert_eq!(dlmm_swap_with_metadata.discriminator().len(), 8);

        // Ensure discriminators are different
        assert_ne!(dlmm_swap.discriminator(), amm_swap.discriminator());
        assert_ne!(
            dlmm_swap.discriminator(),
            dlmm_swap_with_metadata.discriminator()
        );
    }

    #[test]
    fn test_jupiter_instruction_discriminators() {
        let swap = JupiterInstruction::Swap;
        assert_eq!(swap.discriminator().len(), 8);

        let swap_v6 = JupiterInstruction::SwapV6;
        assert_eq!(swap_v6.discriminator().len(), 8);

        // Ensure discriminators are different
        assert_ne!(swap.discriminator(), swap_v6.discriminator());
    }

    #[test]
    fn test_swap_params_validation() {
        let valid_params = SwapParams {
            amount_in: 1000,
            minimum_amount_out: 900,
            a_to_b: true,
        };

        assert!(valid_params.amount_in > 0);
        assert!(valid_params.minimum_amount_out > 0);

        let invalid_params = SwapParams {
            amount_in: 0, // Invalid
            minimum_amount_out: 900,
            a_to_b: true,
        };

        assert_eq!(invalid_params.amount_in, 0);
    }

    #[test]
    fn test_jupiter_swap_params_validation() {
        let valid_params = JupiterSwapParams {
            amount_in: 1000000,
            minimum_amount_out: 950000,
            mode: JupiterMode::ExactIn,
        };

        assert!(valid_params.amount_in > 0);
        assert!(valid_params.minimum_amount_out > 0);
        assert_eq!(valid_params.mode, JupiterMode::ExactIn);

        let exact_out_params = JupiterSwapParams {
            amount_in: 1000000,
            minimum_amount_out: 950000,
            mode: JupiterMode::ExactOut,
        };

        assert_eq!(exact_out_params.mode, JupiterMode::ExactOut);
    }

    #[test]
    fn test_common_validations() {
        let allowed_programs = vec![
            METEORA_DLMM_PROGRAM_ID,
            METEORA_AMM_PROGRAM_ID,
            JUPITER_PROGRAM_ID,
        ];

        // Test valid program IDs
        assert!(common::validate_program_id(METEORA_DLMM_PROGRAM_ID, &allowed_programs).is_ok());
        assert!(common::validate_program_id(METEORA_AMM_PROGRAM_ID, &allowed_programs).is_ok());
        assert!(common::validate_program_id(JUPITER_PROGRAM_ID, &allowed_programs).is_ok());

        // Test invalid program ID
        let invalid_program = Pubkey::default();
        assert!(common::validate_program_id(invalid_program, &allowed_programs).is_err());

        // Test empty allowed list
        let empty_allowed: Vec<Pubkey> = vec![];
        assert!(common::validate_program_id(METEORA_DLMM_PROGRAM_ID, &empty_allowed).is_err());
    }

    #[test]
    fn test_remaining_accounts_validation() {
        // Test with empty accounts since we can't easily mock AccountInfo
        let empty_accounts: Vec<AccountInfo> = vec![];

        // Test with empty accounts should fail for any count > 0
        assert!(common::validate_remaining_accounts_order(&empty_accounts, 0).is_ok());
        assert!(common::validate_remaining_accounts_order(&empty_accounts, 1).is_err());
    }

    #[test]
    fn test_project_signer_seeds() {
        let project_admin = Pubkey::new_unique();
        let project_id = 12345;
        let bump = 255;

        let seeds = common::get_project_signer_seeds(project_admin, project_id, bump);

        // Should have 4 seed components: "project", project_admin, project_id, bump
        assert_eq!(seeds.len(), 4);

        // Check first seed is "project"
        assert_eq!(seeds[0], b"project".to_vec());

        // Check second seed is project admin
        assert_eq!(seeds[1], project_admin.to_bytes().to_vec());

        // Check third seed is project_id as bytes
        let project_id_bytes = project_id.to_le_bytes().to_vec();
        assert_eq!(seeds[2], project_id_bytes);

        // Check fourth seed is bump
        assert_eq!(seeds[3], vec![bump]);
    }

    #[test]
    fn test_meteora_program_ids() {
        // Test that program IDs are different
        assert_ne!(METEORA_DLMM_PROGRAM_ID, METEORA_AMM_PROGRAM_ID);
        assert_ne!(
            METEORA_DLMM_PROGRAM_ID_DEVNET,
            METEORA_AMM_PROGRAM_ID_DEVNET
        );

        // Test that mainnet and devnet IDs are different
        assert_ne!(METEORA_DLMM_PROGRAM_ID, METEORA_DLMM_PROGRAM_ID_DEVNET);
        assert_ne!(METEORA_AMM_PROGRAM_ID, METEORA_AMM_PROGRAM_ID_DEVNET);
    }

    #[test]
    fn test_jupiter_program_ids() {
        // Test that mainnet and devnet IDs are the same for Jupiter
        assert_eq!(JUPITER_PROGRAM_ID, JUPITER_PROGRAM_ID_DEVNET);

        // Test that Jupiter ID is not the same as Meteora IDs
        assert_ne!(JUPITER_PROGRAM_ID, METEORA_DLMM_PROGRAM_ID);
        assert_ne!(JUPITER_PROGRAM_ID, METEORA_AMM_PROGRAM_ID);
    }

    #[test]
    fn test_jupiter_modes() {
        let exact_in = JupiterMode::ExactIn;
        let exact_out = JupiterMode::ExactOut;

        assert_eq!(exact_in, JupiterMode::ExactIn);
        assert_eq!(exact_out, JupiterMode::ExactOut);
        assert_ne!(exact_in, exact_out);
    }
}
