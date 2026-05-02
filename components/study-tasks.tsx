"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = "high" | "medium" | "low";
type Task = {
  id: number;
  label: string;
  tag: string;
  priority: Priority;
  done: boolean;
  justChecked?: boolean;
};

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    label: "Solve 50 Reasoning Questions",
    tag: "Practice",
    priority: "high",
    done: false,
  },
  {
    id: 2,
    label: "Revise Static GK — Polity & Constitution",
    tag: "Revision",
    priority: "high",
    done: false,
  },
  {
    id: 3,
    label: "Complete Quantitative Aptitude Mock",
    tag: "Mock Test",
    priority: "medium",
    done: false,
  },
  {
    id: 4,
    label: "Read Current Affairs — May 2026",
    tag: "Reading",
    priority: "low",
    done: false,
  },
];

// ─── Priority Config ──────────────────────────────────────────────────────────
const PRIORITY_META: Record<Priority, { dot: string; label: string }> = {
  high:   { dot: "#ef4444", label: "High"   },
  medium: { dot: "#f59e0b", label: "Med"    },
  low:    { dot: "#6b7280", label: "Low"    },
};

// ─── Sparkle burst on check ───────────────────────────────────────────────────
function Sparkle({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transform: active ? "scale(1)" : "scale(0.4)",
        transition: "opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* radial dots */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <span
          key={deg}
          style={{
            position: "absolute",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#3b82f6",
            transform: `rotate(${deg}deg) translateX(${active ? 11 : 5}px)`,
            opacity: active ? 0 : 1,
            transition: `transform 0.45s cubic-bezier(0.22,1,0.36,1) ${deg * 0.3}ms,
                         opacity 0.3s ease ${deg * 0.3 + 200}ms`,
          }}
        />
      ))}
    </span>
  );
}

// ─── Custom Checkbox ──────────────────────────────────────────────────────────
function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  const [burst, setBurst] = useState(false);

  const handleClick = () => {
    if (!checked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    onChange();
  };

  return (
    <button
      onClick={handleClick}
      aria-checked={checked}
      role="checkbox"
      style={{
        position: "relative",
        width: 18,
        height: 18,
        borderRadius: 5,
        flexShrink: 0,
        border: checked ? "1.5px solid #3b82f6" : "1.5px solid #d1d5db",
        background: checked
          ? "linear-gradient(135deg,#3b82f6,#6366f1)"
          : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: checked ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
        outline: "none",
      }}
    >
      {/* Checkmark SVG */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        style={{
          opacity: checked ? 1 : 0,
          transform: checked ? "scale(1)" : "scale(0.5)",
          transition: "opacity 0.2s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <polyline
          points="1.5,5 4,7.5 8.5,2.5"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Burst particles */}
      <Sparkle active={burst} />
    </button>
  );
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
function TagChip({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.04em",
        color: "#6b7280",
        background: "#f3f4f6",
        border: "1px solid #e5e7eb",
        borderRadius: 4,
        padding: "1px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({
  task,
  onToggle,
  index,
}: {
  task: Task;
  onToggle: (id: number) => void;
  index: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 60 + 80);
    return () => clearTimeout(t);
  }, [index]);

  const dot = PRIORITY_META[task.priority].dot;

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "11px 14px",
          borderRadius: 9,
          background: task.done ? "#fafafa" : "white",
          border: "1px solid",
          borderColor: task.done ? "#f3f4f6" : "#e5e7eb",
          cursor: "default",
          transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
          boxShadow: task.done ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          if (!task.done) {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 2px 8px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "#d1d5db";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = task.done
            ? "none"
            : "0 1px 3px rgba(0,0,0,0.04)";
          (e.currentTarget as HTMLDivElement).style.borderColor = task.done
            ? "#f3f4f6"
            : "#e5e7eb";
        }}
      >
        {/* Completion shimmer */}
        {task.done && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg,transparent,rgba(59,130,246,0.03),transparent)",
              animation: "shimmer 1.8s ease forwards",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Priority dot */}
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: task.done ? "#d1d5db" : dot,
            flexShrink: 0,
            transition: "background 0.3s",
          }}
        />

        {/* Checkbox */}
        <Checkbox checked={task.done} onChange={() => onToggle(task.id)} />

        {/* Label */}
        <span
          style={{
            flex: 1,
            fontSize: 13.5,
            fontFamily: "'Geist', 'DM Sans', sans-serif",
            color: task.done ? "#9ca3af" : "#111827",
            textDecoration: task.done ? "line-through" : "none",
            textDecorationColor: "#d1d5db",
            transition: "color 0.3s, text-decoration 0.3s",
            letterSpacing: "-0.01em",
            lineHeight: 1.45,
          }}
        >
          {task.label}
        </span>

        {/* Tag */}
        <TagChip label={task.tag} />
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 99,
          background: "#f3f4f6",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: pct === 100 ? "#22c55e" : "linear-gradient(90deg,#3b82f6,#6366f1)",
            transition: "width 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: pct === 100 ? "#22c55e" : "#6b7280",
          minWidth: 30,
          textAlign: "right",
          transition: "color 0.3s",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Add Task Input ───────────────────────────────────────────────────────────
function AddTaskInput({ onAdd }: { onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderRadius: 9,
        border: "1px dashed",
        borderColor: focused ? "#93c5fd" : "#e5e7eb",
        background: focused ? "#f0f7ff" : "#fafafa",
        transition: "border-color 0.2s, background 0.2s",
        cursor: "text",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Plus icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ flexShrink: 0, color: focused ? "#3b82f6" : "#9ca3af", transition: "color 0.2s" }}
      >
        <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Add a task… (press Enter)"
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 13.5,
          fontFamily: "'Geist', 'DM Sans', sans-serif",
          color: "#374151",
          letterSpacing: "-0.01em",
        }}
      />

      {value.trim() && (
        <button
          onClick={handleSubmit}
          style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 5,
            padding: "3px 8px",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          ADD
        </button>
      )}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function StudyTasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const doneCount = tasks.filter((t) => t.done).length;

  const toggle = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTask = (label: string) => {
    const next: Task = {
      id: Date.now(),
      label,
      tag: "New",
      priority: "low",
      done: false,
    };
    setTasks((prev) => [...prev, next]);
  };

  const clearDone = () => setTasks((prev) => prev.filter((t) => !t.done));

  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
          fontFamily: "'DM Sans', sans-serif",
          width: "100%",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {/* Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="#3b82f6" strokeWidth="1.5" />
                  <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="#3b82f6" strokeWidth="1.5" />
                  <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="#3b82f6" strokeWidth="1.5" />
                  <path d="M9.5 12.5h5M12 10v5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#111827",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  Study Tasks
                </p>
                <p
                  style={{
                    fontSize: 10.5,
                    color: "#9ca3af",
                    fontFamily: "'DM Mono', monospace",
                    marginTop: 1,
                  }}
                >
                  {doneCount}/{tasks.length} complete
                </p>
              </div>
            </div>

            {/* Clear done */}
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                style={{
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  color: "#9ca3af",
                  background: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "3px 10px",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                }}
              >
                Clear done
              </button>
            )}
          </div>

          {/* Progress */}
          <ProgressBar done={doneCount} total={tasks.length} />

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "active", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.04em",
                  textTransform: "capitalize",
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: filter === f ? "#111827" : "transparent",
                  borderColor: filter === f ? "#111827" : "#e5e7eb",
                  color: filter === f ? "white" : "#6b7280",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Task List ── */}
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {visible.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 0",
                color: "#d1d5db",
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.02em",
              }}
            >
              {filter === "done" ? "Nothing completed yet." : "All done — great work! 🎉"}
            </div>
          ) : (
            visible.map((task, i) => (
              <TaskRow key={task.id} task={task} onToggle={toggle} index={i} />
            ))
          )}

          {/* Add task */}
          <div style={{ marginTop: 4 }}>
            <AddTaskInput onAdd={addTask} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <span
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10.5,
                  fontFamily: "'DM Mono', monospace",
                  color: "#9ca3af",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: PRIORITY_META[p].dot,
                    display: "inline-block",
                  }}
                />
                {PRIORITY_META[p].label}
              </span>
            ))}
          </div>

          <span
            style={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: "#d1d5db",
              letterSpacing: "0.04em",
            }}
          >
            ↵ to add
          </span>
        </div>
      </div>
    </>
  );
}