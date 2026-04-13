"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from "@/lib/solana";

interface ConnectWalletProps {
  variant?: "hero" | "nav";
}

export default function ConnectWallet({ variant = "hero" }: ConnectWalletProps) {
  const { setVisible } = useWalletModal();
  const { connected, publicKey, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-mono text-emerald-300">
            {shortenAddress(publicKey.toBase58())}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <button
        id="connect-wallet-hero"
        onClick={() => setVisible(true)}
        className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
        }}
      >
        {/* Shimmer overlay */}
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #60a5fa 50%, #22d3ee 100%)",
          }}
        />
        <span className="relative flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 7.5V6.75A3.75 3.75 0 0017.25 3H6.75A3.75 3.75 0 003 6.75v10.5A3.75 3.75 0 006.75 21h10.5A3.75 3.75 0 0021 17.25V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M22.5 12H15a1.5 1.5 0 000 3h7.5V12z" fill="white" opacity="0.8"/>
            <circle cx="15.75" cy="13.5" r="0.75" fill="white"/>
          </svg>
          Connect Phantom Wallet
        </span>
      </button>
    );
  }

  return (
    <button
      id="connect-wallet-nav"
      onClick={() => setVisible(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5"/>
        <path d="M16 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" fill="white"/>
      </svg>
      Connect Wallet
    </button>
  );
}
