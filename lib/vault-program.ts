/**
 * vault-program.ts
 * ================
 * Anchor program client for the Quantum Vault on-chain program.
 *
 * This module wraps all interactions with the deployed quantum-vault
 * Anchor program on Solana devnet.
 *
 * ⚠️ After running `anchor deploy`, replace PROGRAM_ID below with
 *    the real program ID from the deploy output.
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { Wallet } from "@coral-xyz/anchor";
import IDL from "./idl/quantum_vault.json";
import { getProgramId } from "./config";


// ─── Program ID ───────────────────────────────────────────────────────────────
// Supports env override via NEXT_PUBLIC_QUANTUM_VAULT_PROGRAM_ID.
export const PROGRAM_ID = getProgramId();


// PDA seed prefix (must match lib.rs)
export const VAULT_SEED = Buffer.from("quantum-vault");
const IDL_WITH_ADDRESS = {
  ...(IDL as Record<string, unknown>),
  address: PROGRAM_ID.toBase58(),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultAccount {
  owner: PublicKey;
  pqPubkeyHash: number[];
  isProtected: boolean;
  solDeposited: BN;
  createdAt: BN;
  bump: number;
}

// ─── PDA Helper ───────────────────────────────────────────────────────────────

/**
 * Derive the vault PDA for a given owner public key.
 *
 * PDA seed: ["quantum-vault", ownerPubkey]
 *
 * @returns [vaultPDA, bump]
 */
export async function getVaultPDA(
  ownerPubkey: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, ownerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Program Client Factory ───────────────────────────────────────────────────

/**
 * Create an Anchor program client using the connected wallet adapter.
 *
 * @param connection Solana connection (devnet)
 * @param wallet     Wallet adapter with signTransaction/signAllTransactions
 * @returns          Anchor Program instance
 */
function getProgram(
  connection: Connection,
  wallet: Wallet
): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  // Provide address explicitly in the IDL object to avoid runtime resolution issues.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL_WITH_ADDRESS as any, provider);
}

// ─── Initialize Vault ─────────────────────────────────────────────────────────

/**
 * Call `initialize_vault` on-chain.
 *
 * Creates a new PDA vault account bound to the owner's wallet and
 * stores the SHA-256 hash of their ML-DSA-65 public key.
 *
 * @param connection    Solana devnet connection
 * @param wallet        Connected wallet (must sign)
 * @param pqPubkeyHash  32-byte SHA-256 hash of PQ public key
 * @returns             Transaction signature
 */
export async function initializeVault(
  connection: Connection,
  wallet: Wallet,
  pqPubkeyHash: Uint8Array
): Promise<string> {
  const program = getProgram(connection, wallet);
  const ownerPubkey = wallet.publicKey;

  if (!ownerPubkey) throw new Error("Wallet not connected");

  const [vaultPDA] = await getVaultPDA(ownerPubkey);

  // Convert Uint8Array[32] to number[] for Anchor
  const hashArray = Array.from(pqPubkeyHash);

  const txSig = await program.methods
    .initializeVault(hashArray)
    .accounts({
      vault: vaultPDA,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("initializeVault tx:", txSig);
  return txSig;
}

// ─── Deposit SOL ─────────────────────────────────────────────────────────────

/**
 * Call `deposit_sol` on-chain.
 *
 * Transfers SOL from the owner's wallet into the vault PDA.
 *
 * @param connection  Solana devnet connection
 * @param wallet      Connected wallet (must sign)
 * @param lamports    Amount to deposit in lamports
 * @returns           Transaction signature
 */
export async function depositSol(
  connection: Connection,
  wallet: Wallet,
  lamports: number
): Promise<string> {
  const program = getProgram(connection, wallet);
  const ownerPubkey = wallet.publicKey;

  if (!ownerPubkey) throw new Error("Wallet not connected");

  const [vaultPDA] = await getVaultPDA(ownerPubkey);

  const txSig = await program.methods
    .depositSol(new BN(lamports))
    .accounts({
      vault: vaultPDA,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("depositSol tx:", txSig);
  return txSig;
}

// ─── Withdraw SOL ────────────────────────────────────────────────────────────

/**
 * Call `withdraw_sol` on-chain.
 *
 * Transfers SOL back from the vault PDA to the owner's wallet.
 *
 * @param connection  Solana devnet connection
 * @param wallet      Connected wallet (must sign)
 * @param lamports    Amount to withdraw in lamports
 * @returns           Transaction signature
 */
export async function withdrawSol(
  connection: Connection,
  wallet: Wallet,
  lamports: number
): Promise<string> {
  const program = getProgram(connection, wallet);
  const ownerPubkey = wallet.publicKey;

  if (!ownerPubkey) throw new Error("Wallet not connected");

  const [vaultPDA] = await getVaultPDA(ownerPubkey);

  const txSig = await program.methods
    .withdrawSol(new BN(lamports))
    .accounts({
      vault: vaultPDA,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("withdrawSol tx:", txSig);
  return txSig;
}

// ─── Read Vault Account ───────────────────────────────────────────────────────

/**
 * Fetch and decode the VaultAccount from the PDA.
 *
 * @returns VaultAccount data, or null if vault doesn't exist yet
 */
export async function getVaultAccount(
  connection: Connection,
  ownerPubkey: PublicKey
): Promise<VaultAccount | null> {
  try {
    // Create a read-only provider (no signing needed for reads)
    const dummyWallet = {
      publicKey: ownerPubkey,
      signTransaction: async (tx: Transaction) => tx,
      signAllTransactions: async (txs: Transaction[]) => txs,
    };
    const provider = new AnchorProvider(connection, dummyWallet as Wallet, {
      commitment: "confirmed",
    });
    // Keep explicit address in the IDL object here as well.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(IDL_WITH_ADDRESS as any, provider);

    const [vaultPDA] = await getVaultPDA(ownerPubkey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (program.account as any).vaultAccount.fetch(vaultPDA) as VaultAccount;
    return account;
  } catch {
    // Vault doesn't exist yet
    return null;
  }
}

// ─── SOL Conversion Helper ───────────────────────────────────────────────────

export function solToLamportsBN(sol: number): BN {
  return new BN(Math.floor(sol * LAMPORTS_PER_SOL));
}

export function lamportsBNToSol(lamports: BN): number {
  return lamports.toNumber() / LAMPORTS_PER_SOL;
}

// ─── Program Status ───────────────────────────────────────────────────────────

/**
 * Check if the vault program is deployed and accessible on devnet.
 */
export async function isProgramDeployed(
  connection: Connection
): Promise<boolean> {
  try {
    const info = await connection.getAccountInfo(PROGRAM_ID);
    return info !== null && info.executable;
  } catch {
    return false;
  }
}
