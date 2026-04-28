"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";
import {
  generatePQKeypair,
  createBindingChallenge,
  signBindingChallenge,
  verifyBindingChallenge,
  hashPQPublicKey,
  loadPQKeys,
  storePQKeys,
  type PQKeypair,
} from "@/lib/pq-crypto";
import {
  initializeVault,
  depositSol,
  getVaultPDA,
  getVaultAccount,
} from "@/lib/vault-program";
import { explorerLink } from "@/lib/solana";

// ─── Step Definitions ─────────────────────────────────────────────────────────

interface Step {
  id: number;
  label: string;
  description: string;
  status: "pending" | "active" | "done" | "error";
  txSig?: string;
}

const INITIAL_STEPS: Step[] = [
  { id: 1, label: "Generate PQ Keys", description: "Generating ML-DSA-65 (Dilithium) keypair...", status: "pending" },
  { id: 2, label: "Create Binding Proof", description: "Signing wallet address with post-quantum key...", status: "pending" },
  { id: 3, label: "Verify Binding", description: "Verifying quantum-safe binding is valid...", status: "pending" },
  { id: 4, label: "Hash PQ Public Key", description: "Computing SHA-256 hash for on-chain storage...", status: "pending" },
  { id: 5, label: "Initialize Vault", description: "Creating vault PDA on Solana devnet...", status: "pending" },
  { id: 6, label: "Deposit SOL", description: "Migrating assets into quantum-safe vault...", status: "pending" },
  { id: 7, label: "Secure Keys", description: "Saving PQ keys to secure local storage...", status: "pending" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProtectButtonProps {
  depositAmountSOL: number;
  onProtectionComplete: (keys: PQKeypair, vaultAddress: string) => void;
  isProtected: boolean;
  onWithdraw?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProtectButton({
  depositAmountSOL,
  onProtectionComplete,
  isProtected,
  onWithdraw,
  disabled = false,
  disabledReason,
}: ProtectButtonProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const updateStep = useCallback(
    (id: number, patch: Partial<Step>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const toHex = (bytes: Uint8Array | number[]) =>
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const handleProtect = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      setError("Please connect your Phantom wallet first.");
      return;
    }

    setError(null);
    setIsRunning(true);
    setShowProgress(true);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));

    // Create wallet adapter compatible with Anchor
    // Cast as Wallet — payer is optional in Anchor's Wallet interface
    const anchorWallet = {
      publicKey,
      signTransaction,
      signAllTransactions,
    } as unknown as Wallet;

    try {
      const existingVault = await getVaultAccount(connection, publicKey);
      let pqKeys: PQKeypair;
      let isNewKeypair = false;

      // ── Step 1: Generate or recover PQ Keypair ───────────────────────────
      updateStep(1, { status: "active" });
      await sleep(400); // Allow UI to render
      if (existingVault) {
        const storedKeys = loadPQKeys();
        if (!storedKeys) {
          throw new Error(
            "Vault already exists on-chain, but this browser has no matching PQ key backup. Restore the original browser backup to continue."
          );
        }

        const localHash = await hashPQPublicKey(storedKeys.publicKey);
        const onChainHash = new Uint8Array(existingVault.pqPubkeyHash);
        if (toHex(localHash) !== toHex(onChainHash)) {
          throw new Error(
            "Stored PQ key does not match the on-chain vault hash. Use the original PQ key backup used during first protection."
          );
        }

        pqKeys = storedKeys;
      } else {
        pqKeys = generatePQKeypair();
        isNewKeypair = true;
      }
      updateStep(1, { status: "done" });

      // ── Step 2: Sign Wallet Address ──────────────────────────────────────
      updateStep(2, { status: "active" });
      await sleep(300);
      const walletAddress = publicKey.toBase58();
      const bindingChallenge = createBindingChallenge({
        walletAddress,
        action: "protect",
      });
      const signature = signBindingChallenge(pqKeys.secretKey, bindingChallenge);
      updateStep(2, { status: "done" });

      // ── Step 3: Verify Binding ───────────────────────────────────────────
      updateStep(3, { status: "active" });
      await sleep(200);
      const isValid = verifyBindingChallenge(
        pqKeys.publicKey,
        bindingChallenge,
        signature
      );
      if (!isValid) throw new Error("Binding proof verification failed");
      updateStep(3, { status: "done" });

      // ── Step 4: Hash PQ Public Key ───────────────────────────────────────
      updateStep(4, { status: "active" });
      await sleep(200);
      const pqHash = await hashPQPublicKey(pqKeys.publicKey);
      updateStep(4, { status: "done" });

      // ── Step 5: Initialize Vault on-chain ────────────────────────────────
      const [vaultPDA] = await getVaultPDA(publicKey);
      const vaultAddress = vaultPDA.toBase58();
      if (existingVault) {
        updateStep(5, {
          status: "done",
          description: "Vault already initialized on-chain ✓",
        });
      } else {
        updateStep(5, {
          status: "active",
          description: "Sending transaction to Solana devnet...",
        });
        const initTxSig = await initializeVault(connection, anchorWallet, pqHash);
        updateStep(5, {
          status: "done",
          description: "Vault PDA created on-chain ✓",
          txSig: initTxSig,
        });
      }

      // ── Step 6: Deposit SOL ──────────────────────────────────────────────
      updateStep(6, { status: "active", description: `Depositing ${depositAmountSOL} SOL...` });
      if (depositAmountSOL > 0) {
        const lamports = Math.floor(depositAmountSOL * LAMPORTS_PER_SOL);
        const depositTxSig = await depositSol(connection, anchorWallet, lamports);
        updateStep(6, {
          status: "done",
          description: `${depositAmountSOL} SOL migrated to vault ✓`,
          txSig: depositTxSig,
        });
      } else {
        updateStep(6, { status: "done", description: "No SOL to deposit (amount = 0)" });
      }

      // ── Step 7: Store PQ Keys ────────────────────────────────────────────
      updateStep(7, { status: "active" });
      if (isNewKeypair) {
        await storePQKeys(pqKeys);
        await sleep(300);
        updateStep(7, { status: "done" });
      } else {
        await sleep(150);
        updateStep(7, {
          status: "done",
          description: "Using existing local PQ key backup ✓",
        });
      }

      // ── Complete ─────────────────────────────────────────────────────────
      onProtectionComplete(pqKeys, vaultAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      // Mark current active step as error
      setSteps((prev) =>
        prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s))
      );
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Protected State ──────────────────────────────────────────────────────

  if (isProtected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-emerald-500/30"
          style={{ background: "rgba(16,185,129,0.08)" }}>
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-300">Vault Active — Quantum Protected</p>
            <p className="text-xs text-emerald-500">Assets secured with ML-DSA-65 (CRYSTALS-Dilithium)</p>
          </div>
        </div>
        {onWithdraw && (
          <button
            onClick={onWithdraw}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-all border border-white/10"
          >
            Withdraw from Vault
          </button>
        )}
      </div>
    );
  }

  // ─── Unprotected State ────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Main button */}
      {!showProgress && (
        <button
          id="protect-now-btn"
          onClick={handleProtect}
          disabled={isRunning || !publicKey || disabled}
          className="group relative w-full py-4 rounded-2xl font-bold text-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/40"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 60%, #06b6d4 100%)",
          }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #60a5fa 60%, #22d3ee 100%)" }} />
          <span className="relative flex items-center justify-center gap-3">
            <span className="text-2xl">🔐</span>
            Protect Now
          </span>
        </button>
      )}

      {/* Progress steps */}
      {showProgress && (
        <div className="rounded-2xl border border-white/10 p-5 space-y-3"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            {isRunning ? "⚡ Activating Quantum Protection..." : "Protection Flow"}
          </h3>
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              {/* Status icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold transition-all duration-300 ${
                step.status === "done"
                  ? "bg-emerald-500 text-white"
                  : step.status === "active"
                  ? "bg-violet-500 text-white animate-pulse"
                  : step.status === "error"
                  ? "bg-red-500 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}>
                {step.status === "done" ? "✓"
                  : step.status === "error" ? "✗"
                  : step.status === "active" ? "⚡"
                  : step.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === "done" ? "text-emerald-300"
                  : step.status === "active" ? "text-white"
                  : step.status === "error" ? "text-red-400"
                  : "text-slate-500"
                }`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                {/* Transaction link */}
                {step.txSig && (
                  <a
                    href={explorerLink(step.txSig)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-1 transition-colors"
                  >
                    View on Explorer ↗
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Error display */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
              <p className="text-xs text-red-400">❌ {error}</p>
              <button
                onClick={() => {
                  setShowProgress(false);
                  setError(null);
                }}
                className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {!publicKey && (
        <p className="text-center text-xs text-slate-500">
          Connect your Phantom wallet to enable protection
        </p>
      )}
      {disabled && disabledReason && (
        <p className="text-center text-xs text-amber-300">
          {disabledReason}
        </p>
      )}
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
