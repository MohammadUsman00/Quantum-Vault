"use client";

import { useEffect, useMemo, useState } from "react";

type Tone = "green" | "red";

export default function QuantumThreatSimulator() {
  const items = useMemo(
    () => [
      {
        title: "Classical Computer vs Ed25519",
        targetPercent: 5,
        label: "~15 Million Years",
        tone: "green" as Tone,
      },
      {
        title: "Quantum Computer (Shor's Algorithm) vs Ed25519",
        targetPercent: 90,
        label: "~Hours",
        tone: "red" as Tone,
      },
      {
        title: "Quantum Computer vs ML-DSA-65 (Your Vault)",
        targetPercent: 5,
        label: "SECURE ✅",
        tone: "green" as Tone,
      },
    ],
    []
  );

  // Start at 0% so CSS transitions animate to the target widths on mount.
  const [percents, setPercents] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    setPercents(items.map((i) => i.targetPercent));
  }, [items]);

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 -mt-10 mb-10">
      <div
        className="rounded-3xl border border-white/10 p-6 space-y-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Why post-quantum protection matters
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              A simple threat simulator to visualize time-to-break for classical vs
              quantum attackers.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const percent = percents[idx] ?? 0;
            const isGreen = item.tone === "green";

            const trackClass =
              "h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden";
            const fillClass = isGreen
              ? "bg-emerald-500/75"
              : "bg-red-500/75";

            const glowClass = isGreen
              ? "shadow-[0_0_20px_rgba(16,185,129,0.22)]"
              : "shadow-[0_0_20px_rgba(239,68,68,0.18)]";

            return (
              <div key={item.title} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-slate-200">{item.title}</p>
                  <p
                    className={`text-xs font-semibold ${
                      isGreen ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {item.label}
                  </p>
                </div>

                <div className={trackClass}>
                  <div
                    className={`${fillClass} h-full transition-[width] duration-1000 ease-out ${glowClass}`}
                    style={{ width: `${percent}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

