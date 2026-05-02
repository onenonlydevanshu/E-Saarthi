"use client";
import { useState } from 'react';
import { Send, User2, Sparkles } from 'lucide-react';

export function ChatPanel({ onOpenDashboard }: { onOpenDashboard?: () => void }) {
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'Hello! I am PrepMaster. Ready to crush your SSC CGL targets for today? What subject should we dive into?' }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);
    setInput('');

    let aiReply = "I've noted that down. Let's focus on your daily targets! 🎯";
    const lowerInput = userText.toLowerCase();

    if (lowerInput.includes("distract") || lowerInput.includes("consistency")) {
      aiReply = "Consistency is tough, but crucial for SSC CGL! Try the Pomodoro technique: 25 mins of focus, 5 min break. 🧘‍♂️";
    } else if (lowerInput.includes("study") || lowerInput.includes("plan") || lowerInput.includes("how")) {
      aiReply = "Let's build a solid plan. For today, 2 hours for Quant and 1 hour for Reasoning. I've updated your tasks. 📚";
    } else if (lowerInput.includes("dashboard")) {
      aiReply = "Sure thing! Pulling up your main dashboard now... [OPEN_DASHBOARD]";
      // Agar trigger function pass kiya gaya hai, toh call karo
      if (onOpenDashboard) {
        setTimeout(() => onOpenDashboard(), 1000);
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: aiReply }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">PrepMaster AI</h2>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">SSC CGL Mentor</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 text-sm">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'}`}>
              {m.role === 'user' ? <User2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-bold text-slate-800">{m.role === 'user' ? 'You' : 'PrepMaster'}</p>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {m.content.replace('[OPEN_DASHBOARD]', '')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-slate-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your prep..."
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}