"use client";
import { useState } from 'react';
import { ChatPanel } from '@/components/agent-chat';
import { BookOpen, LayoutDashboard, Trophy, Timer } from 'lucide-react';
import DashboardMetrics from '@/components/dashboard-metrics';
import StudyTasks from '@/components/study-tasks';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [focusMode, setFocusMode] = useState(false); // Naya State

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-20 md:w-64 border-r border-slate-100 bg-white flex flex-col items-center md:items-start py-6 z-10">
        <div className="px-6 mb-10 w-full flex items-center justify-center md:justify-start">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">e</div>
          <span className="hidden md:block ml-3 font-bold text-xl tracking-tight text-slate-800">Saarthi</span>
        </div>
        
        <nav className="w-full px-4 space-y-2 flex-1">
          <button onClick={() => {setActiveView('dashboard'); setFocusMode(false);}} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeView === 'dashboard' && !focusMode ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-500'}`}>
            <LayoutDashboard className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block text-sm">Dashboard</span>
          </button>
          {focusMode && (
            <div className="w-full flex items-center p-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold animate-pulse">
              <Timer className="h-5 w-5 md:mr-3" />
              <span className="hidden md:block text-sm">Focus Active</span>
            </div>
          )}
        </nav>
      </div>

      {/* MIDDLE CONTENT */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-700 ${focusMode ? 'bg-slate-900' : 'bg-slate-50/30'}`}>
        <div className="max-w-4xl mx-auto relative z-10">
          
          {focusMode ? (
            /* AGENTIC UI: FOCUS MODE VIEW */
            <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <h2 className="text-indigo-400 text-sm font-mono tracking-[0.3em] uppercase">Deep Focus Session</h2>
              <div className="text-8-xl md:text-9xl font-black text-white tabular-nums tracking-tighter">
                24:59
              </div>
              <p className="text-slate-400 max-w-sm">PrepMaster has hidden your distractions. Focus on Quantitative Aptitude.</p>
              <button 
                onClick={() => setFocusMode(false)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all text-sm font-medium"
              >
                End Session
              </button>
            </div>
          ) : (
            /* NORMAL DASHBOARD VIEW */
            <>
              <header className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900">Welcome, Devanshu! 👋</h1>
                <p className="text-slate-500 mt-2 text-lg">SSC CGL Tier 1 • 45 days remaining</p>
              </header>
              <div className="space-y-10">
                <DashboardMetrics />
                <StudyTasks />
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT CHAT PANEL (Passing the setter) */}
      <div className="w-80 lg:w-96 border-l border-slate-100 bg-white hidden lg:block z-10">
        <ChatPanel 
          onOpenDashboard={() => {setActiveView('dashboard'); setFocusMode(false);}} 
          onActivateFocus={() => setFocusMode(true)} // Naya Prop
        />
      </div>

    </div>
  );
}