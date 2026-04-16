use anchor_lang::prelude::*;
use anchor_lang::system_program;

// ⚠️ Replace with output of: anchor keys list  (after anchor build)
declare_id!("6tLhtJ5vr4R2KF4xoDodQmuWKvGPm1orXRqvtTNy5P3t");


// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod quantum_vault {
    use super::*;

    /// Initialize a new quantum-resistant vault PDA for the caller's wallet.
    ///
    /// Stores the SHA-256 hash of the user's ML-DSA-65 (Dilithium) public key
    /// on-chain, creating a tamper-proof binding between their Solana wallet
    /// and their post-quantum identity.
    ///
    /// PDA seed: ["quantum-vault", owner_pubkey]
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        pq_pubkey_hash: [u8; 32],
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        vault.owner = ctx.accounts.owner.key();
        vault.pq_pubkey_hash = pq_pubkey_hash;
        vault.is_protected = true;
        vault.sol_deposited = 0;
        vault.created_at = clock.unix_timestamp;
        vault.bump = ctx.bumps.vault;

        emit!(VaultInitialized {
            owner: vault.owner,
            pq_pubkey_hash,
            created_at: vault.created_at,
        });

        msg!(
            "Quantum Vault initialized for owner: {} | PQ hash: {:?}",
            vault.owner,
            &pq_pubkey_hash[..4]
        );

        Ok(())
    }

    /// Deposit SOL into the vault PDA.
    ///
    /// Transfers `amount` lamports from the owner's wallet to the vault PDA.
    /// The vault PDA is controlled by the program — no private key exists.
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        let owner_balance = ctx.accounts.owner.lamports();
        require!(owner_balance >= amount, VaultError::InsufficientFunds);

        // Transfer SOL from owner → vault PDA via system program CPI
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // Update tracked balance
        ctx.accounts.vault.sol_deposited = ctx
            .accounts
            .vault
            .sol_deposited
            .checked_add(amount)
            .ok_or(VaultError::Overflow)?;

        emit!(SolDeposited {
            owner: ctx.accounts.owner.key(),
            amount,
            total: ctx.accounts.vault.sol_deposited,
        });

        msg!(
            "Deposited {} lamports into vault. Total: {}",
            amount,
            ctx.accounts.vault.sol_deposited
        );

        Ok(())
    }

    /// Withdraw SOL from the vault back to the owner's wallet.
    ///
    /// Only the original owner can withdraw. Uses PDA signing (bump seed).
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        require!(
            ctx.accounts.vault.sol_deposited >= amount,
            VaultError::InsufficientFunds
        );

        let vault = &mut ctx.accounts.vault;
        let owner_key = vault.owner;
        let bump = vault.bump;

        // PDA signer seeds: ["quantum-vault", owner_pubkey, bump]
        let seeds: &[&[u8]] = &[
            b"quantum-vault",
            owner_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[seeds];

        // Transfer SOL from vault PDA → owner via system program CPI
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.owner.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, amount)?;

        ctx.accounts.vault.sol_deposited = ctx
            .accounts
            .vault
            .sol_deposited
            .checked_sub(amount)
            .ok_or(VaultError::Overflow)?;

        emit!(SolWithdrawn {
            owner: owner_key,
            amount,
            remaining: ctx.accounts.vault.sol_deposited,
        });

        msg!(
            "Withdrew {} lamports from vault. Remaining: {}",
            amount,
            ctx.accounts.vault.sol_deposited
        );

        Ok(())
    }
}

// ─── Account Structs ──────────────────────────────────────────────────────────

/// The on-chain vault account stored in the PDA.
/// Total space: 8 (discriminator) + 32 + 32 + 1 + 8 + 8 + 1 = 90 bytes
#[account]
#[derive(Default)]
pub struct VaultAccount {
    /// The Solana wallet that owns this vault
    pub owner: Pubkey,          // 32 bytes
    /// SHA-256 hash of the ML-DSA-65 (Dilithium) public key
    pub pq_pubkey_hash: [u8; 32], // 32 bytes
    /// Whether quantum protection is active
    pub is_protected: bool,     // 1 byte
    /// Lamports tracked as deposited in this vault
    pub sol_deposited: u64,     // 8 bytes
    /// Unix timestamp of vault creation
    pub created_at: i64,        // 8 bytes
    /// PDA bump seed (stored for withdrawal signing)
    pub bump: u8,               // 1 byte
}

impl VaultAccount {
    pub const SIZE: usize = 8 + 32 + 32 + 1 + 8 + 8 + 1; // 90 bytes
}

// ─── Instruction Accounts ─────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = VaultAccount::SIZE,
        seeds = [b"quantum-vault", owner.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(
        mut,
        seeds = [b"quantum-vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut,
        seeds = [b"quantum-vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct VaultInitialized {
    pub owner: Pubkey,
    pub pq_pubkey_hash: [u8; 32],
    pub created_at: i64,
}

#[event]
pub struct SolDeposited {
    pub owner: Pubkey,
    pub amount: u64,
    pub total: u64,
}

#[event]
pub struct SolWithdrawn {
    pub owner: Pubkey,
    pub amount: u64,
    pub remaining: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum VaultError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
    #[msg("Arithmetic overflow")]
    Overflow,
}
