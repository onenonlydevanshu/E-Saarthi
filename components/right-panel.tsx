'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Clock3, Play, Pause, RotateCcw, CalendarDays, ListTodo, Timer } from 'lucide-react'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

const timerSettings = {
  focus: { duration: 25 * 60, label: 'Focus Time' },
  shortBreak: { duration: 5 * 60, label: 'Short Break' },
  longBreak: { duration: 15 * 60, label: 'Long Break' },
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function RightPanel() {
  const {
    studyPlans,
    tasks,
    toggleTask,
    currentFocusTask,
    setCurrentFocusTask,
    focusAutoStart,
    setFocusAutoStart,
    incrementFocusSessions,
    addStudyHours,
    completeFocusTask,
  } = useAppStore()

  const latestPlan = useMemo(() => studyPlans[studyPlans.length - 1] ?? null, [studyPlans])

  const [status, setStatus] = useState<{
    plan: string
    tasks: string
    focus: string
  }>({
    plan: 'Waiting',
    tasks: 'Waiting',
    focus: 'Idle',
  })
  const [planPulse, setPlanPulse] = useState(false)
  const [tasksPulse, setTasksPulse] = useState(false)
  const [focusPulse, setFocusPulse] = useState(false)
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<Set<string>>(new Set())
  const [highlightedPlanKeys, setHighlightedPlanKeys] = useState<Set<string>>(new Set())

  const previousPlanIdRef = useRef<string | null>(null)
  const previousTaskIdsRef = useRef<string[]>([])
  const previousFocusIdRef = useRef<string | null>(null)

  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(timerSettings.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsThisCycle, setSessionsThisCycle] = useState(0)

  useEffect(() => {
    if (!latestPlan) return
    const previousPlanId = previousPlanIdRef.current
    if (previousPlanId === latestPlan.id) return

    previousPlanIdRef.current = latestPlan.id
    setStatus((current) => ({ ...current, plan: 'Plan Generated' }))
    setPlanPulse(true)

    const keys = new Set(
      latestPlan.schedule.slice(0, 6).map((item) => `${latestPlan.id}-${item.day}`)
    )
    setHighlightedPlanKeys(keys)

    const pulseTimer = setTimeout(() => setPlanPulse(false), 1400)
    const highlightTimer = setTimeout(() => setHighlightedPlanKeys(new Set()), 3500)
    return () => {
      clearTimeout(pulseTimer)
      clearTimeout(highlightTimer)
    }
  }, [latestPlan])

  useEffect(() => {
    const previousIds = previousTaskIdsRef.current
    const currentIds = tasks.map((task) => task.id)
    previousTaskIdsRef.current = currentIds

    if (previousIds.length === 0 && currentIds.length === 0) return

    const previousSet = new Set(previousIds)
    const newIds = currentIds.filter((id) => !previousSet.has(id))
    if (newIds.length === 0) return

    setStatus((current) => ({ ...current, tasks: 'Tasks Updated' }))
    setTasksPulse(true)
    setHighlightedTaskIds(new Set(newIds))

    const pulseTimer = setTimeout(() => setTasksPulse(false), 1400)
    const highlightTimer = setTimeout(() => setHighlightedTaskIds(new Set()), 3200)
    return () => {
      clearTimeout(pulseTimer)
      clearTimeout(highlightTimer)
    }
  }, [tasks])

  useEffect(() => {
    const currentId = currentFocusTask?.id ?? null
    const previousId = previousFocusIdRef.current
    previousFocusIdRef.current = currentId

    if (currentId && currentId !== previousId) {
      setStatus((current) => ({ ...current, focus: 'Focus Active' }))
      setFocusPulse(true)
      const timer = setTimeout(() => setFocusPulse(false), 1500)
      return () => clearTimeout(timer)
    }

    if (!currentId) {
      setStatus((current) => ({ ...current, focus: 'Idle' }))
    }
  }, [currentFocusTask])

  useEffect(() => {
    if (focusAutoStart && currentFocusTask) {
      setMode('focus')
      setTimeLeft(timerSettings.focus.duration)
      setIsRunning(true)
      setFocusAutoStart(false)
    }
  }, [focusAutoStart, currentFocusTask, setFocusAutoStart])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (timeLeft > 0) return

    setIsRunning(false)
    if (mode === 'focus') {
      incrementFocusSessions()
      addStudyHours(0.42)
      setSessionsThisCycle((previous) => previous + 1)
      if (currentFocusTask) completeFocusTask()
      setMode('shortBreak')
      setTimeLeft(timerSettings.shortBreak.duration)
    } else {
      setMode('focus')
      setTimeLeft(timerSettings.focus.duration)
    }
  }, [timeLeft, mode, currentFocusTask, completeFocusTask, incrementFocusSessions, addStudyHours])

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(timerSettings[mode].duration)
  }

  const startPauseTimer = () => {
    setIsRunning((previous) => !previous)
  }

  const activeTaskTitle = currentFocusTask?.title ?? 'Choose a task from chat or your list'
  const scheduleItems = latestPlan?.schedule ?? []

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/50 bg-card/85 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            <div className={cn(
              'rounded-xl border px-3 py-2 transition-all duration-300',
              planPulse ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border/40 bg-background/60'
            )}>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Plan</p>
              <p className="mt-1 text-xs font-semibold text-card-foreground">{status.plan}</p>
            </div>
            <div className={cn(
              'rounded-xl border px-3 py-2 transition-all duration-300',
              tasksPulse ? 'border-blue-500/40 bg-blue-500/10' : 'border-border/40 bg-background/60'
            )}>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Tasks</p>
              <p className="mt-1 text-xs font-semibold text-card-foreground">{status.tasks}</p>
            </div>
            <div className={cn(
              'rounded-xl border px-3 py-2 transition-all duration-300',
              focusPulse ? 'border-violet-500/40 bg-violet-500/10' : 'border-border/40 bg-background/60'
            )}>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Focus</p>
              <p className="mt-1 text-xs font-semibold text-card-foreground">{status.focus}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 bg-card/85 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="w-4 h-4 text-primary" />
            Study Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {latestPlan ? (
            <>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{latestPlan.examName}</p>
                <p className="text-xs text-muted-foreground">
                  {latestPlan.schedule.length} days · {latestPlan.hoursPerDay}h/day
                </p>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {scheduleItems.slice(0, 7).map((item) => (
                  <div
                    key={item.day}
                    className={cn(
                      'rounded-xl border bg-background/50 p-3 text-sm transition-all duration-300',
                      highlightedPlanKeys.has(`${latestPlan.id}-${item.day}`)
                        ? 'border-emerald-500/40 bg-emerald-500/8 shadow-sm shadow-emerald-500/20'
                        : 'border-border/40'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-card-foreground">Day {item.day}</span>
                      <span className="text-xs text-muted-foreground">{item.hours}h</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.topics.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-4 text-sm text-muted-foreground">
              Ask for a study plan and it will appear here instantly.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 bg-card/85 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ListTodo className="w-4 h-4 text-primary" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {tasks.length > 0 ? (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {tasks.slice(0, 8).map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                    highlightedTaskIds.has(task.id) &&
                      'border-blue-500/45 bg-blue-500/10 shadow-sm shadow-blue-500/20',
                    task.completed
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-muted-foreground'
                      : 'border-border/40 bg-background/50 hover:border-primary/30 hover:bg-primary/5'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      task.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-border bg-background'
                    )}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </span>
                  <span className={cn('flex-1 text-sm', task.completed && 'line-through')}>
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-4 text-sm text-muted-foreground">
              Add tasks from chat and they will appear here.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 bg-card/85 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="w-4 h-4 text-primary" />
            Focus Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-center">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Current Task</p>
            <p className="text-sm font-semibold text-card-foreground">{activeTaskTitle}</p>
            {currentFocusTask && (
              <div className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                <Target className="w-3 h-3" />
                Active from chat
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-background/60 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Clock3 className="w-3.5 h-3.5" />
              {timerSettings[mode].label}
            </div>
            <div className="mt-3 text-5xl font-black tracking-tight text-card-foreground">
              {formatTime(timeLeft)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Session {sessionsThisCycle + 1} of 4
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={resetTimer} className="h-11 w-11 rounded-full">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button onClick={startPauseTimer} className="h-11 rounded-full px-5">
              {isRunning ? <Pause className="mr-2 w-4 h-4" /> : <Play className="mr-2 w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}