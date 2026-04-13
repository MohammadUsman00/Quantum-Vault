"use client";

// Force dynamic rendering — vault page requires wallet/browser APIs
export const dynamic = "force-dynamic";


import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import VaultDashboard from "@/components/VaultDashboard";
import ConnectWallet from "@/components/ConnectWallet";

export default function VaultPage() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Redirecting...</div>
      </div>
    );
  }

  return (
    <>
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5"
        style={{ background: "rgba(2,8,23,0.8)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 font-bold text-white hover:text-violet-300 transition-colors">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              <span className="text-sm">⚛️</span>
            </div>
            Quantum Vault
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Solana Devnet
            </span>
            <ConnectWallet variant="nav" />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10">
        <VaultDashboard />
      </main>
    </>
  );
}
