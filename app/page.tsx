"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Bot,
  Send,
  Timer,
  X,
  ChevronRight,
  Flame,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  Zap,
  BarChart3,
  Star,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  GraduationCap,
  BrainCircuit,
  Moon,
  Bell,
  Settings,
  ChevronDown,
  CheckCircle2,
  Circle,
  ArrowRight,
  Layers,
  Trophy,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type View = "dashboard" | "planner" | "tasks" | "mocks";

interface Task {
  id: number;
  label: string;
  subject: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  duration: string;
}

interface Message {
  role: "user" | "ai";
  text: string;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const priorityConfig = {
  high: { dot: "bg-rose-400", badge: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  medium: { dot: "bg-amber-400", badge: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  low: { dot: "bg-emerald-400", badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
};

// ─── Static Data ──────────────────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  { id: 1, label: "Quantitative Aptitude — Time & Work", subject: "QA", done: true, priority: "high", duration: "45 min" },
  { id: 2, label: "English — Reading Comprehension", subject: "ENG", done: false, priority: "high", duration: "30 min" },
  { id: 3, label: "GK — Indian Polity Chapter 7", subject: "GK", duration: "40 min", done: false, priority: "medium" },
  { id: 4, label: "Reasoning — Blood Relations", subject: "RES", duration: "25 min", done: false, priority: "medium" },
  { id: 5, label: "Maths — Revision of Percentages", subject: "QA", duration: "20 min", done: false, priority: "low" },
];

const INITIAL_MESSAGES: Message[] = [
  {
    role: "ai",
    text: "Hey! I'm Saarthi 🎯 Your AI study mentor for SSC CGL. Ask me anything — concepts, strategy, or say **'focus mode'** to start a Pomodoro!",
    timestamp: "9:00 AM",
  },
];

const navItems = [
  { id: "dashboard" as View, icon: LayoutDashboard, label: "Dashboard" },
  { id: "planner" as View, icon: CalendarDays, label: "Study Planner" },
  { id: "tasks" as View, icon: CheckSquare, label: "Task Manager" },
  { id: "mocks" as View, icon: ClipboardList, label: "Mock Tests" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="relative group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent} blur-3xl scale-150`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-500">{label}</span>
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <Icon size={14} className="text-slate-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function PlaceholderView({
  icon: Icon,
  title,
  subtitle,
  tag,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  tag: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="relative max-w-md w-full rounded-3xl border border-white/[0.07] bg-white/[0.02] p-10 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold tracking-widest uppercase mb-6">
            <Sparkles size={10} />
            {tag}
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <Icon size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">{subtitle}</p>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-all duration-200 hover:gap-3">
            Get Notified
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Focus Mode (Pomodoro) ────────────────────────────────────────────────────
function FocusMode({ onExit }: { onExit: () => void }) {
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(1);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tick = useCallback(() => {
    setSecs((prev) => {
      if (prev <= 1) {
        setRunning(false);
        if (phase === "work") {
          setPhase("break");
          setSession((s) => s + 1);
          return 5 * 60;
        } else {
          setPhase("work");
          return 25 * 60;
        }
      }
      return prev - 1;
    });
  }, [phase]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const progress = phase === "work" ? 1 - secs / (25 * 60) : 1 - secs / (5 * 60);
  const circumference = 2 * Math.PI * 110;
  const strokeDash = circumference * (1 - progress);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#060608] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/[0.06] rounded-full blur-[80px]" />
        {/* subtle grain */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all duration-200 z-10"
      >
        <X size={14} />
        Exit Focus Mode
      </button>

      {/* Session indicator */}
      <div className="flex items-center gap-2 mb-10 z-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i < session % 4 ? "w-8 bg-indigo-500" : "w-4 bg-white/10"}`}
          />
        ))}
        <span className="ml-3 text-xs text-slate-500 font-medium">
          Session {session} · {phase === "work" ? "Focus" : "Break"}
        </span>
      </div>

      {/* SVG Ring Timer */}
      <div className="relative w-64 h-64 z-10 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          <circle
            cx="120" cy="120" r="110"
            fill="none"
            stroke={phase === "work" ? "#6366f1" : "#10b981"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            className="transition-all duration-1000 ease-linear"
            style={{ filter: `drop-shadow(0 0 8px ${phase === "work" ? "#6366f1" : "#10b981"})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold text-white tracking-tighter tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmt(secs)}
          </span>
          <span className={`text-xs font-semibold mt-2 tracking-widest uppercase ${phase === "work" ? "text-indigo-400" : "text-emerald-400"}`}>
            {phase === "work" ? "Deep Focus" : "Short Break"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 z-10">
        <button
          onClick={() => { setSecs(phase === "work" ? 25 * 60 : 5 * 60); setRunning(false); }}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all duration-200"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            running
              ? "bg-white/10 hover:bg-white/15 border border-white/15 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          }`}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start Focus"}
        </button>
        <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all duration-200">
          <BarChart3 size={16} />
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-600 z-10">
        Stay present. Every minute compounds. ✦
      </p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardView({
  onActivateFocus,
  userName,
  examName,
  studyHours,
}: {
  onActivateFocus: () => void;
  userName: string;
  examName: string;
  studyHours: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggle = (id: number) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  return (
    
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      <header className="flex items-end justify-between border-b border-white/10 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight">Hi, {userName || 'Devanshu'}!</h1>
          <p className="text-slate-300 mt-3 text-lg font-medium">Your AI Coach has built a {studyHours || '6'}-hour plan for {examName || 'SSC CGL'}.</p>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Last Score" value="145/200" sub="Tier-II Full Mock · 72.5%" accent="bg-indigo-500/5" />
        <MetricCard icon={Clock} label="Next Mock" value="2 days" sub="SSC CGL Full Mock #8" accent="bg-violet-500/5" />
        <MetricCard icon={Flame} label="Streak" value="14 days" sub="+3 this week" accent="bg-orange-500/5" />
        <MetricCard icon={Target} label="Accuracy" value="78.4%" sub="↑ 4.2% from last week" accent="bg-emerald-500/5" />
      </div>

      {/* Mock Test Card */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/[0.07] rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                <ClipboardList size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Mock Test Performance</h3>
                <p className="text-[11px] text-slate-500">Last 5 attempts</p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all <ChevronRight size={12} />
            </button>
          </div>

          {/* Mini score bars */}
          <div className="flex items-end gap-3 h-20 mb-4">
            {[102, 118, 131, 138, 145].map((score, i) => {
              const h = Math.round((score / 200) * 100);
              const isLast = i === 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className={`text-[10px] font-medium ${isLast ? "text-indigo-400" : "text-slate-600"}`}>{score}</span>
                  <div className="w-full rounded-t-md transition-all duration-700" style={{
                    height: `${h}%`,
                    background: isLast
                      ? "linear-gradient(to top, #6366f1, #818cf8)"
                      : "rgba(255,255,255,0.05)",
                    boxShadow: isLast ? "0 0 12px rgba(99,102,241,0.3)" : "none",
                  }} />
                </div>
              );
            })}
          </div>
          <div className="h-px bg-white/5" />

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Quant", val: "34/50", color: "text-indigo-400" },
              { label: "English", val: "41/50", color: "text-violet-400" },
              { label: "Reasoning", val: "38/50", color: "text-emerald-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className={`text-base font-bold ${color}`}>{val}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Manager Widget */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <CheckSquare size={16} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Today's Study Plan</h3>
              <p className="text-[11px] text-slate-500">
                {done}/{tasks.length} completed
              </p>
            </div>
          </div>
          {/* Progress pill */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-400">{pct}%</span>
          </div>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left group ${
                task.done
                  ? "bg-white/[0.015] border-white/[0.04]"
                  : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12]"
              }`}
            >
              {task.done
                ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                : <Circle size={16} className="text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate transition-colors ${task.done ? "text-slate-600 line-through" : "text-slate-300"}`}>
                  {task.label}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-600">{task.duration}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${priorityConfig[task.priority].badge}`}>
                  {task.priority}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ onActivateFocus }: { onActivateFocus: () => void }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    if (trimmed.toLowerCase().includes("focus")) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: trimmed, timestamp: now },
        { role: "ai", text: "Activating Focus Mode 🎯 I'll be here when you're done. Go crush it!", timestamp: now },
      ]);
      setInput("");
      setTimeout(onActivateFocus, 800);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed, timestamp: now },
      {
        role: "ai",
        text: "Great question! For SSC CGL, consistency beats intensity. Focus on your weak areas first, then reinforce strengths. Want me to build a targeted plan?",
        timestamp: now,
      },
    ]);
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <aside className="hidden md:flex flex-col w-[350px] border-l border-white/[0.07] bg-[#070709]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070709]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Saarthi AI</p>
          <p className="text-[11px] text-emerald-400">Online · SSC CGL Expert</p>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
          <Settings size={14} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["Mock Analysis", "Weak Areas", "Focus Mode", "Daily Tip"].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                if (chip === "Focus Mode") onActivateFocus();
                else setInput(chip);
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-slate-400 hover:text-white text-[11px] font-medium transition-all duration-200"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={12} className="text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[78%] space-y-1 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600/80 text-white rounded-tr-sm"
                    : "bg-white/[0.05] border border-white/[0.07] text-slate-300 rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-600 px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.07]">
        <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3 py-2.5 focus-within:border-indigo-500/40 focus-within:bg-white/[0.06] transition-all duration-200">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Saarthi anything…"
            className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 resize-none outline-none min-h-[20px] max-h-24"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-slate-700 text-center mt-2">Try: "What are my weak areas?" or "focus mode"</p>
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [focusMode, setFocusMode] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Dynamic User Data
  const [userName, setUserName] = useState("");
  const [examName, setExamName] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#060608] text-white overflow-hidden font-sans">
      {/* ── Ambient Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-600/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* ── Left Sidebar ───────────────────────────────────────────── */}
      <nav
        className={`relative z-10 flex flex-col border-r border-white/[0.07] bg-[#070709]/80 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[64px]" : "w-[220px]"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/[0.07] ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <GraduationCap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white tracking-tight truncate">e-Saarthi</p>
              <p className="text-[10px] text-indigo-400 tracking-widest uppercase">SSC CGL</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <ChevronDown size={12} className="-rotate-90" />
            </button>
          )}
        </div>

        {/* Nav links */}
        <div className="flex-1 px-2 py-4 space-y-1">
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-all duration-200 mb-3"
            >
              <ChevronRight size={14} />
            </button>
          )}
          {navItems.map(({ id, icon: Icon, label }) => {
            const active = activeView === id && !focusMode;
            return (
              <button
                key={id}
                onClick={() => { setActiveView(id); setFocusMode(false); }}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && <div className="ml-auto w-1 h-1 rounded-full bg-indigo-400" />}
              </button>
            );
          })}
        </div>

        {/* Focus Mode button */}
        {!collapsed && (
          <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
            <button
              onClick={() => setFocusMode(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-sm font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            >
              <Timer size={15} />
              <span>Focus Mode</span>
              <Zap size={11} className="ml-auto text-violet-400" />
            </button>
          </div>
        )}

        {/* User avatar */}
        <div className={`flex items-center gap-3 p-3 border-t border-white/[0.07] ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
            A
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">Aryan Sharma</p>
              <p className="text-[10px] text-slate-600 truncate">Pro Plan · 47d left</p>
            </div>
          )}
          {!collapsed && (
            <Bell size={13} className="text-slate-600 hover:text-slate-400 cursor-pointer shrink-0 transition-colors" />
          )}
        </div>
      </nav>

      {/* ── Main Workspace ─────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        {!focusMode && (
          <header className="flex items-center justify-between px-8 h-16 border-b border-white/[0.07] bg-[#070709]/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-slate-700">e-Saarthi</span>
              <ChevronRight size={12} className="text-slate-700" />
              <span className="text-slate-400 capitalize">{activeView === "dashboard" ? "Dashboard" : navItems.find(n => n.id === activeView)?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-slate-500">
                <Star size={11} className="text-amber-400" />
                <span>14-day streak</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Settings size={11} className="text-slate-400" />
                <span>Settings</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-slate-500">
                <Trophy size={11} className="text-indigo-400" />
                <span>Rank #247</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>47 days to exam</span>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {focusMode ? (
            <FocusMode onExit={() => setFocusMode(false)} />
          ) : activeView === "dashboard" ? (
            <DashboardView
              onActivateFocus={() => setFocusMode(true)}
              userName={userName}
              examName={examName}
              studyHours={studyHours}
            />
          ) : activeView === "planner" ? (
            <PlaceholderView
              icon={CalendarDays}
              title="Study Timeline"
              subtitle="Your AI-generated adaptive study timeline is being crafted. It'll map every topic across all 4 sections with intelligent revision cycles."
              tag="Coming Soon"
            />
          ) : activeView === "tasks" ? (
            <PlaceholderView
              icon={Layers}
              title="Task Manager"
              subtitle="A full Kanban-style task manager with drag-and-drop, priority tagging, and automated scheduling based on your performance metrics."
              tag="In Development"
            />
          ) : (
            <PlaceholderView
              icon={BookOpen}
              title="Mock Test Arena"
              subtitle="A timed, exam-accurate mock test environment with real-time analytics, section-wise breakdowns, and AI-powered weak area detection."
              tag="Beta Soon"
            />
          )}
        </div>
      </main>

      {/* ── Chat Panel ─────────────────────────────────────────────── */}
      {!focusMode && <ChatPanel onActivateFocus={() => setFocusMode(true)} />}

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl">
            <h2 className="mb-2 text-2xl font-bold text-white">Welcome to e-Saarthi</h2>
            <p className="mb-6 text-sm text-slate-400">Let your AI mentor set up your workspace.</p>
            <form onSubmit={(e) => { e.preventDefault(); setShowOnboarding(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
                <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g. Devanshu" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>

              {/* Naya: Exam aur Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Exam</label>
                  <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="SSC CGL" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Daily Goal (Hrs)</label>
                  <input type="number" value={studyHours} onChange={(e) => setStudyHours(e.target.value)} placeholder="6" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-white text-black hover:bg-slate-200 font-semibold py-3 rounded-xl transition-all mt-4 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" /> Deploy My Agent
              </button>
            </form>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                <span>Agent Strictness</span> <span className="text-indigo-400">High</span>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="mt-2 w-full rounded-lg bg-white/10 py-2 text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}