/**
 * pq-crypto.ts
 * ============
 * Real post-quantum cryptography using @noble/post-quantum ml_dsa65
 * (CRYSTALS-Dilithium, FIPS-204 ML-DSA standard).
 *
 * This is the core security layer of Quantum Vault. Every function here
 * uses genuine PQ crypto — nothing is simulated.
 */

import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface PQKeypair {
  publicKey: Uint8Array; // 1952 bytes for ML-DSA-65
  secretKey: Uint8Array; // 4032 bytes for ML-DSA-65
}

export interface StoredPQKeys {
  publicKey: string; // base64
  secretKey: string; // base64
  algorithm: string;
  createdAt: number;
  fingerprint: string;
}

export interface BindingChallenge {
  version: "qv1";
  domain: "quantum-vault";
  chain: "solana-devnet";
  action: "protect" | "withdraw" | "session-check";
  walletAddress: string;
  vaultAddress?: string;
  amountLamports?: number;
  nonce: string;
  issuedAtMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "quantum_vault_pq_keys";
export const PQ_ALGORITHM = "ML-DSA-65 (CRYSTALS-Dilithium)";

// ─── Utility: Uint8Array ↔ base64 ─────────────────────────────────────────────

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomNonce(bytes = 16): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

// ─── SHA-256 (native Web Crypto) ──────────────────────────────────────────────

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Copy to a new ArrayBuffer to satisfy strict TypeScript's BufferSource constraint
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return new Uint8Array(hashBuffer);
}


// ─── Core PQ Functions ────────────────────────────────────────────────────────

/**
 * Generate a fresh ML-DSA-65 (Dilithium) keypair.
 *
 * @param seed  Optional 32-byte seed. If omitted, uses CSPRNG.
 * @returns     { publicKey: Uint8Array[1952], secretKey: Uint8Array[4032] }
 *
 * Security note: ML-DSA-65 offers NIST security level 3 (equivalent to
 * AES-192) against both classical and quantum adversaries.
 */
export function generatePQKeypair(seed?: Uint8Array): PQKeypair {
  const actualSeed =
    seed ?? crypto.getRandomValues(new Uint8Array(32));
  const keys = ml_dsa65.keygen(actualSeed);
  return {
    publicKey: keys.publicKey,
    secretKey: keys.secretKey,
  };
}

export function createBindingChallenge(params: {
  walletAddress: string;
  action: BindingChallenge["action"];
  vaultAddress?: string;
  amountLamports?: number;
}): BindingChallenge {
  return {
    version: "qv1",
    domain: "quantum-vault",
    chain: "solana-devnet",
    action: params.action,
    walletAddress: params.walletAddress,
    vaultAddress: params.vaultAddress,
    amountLamports: params.amountLamports,
    nonce: randomNonce(),
    issuedAtMs: Date.now(),
  };
}

export function encodeBindingChallenge(challenge: BindingChallenge): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(challenge));
}

export function signBindingChallenge(
  secretKey: Uint8Array,
  challenge: BindingChallenge
): Uint8Array {
  return ml_dsa65.sign(encodeBindingChallenge(challenge), secretKey);
}

export function verifyBindingChallenge(
  publicKey: Uint8Array,
  challenge: BindingChallenge,
  signature: Uint8Array,
  maxAgeMs = 5 * 60 * 1000
): boolean {
  try {
    if (Date.now() - challenge.issuedAtMs > maxAgeMs) return false;
    return ml_dsa65.verify(signature, encodeBindingChallenge(challenge), publicKey);
  } catch {
    return false;
  }
}

/**
 * Return displayable fingerprint: first 8 bytes of public key as hex.
 * Example: "a3f2b1c9d4e5f608"
 *
 * @param publicKey ML-DSA-65 public key
 * @returns         16-character lowercase hex string
 */
export function getPQKeyFingerprint(publicKey: Uint8Array): string {
  return toHex(publicKey.slice(0, 8));
}

/**
 * SHA-256 hash of the ML-DSA-65 public key.
 * This 32-byte hash is stored on-chain in the vault PDA account.
 * Storing the hash (not the full key) keeps on-chain data small.
 *
 * @param publicKey ML-DSA-65 public key (1952 bytes)
 * @returns         32-byte SHA-256 hash
 */
export async function hashPQPublicKey(
  publicKey: Uint8Array
): Promise<Uint8Array> {
  return sha256(publicKey);
}

// ─── localStorage Persistence ─────────────────────────────────────────────────

/**
 * Persist PQ keypair to localStorage (base64 encoded).
 *
 * ⚠️ SECURITY WARNING: This stores the secret key in localStorage.
 * Users MUST back up their keys. For production, use hardware-backed
 * key storage (e.g., WebAuthn) or split-key schemes.
 */
export async function storePQKeys(keys: PQKeypair): Promise<void> {
  const fingerprint = getPQKeyFingerprint(keys.publicKey);
  const stored: StoredPQKeys = {
    publicKey: toBase64(keys.publicKey),
    secretKey: toBase64(keys.secretKey),
    algorithm: PQ_ALGORITHM,
    createdAt: Date.now(),
    fingerprint,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

/**
 * Load PQ keypair from localStorage.
 *
 * @returns PQKeypair if found, null otherwise
 */
export function loadPQKeys(): PQKeypair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: StoredPQKeys = JSON.parse(raw);
    return {
      publicKey: fromBase64(stored.publicKey),
      secretKey: fromBase64(stored.secretKey),
    };
  } catch {
    return null;
  }
}

/**
 * Load stored key metadata (no secret key) for display purposes.
 */
export function loadStoredKeyMeta(): StoredPQKeys | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPQKeys;
  } catch {
    return null;
  }
}

/**
 * Clear all stored PQ keys from localStorage.
 */
export function clearPQKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Quantum Risk Score ───────────────────────────────────────────────────────

export interface RiskScoreParams {
  solBalance: number;     // in SOL
  hasSplTokens: boolean;
  vaultActive: boolean;
  pqBindingVerified: boolean;
}

/**
 * Calculate quantum risk score (0–100, higher = more risk).
 *
 * Algorithm:
 *   base = 75  (all Ed25519 wallets start vulnerable)
 *   +10 if SOL balance > 1 SOL (higher value target)
 *   +5  if has SPL tokens
 *   -60 if vault is created and active
 *   -10 if PQ binding proof verified
 *   clamped to [0, 100]
 */
export function calculateRiskScore(params: RiskScoreParams): number {
  let score = 75;

  if (params.solBalance > 1) score += 10;
  if (params.hasSplTokens) score += 5;
  if (params.vaultActive) score -= 60;
  if (params.pqBindingVerified) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get risk level label and color class from score.
 */
export function getRiskLevel(score: number): {
  label: string;
  color: "green" | "amber" | "red";
  description: string;
} {
  if (score <= 30) {
    return {
      label: "LOW RISK",
      color: "green",
      description: "Quantum-resistant vault active",
    };
  } else if (score <= 60) {
    return {
      label: "MODERATE RISK",
      color: "amber",
      description: "Partial protection — complete setup",
    };
  } else {
    return {
      label: "HIGH RISK",
      color: "red",
      description: "Wallet exposed to quantum attacks",
    };
  }
}

// ─── Key Size Info (for display) ──────────────────────────────────────────────

export const PQ_KEY_SIZES = {
  publicKey: 1952,   // bytes
  secretKey: 4032,   // bytes
  signature: 3309,   // bytes (approximate)
  seed: 32,          // bytes
} as const;

export const CLASSICAL_KEY_SIZES = {
  publicKey: 32,     // Ed25519 bytes
  privateKey: 64,    // bytes
  signature: 64,     // bytes
} as const;
