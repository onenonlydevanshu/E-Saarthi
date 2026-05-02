"use client";
import { useState, useEffect } from 'react';
import { ChatPanel } from '@/components/agent-chat';
import DashboardMetrics from '@/components/dashboard-metrics';
import StudyTasks from '@/components/study-tasks';
import { LayoutDashboard, BookOpen, Trophy, Timer, Sparkles, Settings as SettingsIcon, X } from 'lucide-react';

export default function Home() {
  // --- STATES ---
  const [focusMode, setFocusMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  
  // New States for the "Detail Window" & Settings
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState('');
  const [examName, setExamName] = useState('SSC CGL Tier 1');
  const [isAgentBooting, setIsAgentBooting] = useState(false);

  // --- HANDLERS ---
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAgentBooting(true);
    setTimeout(() => {
      setShowOnboarding(false);
      setIsAgentBooting(false);
    }, 1500); // Fake agent initialization delay for wow factor
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-slate-100 overflow-hidden font-sans">
      
      {/* 1. ONBOARDING MODAL (The Detail Window) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
            {isAgentBooting ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="text-xl font-bold text-white">Agent Initializing...</h3>
                <p className="text-slate-400 text-sm">Customizing your workspace for {examName}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30">e</div>
                </div>
                <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome to e-Saarthi</h2>
                <p className="text-slate-400 text-center text-sm mb-8">Let your AI mentor set up your workspace.</p>
                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
                    <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g. Devanshu" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Target Exam</label>
                    <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all mt-4">
                    Deploy My Agent
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Platform Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span>Agent Strictness Level</span>
                <span className="text-indigo-400 font-bold">High (Exam Mode)</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span>Notification Sounds</span>
                <div className="w-10 h-6 bg-indigo-600 rounded-full border-2 border-slate-900"></div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-20 md:w-64 border-r border-slate-800 bg-[#0a0a0a] flex flex-col py-8 z-20">
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">e</div>
          <span className="hidden md:block font-black text-xl tracking-tighter text-white">Saarthi.ai</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => {setActiveView('dashboard'); setFocusMode(false);}} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeView === 'dashboard' && !focusMode ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-slate-400'}`}>
            <LayoutDashboard className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block text-sm">Agent Dashboard</span>
          </button>
          <button onClick={() => setActiveView('tasks')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeView === 'tasks' ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-slate-400'}`}>
            <BookOpen className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block text-sm">Study Planner</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center p-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
            <SettingsIcon className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block text-sm">Settings</span>
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 relative transition-all duration-700 overflow-y-auto ${focusMode ? 'bg-black' : 'bg-[#0f1115]'}`}>
        <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
          {focusMode ? (
            /* IMMERSIVE FOCUS TIMER (Agent controlled) */
            <div className="h-[75vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-700">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                <Sparkles className="h-3 w-3" /> Agent Enforced Focus
              </div>
              <div className="text-[10rem] md:text-[12rem] font-black text-white tabular-nums tracking-tighter leading-none">
                24:59
              </div>
              <p className="text-slate-400 text-lg">Distractions blocked. Keep grinding.</p>
              <button onClick={() => setFocusMode(false)} className="px-8 py-3 mt-8 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all text-sm font-semibold">
                Exit Focus Mode
              </button>
            </div>
          ) : (
            /* DASHBOARD */
            <div className="space-y-10 animate-in fade-in duration-500">
              <header className="flex items-end justify-between border-b border-slate-800 pb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">Hi, {userName || 'Devanshu'} 👋</h1>
                  <p className="text-slate-400 mt-2 text-sm">Your Agent has prepared your {examName} targets for today.</p>
                </div>
              </header>
              <DashboardMetrics />
              <div className="pt-4">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-indigo-400"/> Agent Suggested Tasks</h2>
                <StudyTasks />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CHAT PANEL (The Core Agent) */}
      <div className="w-80 lg:w-[400px] border-l border-slate-800 bg-[#0a0a0a] hidden md:flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-slate-200">e-Saarthi Agent Online</span>
        </div>
        <div className="flex-1 overflow-hidden">
           {/* MAKE SURE THIS PROP IS PASSED TO TRIGGER FOCUS MODE */}
          <ChatPanel 
            onOpenDashboard={() => {setActiveView('dashboard'); setFocusMode(false);}} 
            onActivateFocus={() => setFocusMode(true)}
          />
        </div>
      </div>

    </div>
  );
}