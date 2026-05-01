'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore, type ScheduleItem } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
  ArrowRight,
  StopCircle,
  Calendar,
  CheckSquare,
  BookOpen,
  Target,
  Zap,
  Clock,
  GraduationCap,
  Plus,
  Play,
  Edit3,
  ListPlus,
  Timer,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllExams, getSyllabusById } from '@/lib/syllabus-data'
import {
  parseChatControllerPayload,
  stripAgentActions,
  handleStructuredChatResponse,
  startFocusSession,
  type ExecutedAction,
} from '@/lib/agent-actions'

// Keywords that trigger Focus Mode activation
const FOCUS_KEYWORDS = [
  'distract', 'distraction', 'distracted',
  'unfocus', 'unfocused', "can't focus", 'cannot focus', 'not focused',
  'losing focus', 'lost focus', 'no focus',
  "can't concentrate", 'cannot concentrate', 'not concentrating',
  'procrastinating', 'procrastination', 'procrastinate',
  'wandering', 'mind wandering',
  'not productive', 'unproductive',
  'need to focus', 'help me focus', 'want to focus',
  'struggling to study', "can't study", 'cannot study',
  'attention', 'attention span', 'losing attention',
  'overwhelmed', 'stressed', 'anxious about studying',
  'start focus', 'activate focus', 'enable focus mode',
  'pomodoro', 'timer', 'focus timer'
]

function detectFocusIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return FOCUS_KEYWORDS.some(keyword => lowerMessage.includes(keyword))
}

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: BookOpen, label: 'My Performance', prompt: 'Analyze my performance and give me insights on my weak and strong areas' },
  { icon: Calendar, label: 'Adaptive Plan', prompt: 'Create an adaptive study plan based on my performance data' },
  { icon: CheckSquare, label: 'Smart Tasks', prompt: 'Give me personalized tasks based on my weak areas' },
  { icon: Zap, label: 'Stay Focused', prompt: "I'm feeling distracted, help me focus" },
]

// Inline action button types
interface InlineAction {
  type: 'focus' | 'add-task' | 'add-tasks' | 'add-plan' | 'modify' | 'regenerate-plan' | 'view'
  label: string
  data?: string
}

interface ChatPanelProps {
  embedded?: boolean
}

// Parse inline actions from message content
function parseInlineActions(content: string): { cleanContent: string; actions: InlineAction[] } {
  const actions: InlineAction[] = []
  let cleanContent = content

  // Parse action markers like [ACTION:focus:Study Algebra] or [ACTION:add-task:Review Chapter 5]
  const actionRegex = /\[ACTION:(\w+(?:-\w+)?):([^\]]+)\]/g
  let match

  while ((match = actionRegex.exec(content)) !== null) {
    const [fullMatch, type, data] = match
    const labels: Record<string, string> = {
      'focus': 'Start Focus',
      'add-task': 'Add to Tasks',
      'add-tasks': 'Add Tasks',
      'add-plan': 'Add to Planner',
      'modify': 'Regenerate Plan',
      'regenerate-plan': 'Regenerate Plan',
      'view': 'View Details'
    }
    actions.push({
      type: type as InlineAction['type'],
      label: labels[type] || type,
      data: data.trim()
    })
    cleanContent = cleanContent.replace(fullMatch, '')
  }

  return { cleanContent: cleanContent.trim(), actions }
}

function getAutoInlineActions(content: string): InlineAction[] {
  const payload = parseChatControllerPayload(content)
  if (!payload?.data) return []

  const actions: InlineAction[] = []
  const tasks = payload.data.tasks ?? payload.data.dailyTasks ?? []
  const plan = payload.data.plan ?? payload.data.studyPlan

  if (tasks.length === 1) {
    actions.push({
      type: 'add-task',
      label: 'Add Task',
      data: tasks[0],
    })
  } else if (tasks.length > 1) {
    actions.push({
      type: 'add-tasks',
      label: `Add ${tasks.length} Tasks`,
      data: JSON.stringify(tasks),
    })
  }

  const focusTask = payload.data.taskTitle || tasks[0]
  if (focusTask) {
    actions.push({
      type: 'focus',
      label: 'Start Focus',
      data: focusTask,
    })
  }

  if (plan) {
    actions.push({
      type: 'add-plan',
      label: 'Add to Planner',
      data: plan.examName,
    })
  }

  if (payload.action === 'update_progress') {
    actions.push({
      type: 'view',
      label: 'Open Progress',
      data: 'progress',
    })
  }

  return actions
}

export function ChatPanel({ embedded = false }: ChatPanelProps) {
  const {
    chatOpen,
    setChatOpen,
    messages,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    clearMessages,
    setActivePage,
    addStudyPlan,
    addTask,
    toggleTask,
    clearTasks,
    addExam,
    exams,
    getPerformanceData,
    getMemoryContext,
    adaptiveInsights,
    activePage,
    tasks,
    studyPlans,
    currentFocusTask,
    setCurrentFocusTask,
    setFocusAutoStart,
    selectedExamId,
    setSelectedExamId,
    setTheme,
  } = useAppStore()
  
  const availableExams = getAllExams()
  const currentSyllabus = selectedExamId ? getSyllabusById(selectedExamId) : null
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showFocusPrompt, setShowFocusPrompt] = useState(false)
  const [detectedPlan, setDetectedPlan] = useState<{ examName: string; examDate: string; hoursPerDay: number; schedule: ScheduleItem[] } | null>(null)
  const [detectedTasks, setDetectedTasks] = useState<string[] | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [, setPendingModification] = useState<string | null>(null)
  // Track recently executed agent actions for visual feedback
  const [recentlyExecuted, setRecentlyExecuted] = useState<ExecutedAction[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fullResponseRef = useRef<string>('')

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsLoading(false)
  }, [])

  const handleAddStudyPlan = () => {
    if (detectedPlan) {
      addStudyPlan({
        examName: detectedPlan.examName,
        examDate: detectedPlan.examDate,
        hoursPerDay: detectedPlan.hoursPerDay,
        schedule: detectedPlan.schedule,
      })
      setDetectedPlan(null)
      addMessage({
        role: 'assistant',
        content: '✓ Study plan has been added to your Study Planner! You can view and manage it there.'
      })
    }
  }

  const handleAddTasks = () => {
    if (detectedTasks) {
      detectedTasks.forEach(task => {
        addTask({ title: task, completed: false })
      })
      setDetectedTasks(null)
      addMessage({
        role: 'assistant',
        content: `✓ ${detectedTasks.length} tasks have been added to your Daily Tasks! Go check them off as you complete them.`
      })
    }
  }

  const handleStartFocusOnTask = (taskTitle: string, keepChatOpen = false) => {
    const started = startFocusSession(taskTitle, {
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
      setShowFocusPrompt,
    })

    if (!started) return

    if (!keepChatOpen) setChatOpen(false)
  }

  // Handle inline action buttons
  const handleInlineAction = (action: InlineAction) => {
    switch (action.type) {
      case 'focus':
        if (action.data) {
          handleStartFocusOnTask(action.data, false)
        }
        break
      case 'add-task':
        if (action.data) {
          addTask({ title: action.data, completed: false })
          addMessage({
            role: 'assistant',
            content: `Added "${action.data}" to your Daily Tasks.`
          })
        }
        break
      case 'add-tasks':
        if (action.data) {
          try {
            const tasks = JSON.parse(action.data) as string[]
            tasks.filter(Boolean).forEach((task) => {
              addTask({ title: task, completed: false })
            })
            addMessage({
              role: 'assistant',
              content: `Added ${tasks.length} tasks to your Daily Tasks.`
            })
          } catch {
            addTask({ title: action.data, completed: false })
          }
        }
        break
      case 'add-plan':
        setActivePage('study-planner')
        setChatOpen(false)
        break
      case 'modify':
      case 'regenerate-plan':
        if (action.data) {
          setPendingModification(action.data)
          setInput(`Regenerate my study plan: ${action.data}`)
        } else {
          setInput('Regenerate my study plan with updated priorities and better topic balance.')
        }
        setShowQuickActions(false)
        break
      case 'view':
        if (action.data === 'tasks') {
          setActivePage('daily-tasks')
          setChatOpen(false)
        } else if (action.data === 'planner') {
          setActivePage('study-planner')
          setChatOpen(false)
        } else if (action.data === 'progress') {
          setActivePage('progress-tracker')
          setChatOpen(false)
        }
        break
    }
  }

  const handleRegeneratePlan = (context?: string) => {
    const suffix = context ? ` for ${context}` : ''
    setInput(
      `Regenerate my study plan${suffix} with improved topic distribution and updated priorities.`
    )
    setShowQuickActions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setShowQuickActions(false)
    addMessage({ role: 'user', content: userMessage })
    setIsLoading(true)
    setIsStreaming(true)
    setDetectedPlan(null)
    setDetectedTasks(null)
    fullResponseRef.current = ''

    const needsFocus = detectFocusIntent(userMessage)
    
    abortControllerRef.current = new AbortController()
    
    try {
      addMessage({ role: 'assistant', content: '' })
      
      // Get performance data for adaptive responses
      const performanceData = getPerformanceData()
      const memoryContext = getMemoryContext()
      const pendingTasks = tasks.filter((task) => !task.completed)
      const completedTasksCount = tasks.length - pendingTasks.length
      const latestPlan = studyPlans[studyPlans.length - 1]
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          messages: messages.slice(-10),
          performanceData: {
            ...performanceData,
            recentInsights: adaptiveInsights,
          },
          memoryContext,
          currentFocusTask,
          appState: {
            activePage,
            pendingTasksCount: pendingTasks.length,
            completedTasksCount,
            latestPlanExamName: latestPlan?.examName,
            latestPlanTopTopic: latestPlan?.schedule?.[0]?.topics?.[0],
          },
          selectedExamId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let shouldShowFocus = false
      let pendingSseBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        pendingSseBuffer += decoder.decode(value, { stream: true })
        const lines = pendingSseBuffer.split('\n')
        pendingSseBuffer = lines.pop() ?? ''

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line) continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              // Handle metadata
              if (parsed.meta && parsed.intent) {
                if (parsed.intent.focus) shouldShowFocus = true
                continue
              }

              if (parsed.content) {
                fullResponseRef.current += parsed.content
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      const trailingLine = pendingSseBuffer.trim()
      if (trailingLine.startsWith('data: ')) {
        const data = trailingLine.slice(6)
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data)
            if (parsed.meta && parsed.intent) {
              if (parsed.intent.focus) shouldShowFocus = true
            } else if (parsed.content) {
              fullResponseRef.current += parsed.content
            }
          } catch {
            // Ignore malformed trailing line
          }
        }
      }

      const { response: normalizedResponse, executedActions } = handleStructuredChatResponse(
        fullResponseRef.current,
        {
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
          setShowFocusPrompt,
          setDetectedPlan,
          setDetectedTasks,
        }
      )
      const messageWithController = `${normalizedResponse.message}\n\n[CHAT_CONTROLLER]\n${JSON.stringify(
        normalizedResponse,
        null,
        2
      )}\n[/CHAT_CONTROLLER]`
      updateLastMessage(messageWithController)

      if (executedActions.length > 0) {
        setRecentlyExecuted(executedActions)
        setTimeout(() => setRecentlyExecuted([]), 6000)
      }

      // Fallback: if the AI didn't emit show_focus_prompt but the user
      // clearly needs it, show it from the client side.
      if ((shouldShowFocus || needsFocus) && !showFocusPrompt) {
        setTimeout(() => {
          setShowFocusPrompt(true)
        }, 500)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        appendToLastMessage('\n\n*[Response stopped]*')
      } else {
        addMessage({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure the API is configured correctly or try again.',
        })
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    setShowQuickActions(false)
  }

  // Format message content (remove the JSON blocks from display)
  const formatMessageContent = (content: string) => {
    const payload = parseChatControllerPayload(content)
    if (payload?.message) {
      return payload.message.trim()
    }

    return stripAgentActions(
      content
        .replace(/\[STUDY_PLAN\][\s\S]*?\[\/STUDY_PLAN\]/g, '')
        .replace(/\[DAILY_TASKS\][\s\S]*?\[\/DAILY_TASKS\]/g, '')
    ).trim()
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!embedded && !chatOpen && (
        <div className="fixed bottom-8 right-8 z-50 group">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-accent opacity-60 blur-xl group-hover:opacity-80 transition-opacity duration-500 animate-pulse-glow-soft" />
          
          {/* Secondary pulse ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-primary/30 animate-ping-slow opacity-0 group-hover:opacity-100" />
          
          {/* Main button */}
          <button
            onClick={() => setChatOpen(true)}
            className={cn(
              'relative w-[72px] h-[72px] rounded-3xl',
              'bg-gradient-to-br from-primary via-primary to-primary/90',
              'text-primary-foreground',
              'flex items-center justify-center',
              'shadow-[0_8px_32px_rgba(var(--primary)/0.4),0_4px_12px_rgba(0,0,0,0.15)]',
              'transition-all duration-300 ease-out',
              'hover:scale-110 hover:rotate-3',
              'hover:shadow-[0_12px_48px_rgba(var(--primary)/0.5),0_8px_24px_rgba(0,0,0,0.2)]',
              'active:scale-95 active:rotate-0',
              'before:absolute before:inset-0 before:rounded-3xl',
              'before:bg-gradient-to-t before:from-white/0 before:to-white/20',
              'overflow-hidden'
            )}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            
            {/* Icon with bounce */}
            <div className="relative animate-float">
              <MessageSquare className="w-8 h-8" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-card/95 backdrop-blur-lg rounded-xl border border-border/50 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap">
            <p className="text-sm font-medium text-card-foreground">Ask PrepMaster AI</p>
            <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-card border-r border-b border-border/50" />
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          embedded
            ? [
                'relative h-full min-h-[720px] w-full overflow-hidden rounded-[32px]',
                'bg-card/95 backdrop-blur-2xl border border-border/50 flex flex-col',
                'shadow-[0_24px_80px_-32px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)]',
              ]
            : [
                'fixed right-0 top-0 z-50 h-screen',
                'w-full sm:w-[420px] md:w-[480px]',
                'bg-card/95 backdrop-blur-2xl',
                'border-l border-border/50',
                'flex flex-col',
                'shadow-[-8px_0_40px_rgba(0,0,0,0.08)]',
                'dark:shadow-[-8px_0_40px_rgba(0,0,0,0.3)]',
                'transition-transform duration-400 ease-out',
                chatOpen ? 'translate-x-0' : 'translate-x-full'
              ]
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-border/50 bg-card/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-card-foreground">AI Exam Coach</h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{isStreaming ? 'Thinking...' : 'Chat drives the workspace'}</p>
                  {isStreaming && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="text-muted-foreground hover:text-foreground rounded-xl"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {!embedded && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatOpen(false)}
                  className="rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Exam Selector */}
          <div className="px-4 sm:px-5 pb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Preparing for:</label>
              <select
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(e.target.value || null)}
                className={cn(
                  'flex-1 text-sm font-medium px-3 py-2 rounded-xl',
                  'bg-secondary/50 border border-border/50',
                  'text-card-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30',
                  'transition-all'
                )}
              >
                <option value="">Select an exam...</option>
                {availableExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.shortName} - {exam.name}
                  </option>
                ))}
              </select>
            </div>
            {currentSyllabus && (
              <p className="text-xs text-muted-foreground mt-2 px-1">
                {currentSyllabus.subjects.length} subjects | {currentSyllabus.totalMarks} marks | {currentSyllabus.duration}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold text-xl text-card-foreground mb-2">
                Hi, I&apos;m PrepMaster!
              </h3>
              <p className="text-sm text-muted-foreground max-w-[280px] mb-3 leading-relaxed">
                Your AI study agent. Just tell me what you need and I&apos;ll
                update plans, tasks, focus mode, and more for you instantly.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-[300px]">
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Study Plans</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">Daily Tasks</span>
                <span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">Focus Mode</span>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">Performance</span>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-2.5 w-full max-w-[320px]">
                <p className="text-xs text-muted-foreground font-medium mb-3">Quick Actions</p>
                {QUICK_ACTIONS.map((action, index) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    className={cn(
                      'group w-full text-left px-5 py-3.5 rounded-xl',
                      'bg-secondary/50 hover:bg-secondary',
                      'border border-border/50 hover:border-primary/30',
                      'text-sm text-secondary-foreground',
                      'transition-all duration-250',
                      'hover:shadow-md hover:-translate-y-0.5',
                      'flex items-center gap-3',
                      `animate-fade-in-up stagger-${index + 1}`
                    )}
                  >
                    <action.icon className="w-4 h-4 text-primary" />
                    <span className="flex-1">{action.label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
              
              {/* Exam context */}
              {exams.length > 0 && (
                <div className="mt-6 p-4 bg-secondary/30 rounded-xl border border-border/50 max-w-[320px]">
                  <p className="text-xs text-muted-foreground mb-2">Your upcoming exams:</p>
                  <div className="flex flex-wrap gap-2">
                    {exams.slice(0, 3).map(exam => (
                      <span key={exam.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">
                        {exam.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => {
            const { cleanContent, actions } = message.role === 'assistant'
              ? (() => {
                  const parsed = parseInlineActions(formatMessageContent(message.content))
                  const autoActions = getAutoInlineActions(message.content)
                  const merged = [...parsed.actions]
                  autoActions.forEach((action) => {
                    const exists = merged.some(
                      (a) => a.type === action.type && a.data === action.data
                    )
                    if (!exists) merged.push(action)
                  })
                  return { cleanContent: parsed.cleanContent, actions: merged }
                })()
              : { cleanContent: message.content, actions: [] }
            
            return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-fade-in',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className="max-w-[82%] space-y-2">
                <div
                  className={cn(
                    'px-5 py-3.5 rounded-2xl shadow-sm',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-lg'
                      : 'bg-secondary text-secondary-foreground rounded-tl-lg'
                  )}
                >
                  {cleanContent ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanContent}</p>
                  ) : (
                    <div className="flex gap-1.5 py-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
                
                {/* Inline Action Buttons */}
                {message.role === 'assistant' && actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-1 animate-fade-in">
                    {actions.map((action, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        onClick={() => handleInlineAction(action)}
                        className={cn(
                          'h-8 rounded-lg text-xs gap-1.5 border-border/50',
                          'hover:border-primary/50 hover:bg-primary/5',
                          'transition-all duration-200'
                        )}
                      >
                        {action.type === 'focus' && <Play className="w-3.5 h-3.5 text-emerald-500" />}
                        {action.type === 'add-task' && <ListPlus className="w-3.5 h-3.5 text-blue-500" />}
                        {action.type === 'add-tasks' && <ListPlus className="w-3.5 h-3.5 text-blue-500" />}
                        {action.type === 'add-plan' && <Calendar className="w-3.5 h-3.5 text-violet-500" />}
                        {(action.type === 'modify' || action.type === 'regenerate-plan') && (
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        {action.type === 'view' && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )})}

          {/* Study Plan Detection Card */}
          {detectedPlan && (
            <div className="animate-scale-in mx-auto max-w-[380px]">
              <div className={cn(
                'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
                'border border-emerald-500/25 rounded-3xl p-6',
                'shadow-xl shadow-emerald-500/5'
              )}>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Calendar className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-lg text-card-foreground mb-2">
                    Study Plan Ready!
                  </h4>
                  <p className="text-sm font-medium text-card-foreground">
                    {detectedPlan.examName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {detectedPlan.schedule.length} days | {detectedPlan.hoursPerDay} hours/day
                  </p>
                </div>
                
                {/* Schedule Preview */}
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {detectedPlan.schedule.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl',
                        'bg-background/50 border border-border/50',
                        'group hover:border-emerald-500/30 transition-all'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-emerald-600">D{item.day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-card-foreground truncate">{item.topics.join(', ')}</p>
                        <p className="text-xs text-muted-foreground">{item.hours}h</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartFocusOnTask(item.topics[0] || 'Study Session')}
                        className="h-7 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 gap-1"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span className="text-xs">Start Focus</span>
                      </Button>
                    </div>
                  ))}
                  {detectedPlan.schedule.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center italic">+{detectedPlan.schedule.length - 3} more days...</p>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddStudyPlan}
                      className="flex-1 gap-2 rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Planner
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRegeneratePlan(detectedPlan.examName)}
                      className="rounded-xl gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Regenerate Plan
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetectedPlan(null)}
                    className="text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Daily Tasks Detection Card */}
          {detectedTasks && (
            <div className="animate-scale-in mx-auto max-w-[380px]">
              <div className={cn(
                'bg-gradient-to-br from-blue-500/15 to-indigo-500/10',
                'border border-blue-500/25 rounded-3xl p-6',
                'shadow-xl shadow-blue-500/5'
              )}>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/25 to-blue-500/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-lg text-card-foreground mb-2">
                    Tasks Generated!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {detectedTasks.length} tasks ready - add all or start focusing on one
                  </p>
                </div>
                
                {/* Task List with Focus Buttons */}
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {detectedTasks.map((task, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl',
                        'bg-background/50 border border-border/50',
                        'group hover:border-blue-500/30 transition-all'
                      )}
                    >
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="text-sm text-card-foreground flex-1 line-clamp-2">{task}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartFocusOnTask(task)}
                        className="h-8 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Start Focus</span>
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleAddTasks}
                    className="gap-2 rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Tasks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetectedTasks(null)}
                    className="rounded-xl"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Focus Mode Activation Prompt */}
          {showFocusPrompt && (
            <div className="animate-scale-in mx-auto max-w-[340px]">
              <div className={cn(
                'bg-gradient-to-br from-primary/15 to-accent/10',
                'border border-primary/25 rounded-3xl p-6 text-center',
                'shadow-xl shadow-primary/5'
              )}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-bold text-lg text-card-foreground mb-2">
                  Need help focusing?
                </h4>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Activate Focus Mode with a Pomodoro timer to boost your concentration and productivity.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setActivePage('focus-mode')
                      setChatOpen(false)
                      setShowFocusPrompt(false)
                    }}
                    className="gap-2 rounded-xl shadow-lg shadow-primary/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Focus Mode
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFocusPrompt(false)}
                    className="rounded-xl"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Agent Action Execution Feedback */}
          {recentlyExecuted.length > 0 && (
            <div className="animate-scale-in mx-auto max-w-[380px]">
              <div
                className={cn(
                  'bg-gradient-to-br from-primary/10 to-accent/5',
                  'border border-primary/25 rounded-2xl p-4',
                  'shadow-lg shadow-primary/5'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-card-foreground tracking-tight">
                    Agent executed {recentlyExecuted.length}{' '}
                    {recentlyExecuted.length === 1 ? 'action' : 'actions'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {recentlyExecuted.map((exec, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                        'bg-background/60 border border-border/40',
                        'animate-fade-in'
                      )}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {exec.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="text-card-foreground flex-1 truncate">
                        {exec.message}
                      </span>
                      <span className="text-muted-foreground/70 text-[10px] uppercase tracking-wider font-medium">
                        {exec.action.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick action bar when there are messages */}
        {messages.length > 0 && showQuickActions && (
          <div className="px-5 py-3 border-t border-border/30 bg-secondary/30">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                    'bg-background/80 border border-border/50',
                    'hover:bg-background hover:border-primary/30',
                    'transition-all duration-200 whitespace-nowrap',
                    'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="sticky bottom-0 border-t border-border/50 bg-card/95 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-full border border-border/50 bg-background/80 p-2 shadow-sm">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about study plans, exam tips, or any topic..."
              className={cn(
                'flex-1 h-11 rounded-full border-0 bg-transparent px-4 shadow-none focus-visible:ring-0',
                'placeholder:text-muted-foreground/60'
              )}
              disabled={isLoading}
            />
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={stopStreaming}
                className="flex-shrink-0 h-11 w-11 rounded-full"
              >
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 h-11 w-11 rounded-full shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
          {isStreaming && (
            <p className="text-xs text-muted-foreground mt-2 text-center animate-fade-in">
              Click the stop button to cancel the response
            </p>
          )}
        </form>
      </div>

      {/* Overlay */}
      {chatOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden transition-opacity duration-300"
          onClick={() => setChatOpen(false)}
        />
      )}
    </>
  )
}
