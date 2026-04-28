import { PublicKey } from "@solana/web3.js";

const DEFAULT_RPC_ENDPOINT = "https://api.devnet.solana.com";
const DEFAULT_PROGRAM_ID = "6tLhtJ5vr4R2KF4xoDodQmuWKvGPm1orXRqvtTNy5P3t";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getDevnetRpcEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (!configured) return DEFAULT_RPC_ENDPOINT;
  if (!isValidHttpUrl(configured)) {
    console.warn("Invalid NEXT_PUBLIC_SOLANA_RPC_URL. Falling back to devnet default RPC.");
    return DEFAULT_RPC_ENDPOINT;
  }
  return configured;
}

export function getProgramId(): PublicKey {
  const configured = process.env.NEXT_PUBLIC_QUANTUM_VAULT_PROGRAM_ID?.trim();
  const candidate = configured || DEFAULT_PROGRAM_ID;

  try {
    return new PublicKey(candidate);
  } catch {
    console.warn("Invalid NEXT_PUBLIC_QUANTUM_VAULT_PROGRAM_ID. Falling back to bundled program ID.");
    return new PublicKey(DEFAULT_PROGRAM_ID);
  }
}
