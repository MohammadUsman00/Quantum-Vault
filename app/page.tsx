"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import ConnectWallet from "@/components/ConnectWallet";

const STATS = [
  { value: "100%", label: "of Solana wallets exposed", color: "#f87171" },
  { value: "40×", label: "larger PQ signatures", color: "#a78bfa" },
  { value: "$2.5T", label: "at risk globally", color: "#34d399" },
  { value: "2026", label: "estimated Q-Day timeline", color: "#60a5fa" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "🔑",
    title: "Generate PQ Keys",
    body: "We generate a CRYSTALS-Dilithium ML-DSA-65 keypair in your browser using @noble/post-quantum — a NIST-approved, audited library. Your secret key never leaves your device.",
  },
  {
    step: "02",
    icon: "🔗",
    title: "Bind to Your Wallet",
    body: "You sign your Solana public key with the Dilithium key, creating a cryptographic binding proof. This links your classical wallet to its quantum-safe identity.",
  },
  {
    step: "03",
    icon: "🛡️",
    title: "Vault on Solana",
    body: "A Program Derived Address vault is created on-chain via an Anchor smart contract. Your SOL migrates into this PDA — inaccessible to quantum attackers.",
  },
];

const TECH_STACK = [
  { name: "ML-DSA-65", desc: "FIPS 204 (Dilithium)", badge: "NIST APPROVED" },
  { name: "@noble/post-quantum", desc: "Audited PQ library", badge: "OPEN SOURCE" },
  { name: "Solana Anchor", desc: "On-chain smart contract", badge: "DEVNET" },
  { name: "Non-custodial", desc: "Your keys, your vault", badge: "NO CUSTODY" },
];

export default function HomePage() {
  const { connected } = useWallet();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && connected) {
      router.push("/vault");
    }
  }, [connected, mounted, router]);

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ─── Animated background ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(to right, rgba(124,58,237,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        {/* Orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] rounded-full opacity-8 blur-[80px]"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      </div>

      {/* ─── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            <span className="text-lg">⚛️</span>
          </div>
          <div>
            <span className="font-bold text-white text-lg">Quantum Vault</span>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">Solana Devnet</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="#how-it-works" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
            How it works
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.09.682-.218.682-.484 0-.236-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .269.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            GitHub
          </a>
          <ConnectWallet variant="nav" />
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-24 text-center">

        {/* Hackathon badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-violet-500/30"
          style={{ background: "rgba(124,58,237,0.1)" }}>
          <span className="text-sm">🏆</span>
          <span className="text-sm text-violet-300 font-medium">
            Solana Frontier Hackathon 2026 · Post-Quantum Track
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none mb-6 tracking-tight">
          <span className="text-white">Your Solana wallet is</span>
          <br />
          <span
            className="inline-block"
            style={{
              background: "linear-gradient(135deg, #f87171 0%, #f59e0b 50%, #ef4444 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            quantum-vulnerable.
          </span>
          <br />
          <span
            className="inline-block"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Fix it today.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Quantum Vault uses{" "}
          <span className="text-violet-300 font-semibold">NIST-approved CRYSTALS-Dilithium</span>{" "}
          post-quantum cryptography to protect your assets before{" "}
          <span className="text-amber-400 font-semibold">Q-Day</span> arrives.
          Real on-chain transactions. Real PQ cryptography.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <ConnectWallet variant="hero" />
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/15 text-slate-300 hover:text-white hover:border-white/30 transition-all text-lg font-medium"
          >
            Learn how it works
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </a>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(({ value, label, color }) => (
            <div key={label}
              className="p-5 rounded-2xl border border-white/8 backdrop-blur-sm text-center group hover:border-white/15 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs text-slate-500 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-3">
            The Protection Flow
          </p>
          <h2 className="text-4xl font-bold text-white">How Quantum Vault Works</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Three steps. Real cryptography. Real on-chain protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ step, icon, title, body }) => (
            <div key={step}
              className="relative p-6 rounded-3xl border border-white/10 group hover:border-violet-500/30 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              {/* Step number */}
              <div className="text-6xl font-black text-white/[0.04] absolute top-4 right-5 leading-none select-none">
                {step}
              </div>
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-bold text-white text-lg mb-3">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech Stack ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Built on Real Technology</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TECH_STACK.map(({ name, desc, badge }) => (
            <div key={name}
              className="p-4 rounded-2xl border border-white/10 group hover:border-violet-500/20 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-violet-400 mb-2">{badge}</div>
              <div className="text-sm font-bold text-white mb-1 font-mono">{name}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-10 rounded-3xl border border-violet-500/25"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)" }}>
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Don&apos;t wait for Q-Day
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Connect your Phantom wallet on Solana devnet and migrate your assets
            into a quantum-resistant vault in under 60 seconds.
          </p>
          <ConnectWallet variant="hero" />
          <p className="mt-4 text-xs text-slate-600">
            Solana Devnet only · No real funds at risk · Open source
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>⚛️</span>
            <span>Quantum Vault — Solana Frontier Hackathon 2026</span>
          </div>
          <div className="text-xs text-slate-600">
            CRYSTALS-Dilithium ML-DSA-65 · FIPS 204 · Anchor · Solana Devnet
          </div>
        </div>
      </footer>
    </div>
  );
}
