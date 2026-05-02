"use client";
import { useState } from 'react';
import { ChatPanel } from '@/components/agent-chat';
import { BookOpen, LayoutDashboard, Settings, Trophy } from 'lucide-react';
import DashboardMetrics from '@/components/dashboard-metrics';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-20 md:w-64 border-r border-slate-200 bg-white flex flex-col items-center md:items-start py-6 shadow-sm z-10">
        <div className="px-6 mb-10 w-full flex items-center justify-center md:justify-start">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">e</div>
          <span className="hidden md:block ml-3 font-bold text-xl tracking-tight text-slate-800">Saarthi</span>
        </div>
        
        <nav className="w-full px-4 space-y-2 flex-1">
          <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}>
            <LayoutDashboard className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block">Dashboard</span>
          </button>
          <button onClick={() => setActiveView('tasks')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeView === 'tasks' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}>
            <BookOpen className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block">Study Plan</span>
          </button>
          <button className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all">
            <Trophy className="h-5 w-5 md:mr-3" />
            <span className="hidden md:block">Progress</span>
          </button>
        </nav>
      </div>

      {/* MIDDLE DASHBOARD CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Welcome back, Devanshu! 👋</h1>
            <p className="text-slate-500 mt-1">Your SSC CGL preparation is on track. Let's hit today's targets.</p>
          </header>
          
          {/* Main Content Area */}
          <div className="w-full min-h-[400px]">
            {activeView === 'dashboard' ? (
              /* Dashboard View: Show the sexy metrics from Claude */
              <DashboardMetrics />
            ) : (
              /* Tasks/Study Plan View: Placeholder for now */
              <div className="bg-white border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-400 border-dashed">
                Study Plan Content Coming Soon...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT AI CHAT PANEL */}
      <div className="w-80 lg:w-96 border-l border-slate-200 bg-white hidden lg:block shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10">
        <ChatPanel onOpenDashboard={() => setActiveView('dashboard')} />
      </div>

    </div>
  );
}