"use client";

import { explorerLink, lamportsToSol, shortenAddress } from "@/lib/solana";
import type { SPLToken } from "@/lib/solana";

interface AssetListProps {
  walletAddress?: string;
  solBalance: number;
  splTokens: SPLToken[];
  vaultAddress?: string;
  vaultSolBalance: number;
  isProtected: boolean;
  isLoading?: boolean;
}

export default function AssetList({
  walletAddress,
  solBalance,
  splTokens,
  vaultAddress,
  vaultSolBalance,
  isProtected,
  isLoading = false,
}: AssetListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ─── Current Wallet Card ─── */}
      <div className="rounded-2xl border border-white/10 p-5 transition-all"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#94a3b8" strokeWidth="1.5"/>
                <path d="M16 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" fill="#94a3b8"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Current Wallet</h3>
              <p className="text-[10px] text-slate-500">Phantom — Devnet</p>
            </div>
          </div>
          {/* Vulnerability badge */}
          <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 font-semibold">
            ⚠️ Ed25519
          </span>
        </div>

        {/* Address */}
        {walletAddress && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Address</p>
            <a
              href={explorerLink(walletAddress, "address")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-sm text-slate-300 hover:text-violet-300 transition-colors"
            >
              {shortenAddress(walletAddress, 8)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-50">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        )}

        {/* SOL Balance */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">SOL Balance</p>
          {isLoading ? (
            <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tabular-nums">
                {solBalance.toFixed(4)}
              </span>
              <span className="text-sm text-slate-400">SOL</span>
            </div>
          )}
        </div>

        {/* SPL Tokens */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">SPL Tokens</p>
          {splTokens.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No SPL tokens on devnet</p>
          ) : (
            <div className="space-y-1.5">
              {splTokens.slice(0, 3).map((token) => (
                <div key={token.mint} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">{shortenAddress(token.mint)}</span>
                  <span className="text-white font-medium">{token.amount.toFixed(2)}</span>
                </div>
              ))}
              {splTokens.length > 3 && (
                <p className="text-[11px] text-slate-500">+{splTokens.length - 3} more tokens</p>
              )}
            </div>
          )}
        </div>

        {/* Quantum warning */}
        <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
          <p className="text-[11px] text-red-400 flex items-start gap-1.5">
            <span>⚠️</span>
            <span>
              <strong>Quantum vulnerable:</strong> Ed25519 private key can be derived by a
              sufficiently powerful quantum computer using Shor&apos;s algorithm.
            </span>
          </p>
        </div>
      </div>

      {/* ─── Quantum Vault Card ─── */}
      <div
        className="rounded-2xl border p-5 transition-all"
        style={{
          background: isProtected
            ? "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)"
            : "rgba(255,255,255,0.02)",
          borderColor: isProtected ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isProtected
                  ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                  : "rgba(255,255,255,0.05)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  stroke={isProtected ? "white" : "#64748b"} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Quantum Vault</h3>
              <p className="text-[10px] text-slate-500">PDA — Program Derived Address</p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${
              isProtected
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {isProtected ? "✅ ACTIVE" : "⬜ INACTIVE"}
          </span>
        </div>

        {/* Vault address */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Vault Address</p>
          {vaultAddress ? (
            <a
              href={explorerLink(vaultAddress, "address")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-sm text-violet-300 hover:text-violet-200 transition-colors"
            >
              {shortenAddress(vaultAddress, 8)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-50">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
          ) : (
            <p className="text-sm text-slate-500 italic font-mono">Not created yet...</p>
          )}
        </div>

        {/* SOL in vault */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">SOL Protected</p>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: isProtected ? "#a78bfa" : "#475569" }}
            >
              {vaultSolBalance.toFixed(4)}
            </span>
            <span className="text-sm text-slate-400">SOL</span>
          </div>
        </div>

        {/* Status */}
        {isProtected ? (
          <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <p className="text-[11px] text-emerald-400 flex items-start gap-1.5">
              <span>🛡️</span>
              <span>
                <strong>Quantum-resistant:</strong> Protected by ML-DSA-65 (CRYSTALS-Dilithium).
                Assets secured on-chain via Program Derived Address.
              </span>
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <span>💡</span>
              <span>
                Click <strong>"Protect Now"</strong> to create your vault and migrate assets
                to quantum-safe storage.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
