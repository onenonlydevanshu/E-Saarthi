"use client";

import { useEffect, useState, useRef } from "react";

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ value, max, size = 120 }: { value: number; max: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = animated / max;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(value), 300);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="7"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col items-center z-10">
        <span
          className="font-semibold leading-none"
          style={{
            fontSize: 26,
            background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {value}h
        </span>
        <span className="text-xs text-slate-500 mt-0.5 tracking-widest uppercase" style={{ fontSize: 9 }}>
          of {max}h
        </span>
      </div>
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ targetHours = 6 }: { targetHours?: number }) {
  const getRemaining = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(now.getHours() + targetHours, now.getMinutes(), now.getSeconds());
    const diff = Math.max(0, target.getTime() - Date.now());
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { h, m, s };
  };

  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  const Unit = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="rounded-lg flex items-center justify-center"
        style={{
          width: 48,
          height: 52,
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3) inset",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 24,
            fontWeight: 600,
            background: "linear-gradient(160deg, #f1f5f9 30%, #64748b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {pad(val)}
        </span>
      </div>
      <span className="text-slate-600 tracking-widest uppercase" style={{ fontSize: 9 }}>
        {label}
      </span>
    </div>
  );

  const Sep = () => (
    <span className="text-slate-600 font-light mb-4" style={{ fontSize: 22, fontFamily: "'DM Mono', monospace" }}>
      :
    </span>
  );

  return (
    <div className="flex items-end gap-1.5">
      <Unit val={time.h} label="hrs" />
      <Sep />
      <Unit val={time.m} label="min" />
      <Sep />
      <Unit val={time.s} label="sec" />
    </div>
  );
}

// ─── Focus Pill Badge ─────────────────────────────────────────────────────────
function FocusBadge({ topic }: { topic: string }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Chapter tag */}
      <div
        className="self-start px-3 py-1 rounded-full text-xs tracking-widest uppercase"
        style={{
          background: "rgba(167,139,250,0.1)",
          border: "1px solid rgba(167,139,250,0.2)",
          color: "#a78bfa",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Active Chapter
      </div>

      {/* Topic Name */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          lineHeight: 1.25,
          background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
        }}
      >
        {topic}
      </div>

      {/* Sub-topics */}
      <div className="flex flex-wrap gap-2">
        {["Algebra", "Percentages", "Ratio & Prop."].map((t) => (
          <span
            key={t}
            className="px-2.5 py-0.5 rounded-md text-xs"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#64748b",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Mastery bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-slate-600 text-xs tracking-wider uppercase" style={{ fontSize: 9 }}>
            Mastery
          </span>
          <span className="text-slate-500 text-xs" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
            68%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 3, background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: "68%",
              background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
              transition: "width 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Card Shell ───────────────────────────────────────────────────────────────
function MetricCard({
  children,
  label,
  icon,
  accent,
}: {
  children: React.ReactNode;
  label: string;
  icon: React.ReactNode;
  accent: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(15, 20, 35, 0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.065)"}`,
        borderRadius: 20,
        boxShadow: hovered
          ? "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)"
          : "0 8px 32px rgba(0,0,0,0.4)",
        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        padding: "28px 28px 24px",
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle accent glow in corner */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: accent,
          opacity: hovered ? 0.18 : 0.08,
          transition: "opacity 0.4s ease",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Card header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs tracking-widest uppercase"
          style={{
            color: "#475569",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.15em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
        >
          {icon}
        </div>
      </div>

      {/* Card content */}
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TestIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const BookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

// ─── Root Component ───────────────────────────────────────────────────────────
export default function DashboardMetrics() {
  return (
    <>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap');
      `}</style>

      <div
        style={{
          display: "flex",
          gap: 18,
          width: "100%",
          alignItems: "stretch",
        }}
      >
        {/* ── Card 1: Hours Studied ── */}
        <MetricCard label="Hours Studied Today" icon={<ClockIcon />} accent="rgba(96,165,250,1)">
          <CircularProgress value={4} max={8} size={130} />
          <div className="mt-2 text-center">
            <p
              className="text-xs"
              style={{ color: "#475569", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}
            >
              4 more hours to hit your daily goal
            </p>
          </div>
          {/* Mini stat row */}
          <div
            className="flex justify-between w-full mt-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { v: "32h", l: "This Week" },
              { v: "94h", l: "This Month" },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center gap-0.5">
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#cbd5e1",
                  }}
                >
                  {v}
                </span>
                <span style={{ fontSize: 9, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </MetricCard>

        {/* ── Card 2: Next Mock Test ── */}
        <MetricCard label="Next Mock Test" icon={<TestIcon />} accent="rgba(167,139,250,1)">
          <div className="flex flex-col items-center gap-4 w-full">
            <Countdown targetHours={6} />

            <div
              className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#a78bfa",
                  boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Full-Length CAT Simulation
                </p>
                <p style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Today · 06:00 PM · 180 min</p>
              </div>
            </div>
          </div>
        </MetricCard>

        {/* ── Card 3: Current Focus ── */}
        <MetricCard label="Current Focus" icon={<BookIcon />} accent="rgba(52,211,153,1)">
          <FocusBadge topic="Quantitative Aptitude" />
        </MetricCard>
      </div>
    </>
  );
}