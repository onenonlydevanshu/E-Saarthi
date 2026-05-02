'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from 'ai/react'
import { Bot, Loader2, MessageSquare, Send, Sparkles, StopCircle, User2 } from 'lucide-react'
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

export function ChatPanel({ mode = 'hero', onOpenDashboard }: AgentChatProps) {
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
    onboardingCompleted,
    userName,
    studyHoursPerDay,
  } = useAppStore()

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

  const chat = useChat({
    api: '/api/chat',
    streamProtocol: 'text',
    body: {
      performanceData,
      memoryContext,
      currentFocusTask,
      appState,
      selectedExamId,
      userName,
      studyHoursPerDay,
    },
    onError(error) {
      console.error('Chat error:', error)
    },
  } as any)

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = chat

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

    if (content.includes('[OPEN_DASHBOARD]')) {
      onOpenDashboard?.()
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
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              const text = isUser ? String(message.content ?? '') : formatAssistantMessage(String(message.content ?? ''))

              return (
                <div key={message.id} className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={cn(
                      'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      isUser
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-3xl px-4 py-3 sm:max-w-[80%]',
                      isUser
                        ? 'rounded-tr-md bg-primary text-primary-foreground'
                        : 'rounded-tl-md border border-border/50 bg-secondary/70 text-secondary-foreground'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6 sm:text-[15px]">{text}</p>
                  </div>
                </div>
              )
            })}

            {recentlyExecuted.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                {recentlyExecuted.map((item) => item).join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 border-t border-border/50 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-[28px] border border-border/50 bg-background/90 p-2 shadow-sm backdrop-blur-md">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything about your exam prep..."
            className="min-h-12 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => stop()}
              className="h-12 w-12 shrink-0 rounded-full"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-full shadow-lg shadow-primary/20">
              <Send className="h-5 w-5" />
            </Button>
          )}
        </form>
        {mounted && !onboardingCompleted ? null : null}
        {isLoading && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Thinking...</p>
        )}
      </div>
    </div>
  )
}
