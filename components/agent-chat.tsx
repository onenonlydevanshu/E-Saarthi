"use client";


import { useEffect, useMemo, useRef, useState } from 'react'

// Custom mock useChat hook for Track 1 Demo
const useChat = () => {
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'Hello! I am PrepMaster. Ready to crush your SSC CGL targets for today? What subject should we dive into?' }
  ]);
  const [input, setInput] = useState('');
  
  const handleInputChange = (e: any) => setInput(e.target.value);
  
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    
    // Simulate AI response after 1 second
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "That's a great focus! I'll update your dashboard tasks with some relevant practice questions. 🎯" 
      }]);
    }, 1000);
  };

  return { messages, input, handleInputChange, handleSubmit, isLoading: false };
};
import { Bot, MessageSquare, Send, Sparkles, StopCircle, User2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  handleStructuredChatResponse,
  parseChatControllerPayload,
  stripAgentActions,
} from '@/lib/agent-actions'
import { useAppStore } from '@/lib/store'

type AgentChatProps = {
  mode?: 'hero' | 'dock'
  onOpenDashboard?: () => void
}

function formatAssistantMessage(content: string) {
  const withoutTrigger = content.replace(/\[OPEN_DASHBOARD\]/g, '').trim()
  const structured = parseChatControllerPayload(withoutTrigger)
  if (structured?.message) return structured.message.trim()
  return stripAgentActions(withoutTrigger).trim()
}

// Is line ko dhundo aur replace karo
export function ChatPanel({ mode = 'hero', onOpenDashboard, onActivateFocus }: AgentChatProps & { onActivateFocus?: () => void }) {
  const {
    getPerformanceData,
    getMemoryContext,
    currentFocusTask,
    activePage,
    tasks,
    studyPlans,
    selectedExamId,
    setActivePage,
    addTask,
    toggleTask,
    clearTasks,
    addStudyPlan,
    setCurrentFocusTask,
    setFocusAutoStart,
    setSelectedExamId,
    addExam,
    setTheme,
    setChatOpen,
    setAgentFeedback,
  } = useAppStore()

  // Access onboarding/profile fields via selectors to avoid strict AppState typing issues
  const onboardingCompleted = useAppStore((s: any) => s.onboardingCompleted)
  const userName = useAppStore((s: any) => s.userName)
  const studyHoursPerDay = useAppStore((s: any) => s.studyHoursPerDay)

  const [mounted, setMounted] = useState(false)
  const [recentlyExecuted, setRecentlyExecuted] = useState<string[]>([])
  const processedAssistantIds = useRef<Set<string>>(new Set())

  const performanceData = getPerformanceData()
  const memoryContext = getMemoryContext()

  const appState = useMemo(() => {
    const pendingTasks = tasks.filter((task) => !task.completed)
    const latestPlan = studyPlans[studyPlans.length - 1] ?? null

    return {
      activePage,
      pendingTasksCount: pendingTasks.length,
      completedTasksCount: tasks.length - pendingTasks.length,
      latestPlanExamName: latestPlan?.examName,
      latestPlanTopTopic: latestPlan?.schedule?.[0]?.topics?.[0],
      nextPendingTaskTitle: pendingTasks[0]?.title,
    }
  }, [activePage, studyPlans, tasks])

  // mock useChat accepts no args in this demo hook
  const chat = useChat()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = chat
  // No-op fallbacks for features not present in the demo hook
  const stop = (() => {}) as () => void
  const setInput = (() => {}) as (v: string) => void

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoading) return
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
    if (!lastAssistant || processedAssistantIds.current.has(lastAssistant.id)) return

    const content = String(lastAssistant.content ?? '')
    if (!content.trim()) return

    processedAssistantIds.current.add(lastAssistant.id)

    // AGENTIC TRIGGER: Agar AI reply mein 'Focus Mode' ya Pomodoro ki baat ho rahi ho
    if (content.toLowerCase().includes('focus mode') || content.toLowerCase().includes('pomodoro')) {
      onActivateFocus?.() 
    }
    const normalized = content.replace(/\[OPEN_DASHBOARD\]/g, '').trim()
    const result = handleStructuredChatResponse(normalized, {
      setActivePage,
      addTask,
      toggleTask,
      clearTasks,
      addStudyPlan,
      setCurrentFocusTask,
      setFocusAutoStart,
      setSelectedExamId,
      addExam,
      setTheme,
      setChatOpen,
      getTasks: () => useAppStore.getState().tasks,
      getCurrentFocusTask: () => useAppStore.getState().currentFocusTask,
      setShowFocusPrompt: () => undefined,
      setDetectedPlan: () => undefined,
      setDetectedTasks: () => undefined,
    })

    if (result.executedActions.length > 0) {
      setRecentlyExecuted(result.executedActions.map((item) => item.message))
      setTimeout(() => setRecentlyExecuted([]), 5000)
    }

    if (result.response?.message) {
      setAgentFeedback({
        currentAction: result.response.action,
        currentActionDetail: result.response.message,
        nextStep: result.response.message,
        tone: 'neutral',
      })
    }
  }, [
    addExam,
    addStudyPlan,
    addTask,
    appState,
    clearTasks,
    currentFocusTask,
    isLoading,
    messages,
    onOpenDashboard,
    selectedExamId,
    setActivePage,
    setAgentFeedback,
    setChatOpen,
    setCurrentFocusTask,
    setFocusAutoStart,
    setInput,
    setSelectedExamId,
    setTheme,
    toggleTask,
  ])

  const containerClassName = cn(
    'relative flex min-w-0 flex-col overflow-hidden',
    mode === 'hero'
      ? 'mx-auto h-[calc(100dvh-2rem)] w-full max-w-5xl rounded-[32px] border border-border/50 bg-card/90 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.18)] backdrop-blur-2xl'
      : 'h-full min-h-0 w-full rounded-[28px] border border-border/50 bg-card/95 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.2)] backdrop-blur-2xl'
  )

  return (
    <div className={containerClassName}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary),0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(var(--primary),0.08),transparent_30%)]" />

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-border/50 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agent First</p>
            <h1 className="truncate text-lg font-bold text-foreground">AI Exam Coach</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'dock' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatOpen(false)}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              Minimize
            </Button>
          )}
          {mode === 'hero' && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              ChatGPT-style default view
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[55vh] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-lg shadow-primary/10">
              <Bot className="h-10 w-10" />
            </div>
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Tell me what you want to do.
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Ask for a study plan, daily tasks, progress insights, or focus mode. If you ask for the dashboard, I&apos;ll switch the app view instantly.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['Build a study plan', 'Show my progress', 'Generate tasks', 'Help me focus'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setInput(item)}
                  className="rounded-full border border-border/50 bg-background/70 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              const text = isUser ? String(message.content ?? '') : formatAssistantMessage(String(message.content ?? ''))

              return (
                <div
                  key={message.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex w-full gap-4 p-6 items-start">
                    <div
                      className={cn(
                        'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        isUser
                          ? 'bg-slate-100 text-slate-700'
                          : 'border border-blue-100 bg-blue-50 text-blue-600 shadow-[0_0_18px_rgba(59,130,246,0.12)]'
                      )}
                    >
                      {isUser ? <User2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'prose prose-slate max-w-none',
                          isUser
                            ? 'rounded-2xl bg-gray-50/50 px-5 py-4'
                            : 'border-b border-gray-100 pb-4'
                        )}
                        role={isUser ? 'status' : 'article'}
                      >
                        <p className="m-0 whitespace-pre-wrap text-[15px] leading-7 text-slate-800">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {recentlyExecuted.length > 0 && (
              <div className="mx-auto w-full rounded-2xl border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                {recentlyExecuted.map((item) => item).join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10">
        {/* Floating command bar */}
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <form onSubmit={handleSubmit} className="pointer-events-auto flex w-full max-w-4xl items-center gap-3 rounded-[28px] border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:bg-card/95">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything about your exam prep..."
              className="min-h-12 flex-1 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => stop()}
                className="h-12 w-12 shrink-0 rounded-full bg-red-600 text-white shadow-md"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-transform hover:scale-105">
                <Send className="h-5 w-5" />
              </Button>
            )}
          </form>
        </div>

        {/* Keep existing mount/onboarding checks and loading indicator */}
        {mounted && !onboardingCompleted ? null : null}
        {isLoading && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Thinking...</p>
        )}
      </div>
    </div>
  )
}
