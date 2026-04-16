"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";
import { getSOLBalance, getSPLTokens, requestAirdrop, explorerLink, shortenAddress } from "@/lib/solana";
import {
  loadPQKeys,
  loadStoredKeyMeta,
  getPQKeyFingerprint,
  calculateRiskScore,
  signWalletAddress,
  verifyBinding,
  type PQKeypair,
} from "@/lib/pq-crypto";
import { getVaultPDA, getVaultAccount, lamportsBNToSol, withdrawSol } from "@/lib/vault-program";
import QuantumRiskScore from "./QuantumRiskScore";
import PQKeyDisplay from "./PQKeyDisplay";
import AssetList from "./AssetList";
import ProtectButton from "./ProtectButton";
import type { SPLToken } from "@/lib/solana";

export default function VaultDashboard() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [solBalance, setSolBalance] = useState(0);
  const [splTokens, setSplTokens] = useState<SPLToken[]>([]);
  const [vaultSolBalance, setVaultSolBalance] = useState(0);
  const [vaultAddress, setVaultAddress] = useState<string | undefined>();
  const [isProtected, setIsProtected] = useState(false);
  const [pqKeys, setPqKeys] = useState<PQKeypair | null>(null);
  const [pqFingerprint, setPqFingerprint] = useState<string | undefined>();
  const [pqCreatedAt, setPqCreatedAt] = useState<number | undefined>();
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [isLoading, setIsLoading] = useState(true);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropSig, setAirdropSig] = useState<string | null>(null);
  const [airdropError, setAirdropError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("0.1");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSig, setWithdrawSig] = useState<string | null>(null);
  const [isPqBindingVerified, setIsPqBindingVerified] = useState(false);
  const [isPqBindingChecking, setIsPqBindingChecking] = useState(false);
  // Avoid calling Date.now() during render to prevent hydration mismatches.
  const [lastRefresh, setLastRefresh] = useState(0);

  // ─── Load all data ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);

    try {
      // Load wallet data in parallel
      const [bal, tokens] = await Promise.all([
        getSOLBalance(connection, publicKey),
        getSPLTokens(connection, publicKey),
      ]);
      setSolBalance(bal);
      setSplTokens(tokens);

      // Check vault PDA
      const [vaultPDA] = await getVaultPDA(publicKey);
      setVaultAddress(vaultPDA.toBase58());

      const vaultAcc = await getVaultAccount(connection, publicKey);
      if (vaultAcc) {
        setIsProtected(vaultAcc.isProtected);
        setVaultSolBalance(lamportsBNToSol(vaultAcc.solDeposited));
      }

      // Load PQ keys from localStorage
      const storedKeys = loadPQKeys();
      const storedMeta = loadStoredKeyMeta();
      if (storedKeys) {
        setPqKeys(storedKeys);
        setPqFingerprint(getPQKeyFingerprint(storedKeys.publicKey));
        if (storedMeta) setPqCreatedAt(storedMeta.createdAt);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    loadData();
  }, [loadData, lastRefresh]);

  useEffect(() => {
    // Trigger initial data load after hydration.
    setLastRefresh(Date.now());
  }, []);

  // ─── Client-side PQ binding gate (session) ────────────────────────────────
  useEffect(() => {
    if (!isProtected || !publicKey || !pqKeys) {
      setIsPqBindingChecking(false);
      setIsPqBindingVerified(false);
      return;
    }

    setIsPqBindingChecking(true);
    try {
      const walletAddress = publicKey.toBase58();
      const bindingProof = signWalletAddress(pqKeys.secretKey, walletAddress);
      const validBinding = verifyBinding(pqKeys.publicKey, walletAddress, bindingProof);
      setIsPqBindingVerified(validBinding);
    } catch (e) {
      console.error("PQ binding verification failed:", e);
      setIsPqBindingVerified(false);
    } finally {
      setIsPqBindingChecking(false);
    }
  }, [isProtected, pqKeys, publicKey]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleProtectionComplete = useCallback(
    (keys: PQKeypair, vault: string) => {
      setPqKeys(keys);
      setPqFingerprint(getPQKeyFingerprint(keys.publicKey));
      setPqCreatedAt(Date.now());
      setVaultAddress(vault);
      setIsProtected(true);
      // Refresh balances after protection
      setTimeout(() => setLastRefresh(Date.now()), 2000);
    },
    []
  );

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setIsAirdropping(true);
    setAirdropSig(null);
    setAirdropError(null);
    let sig: string | null = null;
    let lastError: string | null = null;
    let lastStatus: number | undefined;
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await requestAirdrop(connection, publicKey, 2);
      if (res.sig) {
        sig = res.sig;
        break;
      }

      lastError = res.error;
      lastStatus = res.status;

      // Devnet faucets often rate-limit: back off much longer to avoid spam.
      const backoffMs =
        lastStatus === 429
          ? 15000 * attempt
          : 1500 * attempt;

      await new Promise((r) => setTimeout(r, backoffMs));
    }

    setAirdropSig(sig);
    setIsAirdropping(false);
    if (sig) {
      setTimeout(() => setLastRefresh(Date.now()), 2000);
    } else {
      if (lastStatus === 429) {
        setAirdropError(
          "Devnet faucet is rate-limited (429). Waiting longer is required. Try again in about 2-3 minutes."
        );
      } else {
        setAirdropError(
          `Devnet faucet request failed${lastError ? `: ${lastError}` : ""}. Wait a bit and try again.`
        );
      }
    }
  };

  const handleWithdraw = useCallback(async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      setWithdrawError("Connect a wallet that supports transaction signing.");
      return;
    }
    if (!isProtected) {
      setWithdrawError("Activate protection before withdrawing.");
      return;
    }
    if (!isPqBindingVerified) {
      setWithdrawError("PQ binding is not verified in this session. Activate protection again to unlock withdrawals.");
      return;
    }
    if (!pqKeys) {
      setWithdrawError("PQ keys not found in this browser.");
      return;
    }

    const amountSol = Number.parseFloat(withdrawAmount);
    if (!Number.isFinite(amountSol) || amountSol <= 0) {
      setWithdrawError("Enter a valid withdraw amount.");
      return;
    }
    if (amountSol > vaultSolBalance) {
      setWithdrawError("Withdraw amount exceeds vault balance.");
      return;
    }

    setWithdrawError(null);
    setWithdrawSig(null);
    setIsWithdrawing(true);
    try {
      // Client-side PQ possession check for the demo flow.
      const walletAddress = publicKey.toBase58();
      const bindingProof = signWalletAddress(pqKeys.secretKey, walletAddress);
      const validBinding = verifyBinding(pqKeys.publicKey, walletAddress, bindingProof);
      if (!validBinding) {
        throw new Error("PQ binding verification failed in this session.");
      }

      const anchorWallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      } as unknown as Wallet;

      const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
      const txSig = await withdrawSol(connection, anchorWallet, lamports);
      setWithdrawSig(txSig);
      setTimeout(() => setLastRefresh(Date.now()), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Withdraw failed. Please try again.";
      setWithdrawError(`Withdraw failed: ${message}`);
    } finally {
      setIsWithdrawing(false);
    }
  }, [
    connection,
    isProtected,
    isPqBindingVerified,
    pqKeys,
    publicKey,
    signAllTransactions,
    signTransaction,
    vaultSolBalance,
    withdrawAmount,
  ]);

  // ─── Risk Score ────────────────────────────────────────────────────────────

  const riskScore = calculateRiskScore({
    solBalance,
    hasSplTokens: splTokens.length > 0,
    vaultActive: isProtected,
    pqBindingVerified: isPqBindingVerified,
  });

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Connect your wallet</h2>
        <p className="text-slate-400 text-sm">Connect Phantom on devnet to view your vault</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto space-y-8">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🛡️ Quantum Vault Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            <span className="font-mono text-violet-300">{shortenAddress(publicKey.toBase58(), 6)}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="text-emerald-400">devnet</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Airdrop button */}
          <button
            onClick={handleAirdrop}
            disabled={isAirdropping}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-white/10 disabled:opacity-50"
          >
            {isAirdropping ? (
              <><span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> Airdropping...</>
            ) : (
              <><span>🪂</span> Get 2 SOL (devnet)</>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={() => setLastRefresh(Date.now())}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-white/10"
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={isLoading ? "animate-spin" : ""}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Airdrop success */}
      {airdropSig && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
          <span className="text-sm text-emerald-300">🎉 2 SOL airdropped!</span>
          <a href={explorerLink(airdropSig)} target="_blank" rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300">View on Explorer ↗</a>
        </div>
      )}

      {/* Airdrop error */}
      {airdropError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
          <span className="text-red-300 mt-0.5">❌</span>
          <div className="space-y-1">
            <p className="text-xs text-red-400">{airdropError}</p>
            <p className="text-[11px] text-slate-500">
              If it keeps failing, your devnet RPC may be rate-limited. Wait and retry.
            </p>
          </div>
        </div>
      )}

      {/* ─── Top: Risk Score + PQ Key ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuantumRiskScore
          score={riskScore}
          isProtected={isProtected}
          isLoading={isLoading}
        />
        <PQKeyDisplay
          publicKey={pqKeys?.publicKey}
          fingerprint={pqFingerprint}
          isProtected={isProtected}
          bindingVerified={isPqBindingVerified}
          createdAt={pqCreatedAt}
        />
      </div>

      {/* ─── Middle: Asset List ──────────────────────────────────────────── */}
      <AssetList
        walletAddress={publicKey.toBase58()}
        solBalance={solBalance}
        splTokens={splTokens}
        vaultAddress={vaultAddress}
        vaultSolBalance={vaultSolBalance}
        isProtected={isProtected}
        isLoading={isLoading}
      />

      {/* ─── Bottom: Protect Button ──────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 p-6 space-y-5"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(0,0,0,0) 100%)" }}>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">
            {isProtected ? "Vault Status" : "Activate Quantum Protection"}
          </h2>
          {!isProtected && (
            <p className="text-sm text-slate-400">
              Move SOL into a quantum-resistant Program Derived Address vault secured by ML-DSA-65.
            </p>
          )}
        </div>

        {/* Deposit amount input */}
        {!isProtected && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 block">
                Amount to protect (SOL)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/10 focus-within:border-violet-500/50 transition-colors">
                <input
                  type="number"
                  id="deposit-amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  max={Math.max(0, solBalance - 0.01).toFixed(4)}
                  step="0.01"
                  className="flex-1 bg-transparent text-white font-mono text-lg font-semibold outline-none appearance-none"
                  placeholder="0.1"
                />
                <span className="text-slate-400 font-medium">SOL</span>
              </div>
            </div>
            <div className="pt-6 flex gap-2">
              {["0.1", "0.5", "1.0"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDepositAmount(preset)}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 transition-all border border-white/10 hover:border-violet-500/40"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <ProtectButton
          depositAmountSOL={parseFloat(depositAmount) || 0}
          onProtectionComplete={handleProtectionComplete}
          isProtected={isProtected}
        />

        {isProtected && (
          <div className="rounded-2xl border border-white/10 p-4 bg-black/25 space-y-3">
            <p className="text-xs text-slate-400">
              Withdrawals are signed by your Solana wallet on-chain. Quantum Vault also checks PQ key possession in-browser before submitting the transaction.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Withdraw amount (SOL)
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/10 focus-within:border-violet-500/50 transition-colors">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="0"
                    max={vaultSolBalance.toFixed(4)}
                    step="0.01"
                    className="flex-1 bg-transparent text-white font-mono text-lg font-semibold outline-none appearance-none"
                    placeholder="0.1"
                  />
                  <span className="text-slate-400 font-medium">SOL</span>
                </div>
              </div>
              {isPqBindingVerified ? (
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || vaultSolBalance <= 0}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      Withdrawing...
                    </span>
                  ) : (
                    "Withdraw SOL"
                  )}
                </button>
              ) : isPqBindingChecking ? (
                <div className="px-4 py-3 rounded-xl bg-slate-800/40 border border-white/10 text-slate-500 text-sm font-medium flex items-center">
                  <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying PQ binding...
                </div>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm font-medium flex items-start">
                  <div className="mt-0.5 mr-2">⚠️</div>
                  <div className="leading-tight">
                    PQ binding not verified in this session.
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Click <span className="text-slate-200 font-semibold">Protect Now</span> again to re-generate and verify the PQ binding.
                    </div>
                  </div>
                </div>
              )}
            </div>
            {withdrawSig && (
              <a
                href={explorerLink(withdrawSig)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:text-violet-300"
              >
                View withdraw transaction on Explorer ↗
              </a>
            )}
            {withdrawError && (
              <p className="text-xs text-red-400">{withdrawError}</p>
            )}
          </div>
        )}

        {/* PQ key backup warning */}
        {isProtected && pqKeys && (
          <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <p className="text-xs text-amber-400 flex items-start gap-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>
                <strong>Back up your PQ secret key!</strong> Your ML-DSA-65 secret key is stored
                in browser localStorage only. If you clear your browser data, you will lose access
                to withdraw from your vault. Export and store your keys securely.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ─── Footer: Technical Details ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { label: "Algorithm", value: "ML-DSA-65" },
          { label: "Standard", value: "FIPS 204" },
          { label: "Network", value: "Devnet" },
          { label: "PQ Key Size", value: "1952B" },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-200 font-mono">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
