"use client";
import { useState, useEffect } from 'react';
import { ChatPanel } from '@/components/agent-chat';
import DashboardMetrics from '@/components/dashboard-metrics';
import StudyTasks from '@/components/study-tasks';
import { LayoutDashboard, BookOpen, Trophy, Timer, Sparkles } from 'lucide-react';

export default function Home() {
  const [focusMode, setFocusMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR - Fixed & Clean */}
      <div className="w-20 md:w-64 border-r border-slate-100 bg-white flex flex-col py-8 z-20">
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">e</div>
          <span className="hidden md:block font-black text-2xl tracking-tighter text-slate-800">Saarthi</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => {setActiveView('dashboard'); setFocusMode(false);}} 
            className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeView === 'dashboard' && !focusMode ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-400'}`}>
            <LayoutDashboard className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block text-sm">Dashboard</span>
          </button>
          <button onClick={() => setActiveView('tasks')} 
            className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeView === 'tasks' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-400'}`}>
            <BookOpen className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block text-sm">Study Plan</span>
          </button>
          {focusMode && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-600 text-white flex items-center shadow-lg animate-pulse">
              <Timer className="h-5 w-5 md:mr-3" />
              <span className="hidden md:block text-sm font-bold">Focus Mode ON</span>
            </div>
          )}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 relative transition-all duration-1000 overflow-y-auto ${focusMode ? 'bg-slate-950' : 'bg-slate-50/50'}`}>
        
        {/* Background Mesh Gradient (Only for Dashboard) */}
        {!focusMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-100/20 blur-[100px]" />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          {focusMode ? (
            /* IMMERSIVE FOCUS TIMER */
            <div className="h-[75vh] flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-700">
              <div className="space-y-4 text-center">
                <p className="text-indigo-400 text-xs font-bold tracking-[0.4em] uppercase">Deep Focus Active</p>
                <h2 className="text-white/50 text-xl font-medium">Quantitative Aptitude Practice</h2>
              </div>
              <div className="text-[12rem] font-black text-white tabular-nums tracking-tighter leading-none">
                24:59
              </div>
              <button 
                onClick={() => setFocusMode(false)}
                className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all text-sm font-bold backdrop-blur-md"
              >
                Exit Session
              </button>
            </div>
          ) : (
            /* CLEAN PREMIUM DASHBOARD */
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <header className="flex items-end justify-between border-b border-slate-200 pb-8">
                <div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight">Hi, Devanshu!</h1>
                  <p className="text-slate-500 mt-3 text-lg font-medium">You have 2 focus sessions scheduled for today.</p>
                </div>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-xs font-bold text-slate-600">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  AI Coach Online
                </div>
              </header>

              <div className="grid gap-12">
                <section>
                  <DashboardMetrics />
                </section>
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Today's Targets</h2>
                  </div>
                  <StudyTasks />
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CHAT PANEL */}
      <div className="w-80 lg:w-[400px] border-l border-slate-100 bg-white hidden xl:block shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.03)]">
        <ChatPanel 
          onOpenDashboard={() => {setActiveView('dashboard'); setFocusMode(false);}} 
          onActivateFocus={() => setFocusMode(true)}
        />
      </div>

    </div>
  );
}