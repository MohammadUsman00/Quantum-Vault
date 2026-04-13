"use client";

import { useEffect, useRef } from "react";
import { getRiskLevel } from "@/lib/pq-crypto";

interface QuantumRiskScoreProps {
  score: number;
  isProtected: boolean;
  isLoading?: boolean;
}

export default function QuantumRiskScore({
  score,
  isProtected,
  isLoading = false,
}: QuantumRiskScoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { label, color, description } = getRiskLevel(score);

  const colorMap = {
    green: { stroke: "#10b981", glow: "#10b981", text: "#34d399", bg: "rgba(16,185,129,0.1)" },
    amber: { stroke: "#f59e0b", glow: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.1)" },
    red:   { stroke: "#ef4444", glow: "#ef4444", text: "#f87171", bg: "rgba(239,68,68,0.1)" },
  };

  const palette = colorMap[color];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 220;
    canvas.width = size;
    canvas.height = size;

    const cx = size / 2;
    const cy = size / 2;
    const radius = 85;
    const lineWidth = 14;
    const startAngle = Math.PI * 0.75;  // 135°
    const totalArc = Math.PI * 1.5;      // 270° sweep

    // Animation
    let animProgress = 0;
    const targetProgress = score / 100;
    let animFrame: number;

    function draw(progress: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // Background track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      // Colored arc
      const endAngle = startAngle + totalArc * progress;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);

      // Gradient
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, color === "green" ? "#10b981" : color === "amber" ? "#f59e0b" : "#f97316");
      grad.addColorStop(1, color === "green" ? "#06b6d4" : color === "amber" ? "#ef4444" : "#ef4444");
      ctx.strokeStyle = grad;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.shadowBlur = 20;
      ctx.shadowColor = palette.glow;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const tickAngle = startAngle + (totalArc * i) / 10;
        const inner = radius - lineWidth / 2 - 4;
        const outer = radius + lineWidth / 2 + 4;
        ctx.beginPath();
        ctx.moveTo(cx + inner * Math.cos(tickAngle), cy + inner * Math.sin(tickAngle));
        ctx.lineTo(cx + outer * Math.cos(tickAngle), cy + outer * Math.sin(tickAngle));
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function animate() {
      if (animProgress < targetProgress) {
        animProgress = Math.min(animProgress + 0.018, targetProgress);
        draw(animProgress);
        animFrame = requestAnimationFrame(animate);
      } else {
        draw(targetProgress);
      }
    }

    animate();
    return () => cancelAnimationFrame(animFrame);
  }, [score, color]);

  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl border border-white/10"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}>

      <div className="text-center">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
          Quantum Risk Score
        </h2>
        <p className="text-slate-500 text-xs">
          {isProtected ? "Vault active — protected" : "Ed25519 wallet exposed"}
        </p>
      </div>

      {/* Gauge */}
      <div className="relative">
        {isLoading ? (
          <div className="w-[220px] h-[220px] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="w-[220px] h-[220px]" />
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-6xl font-black tabular-nums leading-none"
                style={{ color: palette.text }}
              >
                {score}
              </span>
              <span className="text-xs text-slate-400 mt-1">/100</span>
            </div>
          </>
        )}
      </div>

      {/* Status badge */}
      <div
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
        style={{ background: palette.bg, color: palette.text, border: `1px solid ${palette.stroke}40` }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: palette.stroke }} />
        {isProtected ? "✅ PROTECTED" : label}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 text-center max-w-[180px] leading-relaxed">
        {description}
      </p>
      <p className="text-[11px] text-slate-500 text-center max-w-[230px] leading-relaxed">
        Formula: base 75 + high SOL (+10) + SPL exposure (+5) - active vault (-60) - verified PQ binding (-10).
      </p>

      {/* Risk scale */}
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
          <span>0 Secure</span>
          <span>50 Moderate</span>
          <span>100 Critical</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${score}%`,
              background: "linear-gradient(90deg, #10b981, #f59e0b, #ef4444)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
