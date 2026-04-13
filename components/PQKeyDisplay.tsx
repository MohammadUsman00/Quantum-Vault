"use client";

import { useState } from "react";
import { PQ_ALGORITHM, PQ_KEY_SIZES, CLASSICAL_KEY_SIZES } from "@/lib/pq-crypto";

interface PQKeyDisplayProps {
  publicKey?: Uint8Array;
  fingerprint?: string;
  isProtected: boolean;
  bindingVerified?: boolean;
  createdAt?: number;
}

function bytesToHex(bytes: Uint8Array, count = 32): string {
  return Array.from(bytes.slice(0, count))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

export default function PQKeyDisplay({
  publicKey,
  fingerprint,
  isProtected,
  bindingVerified = false,
  createdAt,
}: PQKeyDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isProtected || !publicKey || !fingerprint) {
    return (
      <div className="rounded-2xl border border-white/10 p-6"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">Post-Quantum Key</h3>
            <p className="text-xs text-slate-500">Not yet generated</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 flex items-start gap-2">
            <span className="text-base">⚡</span>
            <span>
              Your wallet uses Ed25519 — vulnerable to quantum computers with ~4,000 logical qubits.
              Click <strong>"Protect Now"</strong> to generate your Dilithium keys.
            </span>
          </p>
        </div>
        {/* Comparison table */}
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Algorithm comparison</p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="text-slate-500">Property</div>
            <div className="text-slate-400 font-medium">Ed25519 (current)</div>
            <div className="text-violet-400 font-medium">ML-DSA-65</div>
            <div className="text-slate-500">Public key</div>
            <div className="text-red-400">{CLASSICAL_KEY_SIZES.publicKey}B ⚠️</div>
            <div className="text-emerald-400">{PQ_KEY_SIZES.publicKey}B ✓</div>
            <div className="text-slate-500">Signature</div>
            <div className="text-red-400">{CLASSICAL_KEY_SIZES.signature}B ⚠️</div>
            <div className="text-emerald-400">{PQ_KEY_SIZES.signature}B ✓</div>
            <div className="text-slate-500">Quantum safe</div>
            <div className="text-red-400">No ✗</div>
            <div className="text-emerald-400">Yes ✓</div>
          </div>
        </div>
      </div>
    );
  }

  const hexPreview = bytesToHex(publicKey, 20);

  return (
    <div className="rounded-2xl border border-violet-500/30 p-6 transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(59,130,246,0.05) 100%)",
      }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Post-Quantum Key</h3>
            <p className="text-xs text-violet-400">{PQ_ALGORITHM}</p>
          </div>
        </div>
        {bindingVerified && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            ✓ VERIFIED
          </span>
        )}
      </div>

      {/* Fingerprint */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Key Fingerprint</p>
        <div className="flex items-center gap-2">
          <code className="text-lg font-mono font-bold tracking-wider text-violet-300">
            {fingerprint}
          </code>
          <span className="text-[10px] text-slate-500">(first 8 bytes)</span>
        </div>
      </div>

      {/* Public key preview */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
          Public Key Preview
          <span className="ml-2 normal-case text-slate-600">({PQ_KEY_SIZES.publicKey} bytes total)</span>
        </p>
        <div className="p-3 rounded-xl bg-black/30 border border-white/5">
          <code className="text-[11px] font-mono text-slate-300 break-all">
            {expanded ? bytesToHex(publicKey, 64) : hexPreview}
            <span className="text-slate-500">...</span>
          </code>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
        >
          {expanded ? "Show less" : "Show more bytes"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <p className="text-[10px] text-slate-500 mb-0.5">Security Level</p>
          <p className="text-sm font-semibold text-white">NIST Level 3</p>
          <p className="text-[10px] text-slate-500">≈ AES-192</p>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <p className="text-[10px] text-slate-500 mb-0.5">Standard</p>
          <p className="text-sm font-semibold text-white">FIPS 204</p>
          <p className="text-[10px] text-slate-500">NIST approved 2024</p>
        </div>
      </div>

      {createdAt && (
        <p className="mt-3 text-[10px] text-slate-500 text-right">
          Generated {new Date(createdAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
