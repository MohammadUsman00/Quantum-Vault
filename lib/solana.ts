/**
 * solana.ts
 * =========
 * Solana web3.js helper utilities for Quantum Vault.
 * All operations target DEVNET only.
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  clusterApiUrl,
} from "@solana/web3.js";

// ─── Connection ───────────────────────────────────────────────────────────────

export const DEVNET_CONNECTION = new Connection(
  clusterApiUrl("devnet"),
  "confirmed"
);

// ─── SOL Balance ─────────────────────────────────────────────────────────────

/**
 * Get SOL balance for a wallet address (in SOL, not lamports).
 */
export async function getSOLBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const lamports = await connection.getBalance(publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

// ─── SPL Tokens ──────────────────────────────────────────────────────────────

export interface SPLToken {
  mint: string;
  amount: number;
  decimals: number;
  symbol?: string;
}

/**
 * Get all non-zero SPL token accounts for a wallet.
 */
export async function getSPLTokens(
  connection: Connection,
  publicKey: PublicKey
): Promise<SPLToken[]> {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") },
      "confirmed"
    );

    return tokenAccounts.value
      .map((account) => {
        const parsed = account.account.data as ParsedAccountData;
        const info = parsed.parsed?.info;
        return {
          mint: info?.mint ?? "",
          amount: Number(info?.tokenAmount?.uiAmount ?? 0),
          decimals: info?.tokenAmount?.decimals ?? 0,
        };
      })
      .filter((t) => t.amount > 0);
  } catch {
    return [];
  }
}

// ─── Airdrop ──────────────────────────────────────────────────────────────────

/**
 * Request a devnet airdrop of 2 SOL. Rate limited — may fail if called
 * too frequently. Only use on devnet.
 *
 * @returns transaction signature or null on failure
 */
export async function requestAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amountSOL: number = 2
): Promise<{ sig: string | null; error: string | null; status?: number }> {
  try {
    const sig = await connection.requestAirdrop(
      publicKey,
      amountSOL * LAMPORTS_PER_SOL
    );
    // Confirm the airdrop
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: sig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    return { sig, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Airdrop failed";
    console.error("Airdrop failed:", e);
    const status =
      message.includes("429") ? 429 : undefined;
    return {
      sig: null,
      error: message,
      status,
    };
  }
}

// ─── Address Formatting ───────────────────────────────────────────────────────

/**
 * Shorten a Solana address for display.
 * Example: "9xQe...3Kp7"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ─── Explorer Links ───────────────────────────────────────────────────────────

export type ExplorerType = "transaction" | "address" | "account";

/**
 * Build a Solana Explorer URL for devnet.
 */
export function explorerLink(
  value: string,
  type: ExplorerType = "transaction"
): string {
  const base = "https://explorer.solana.com";
  const cluster = "?cluster=devnet";

  switch (type) {
    case "transaction":
      return `${base}/tx/${value}${cluster}`;
    case "address":
    case "account":
      return `${base}/address/${value}${cluster}`;
    default:
      return `${base}/${value}${cluster}`;
  }
}

/**
 * Build a Solscan URL for devnet.
 */
export function solscanLink(
  value: string,
  type: ExplorerType = "transaction"
): string {
  const base = "https://solscan.io";
  const network = "?cluster=devnet";

  switch (type) {
    case "transaction":
      return `${base}/tx/${value}${network}`;
    case "address":
    case "account":
      return `${base}/account/${value}${network}`;
    default:
      return `${base}/${value}${network}`;
  }
}

// ─── Lamport Conversion ───────────────────────────────────────────────────────

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

// ─── Transaction Confirmation ─────────────────────────────────────────────────

/**
 * Wait for a transaction to confirm and return its result.
 */
export async function confirmTransaction(
  connection: Connection,
  signature: string
): Promise<boolean> {
  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    const result = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    return !result.value.err;
  } catch {
    return false;
  }
}
