'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Target,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Clock,
  BookOpen,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

const timerSettings = {
  focus: { duration: 25 * 60, label: 'Focus Time', color: 'text-primary', bgColor: 'from-primary/20 to-primary/5' },
  shortBreak: { duration: 5 * 60, label: 'Short Break', color: 'text-emerald-500', bgColor: 'from-emerald-500/20 to-emerald-500/5' },
  longBreak: { duration: 15 * 60, label: 'Long Break', color: 'text-blue-500', bgColor: 'from-blue-500/20 to-blue-500/5' },
}

export function FocusModePage() {
  const {
    focusSessionsCompleted,
    incrementFocusSessions,
    addStudyHours,
    currentFocusTask,
    setCurrentFocusTask,
    completeFocusTask,
    tasks,
    focusAutoStart,
    setFocusAutoStart,
  } = useAppStore()
  
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(timerSettings.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sessionsThisCycle, setSessionsThisCycle] = useState(0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const playSound = useCallback(() => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      setTimeout(() => oscillator.stop(), 200)
    }
  }, [soundEnabled])

  const handleTimerComplete = useCallback(() => {
    playSound()
    setIsRunning(false)

    if (mode === 'focus') {
      incrementFocusSessions()
      addStudyHours(0.42)
      const newSessions = sessionsThisCycle + 1
      setSessionsThisCycle(newSessions)

      // If a task is selected, auto-complete it when the focus session ends.
      if (currentFocusTask) {
        completeFocusTask()
      }

      if (newSessions >= 4) {
        setMode('longBreak')
        setTimeLeft(timerSettings.longBreak.duration)
        setSessionsThisCycle(0)
      } else {
        setMode('shortBreak')
        setTimeLeft(timerSettings.shortBreak.duration)
      }
    } else {
      setMode('focus')
      setTimeLeft(timerSettings.focus.duration)
    }
  }, [
    mode,
    sessionsThisCycle,
    incrementFocusSessions,
    addStudyHours,
    playSound,
    currentFocusTask,
    completeFocusTask,
  ])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft, handleTimerComplete])

  // Auto-start the Pomodoro timer when the agent triggers `start_focus`.
  // The agent sets `focusAutoStart=true` along with `currentFocusTask` and
  // navigates here. We snap the timer to a fresh focus session and run it,
  // then clear the one-shot flag so manual navigation never auto-starts.
  useEffect(() => {
    if (focusAutoStart && currentFocusTask) {
      setMode('focus')
      setTimeLeft(timerSettings.focus.duration)
      setIsRunning(true)
      setFocusAutoStart(false)
    }
  }, [focusAutoStart, currentFocusTask, setFocusAutoStart])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(timerSettings[mode].duration)
  }

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    setTimeLeft(timerSettings[newMode].duration)
    setIsRunning(false)
  }

  const clearFocusTask = () => {
    setCurrentFocusTask(null)
    setIsRunning(false)
    resetTimer()
  }

  // Get incomplete tasks for quick selection
  const incompleteTasks = tasks.filter(t => !t.completed).slice(0, 5)

  const progress = 1 - timeLeft / timerSettings[mode].duration
  const circumference = 2 * Math.PI * 140

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 animate-fade-in relative">
      <div className="w-full max-w-xl space-y-7 sm:space-y-8">
        {/* Header */}
        <header className="text-center space-y-3 relative">
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10"
            aria-hidden
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide text-foreground">
              Pomodoro Technique
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Focus <span className="gradient-text-bold">Mode</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Deep work starts here. One session at a time.
          </p>
        </header>

        {/* Current Task Card */}
        {currentFocusTask ? (
          <Card className="glass glass-dark border-primary/30 animate-fade-in-up">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Currently Studying</p>
                    <p className="text-lg font-semibold text-card-foreground">{currentFocusTask.title}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFocusTask}
                  className="rounded-xl text-muted-foreground hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : incompleteTasks.length > 0 ? (
          <Card className="glass glass-dark animate-fade-in-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                Select a Task to Focus On
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {incompleteTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setCurrentFocusTask({ id: task.id, title: task.title })}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl',
                    'bg-secondary/50 hover:bg-secondary',
                    'border border-border/50 hover:border-primary/30',
                    'transition-all duration-200',
                    'flex items-center gap-3 group'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                  <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">
                Or start without a task for general focus time
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Mode Selector */}
        <div className="flex gap-3 justify-center">
          {[
            { id: 'focus' as const, icon: Target, label: 'Focus' },
            { id: 'shortBreak' as const, icon: Coffee, label: 'Short' },
            { id: 'longBreak' as const, icon: Coffee, label: 'Long' },
          ].map((item) => (
            <Button
              key={item.id}
              variant={mode === item.id ? 'default' : 'outline'}
              onClick={() => switchMode(item.id)}
              className={cn(
                'flex-1 max-w-[130px] h-12 rounded-xl gap-2 transition-all duration-300',
                mode === item.id && 'shadow-lg shadow-primary/20'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Timer Card */}
        <Card className={cn(
          'glass glass-dark overflow-hidden',
          'bg-gradient-to-br',
          timerSettings[mode].bgColor
        )}>
          <CardContent className="p-8 sm:p-12">
            <div className="relative flex items-center justify-center">
              {/* Progress Circle */}
              <svg className="w-72 h-72 sm:w-80 sm:h-80 transform -rotate-90">
                <circle
                  className="text-secondary/50"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="140"
                  cx="50%"
                  cy="50%"
                />
                <circle
                  className={cn('transition-all duration-1000 ease-out', timerSettings[mode].color)}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="140"
                  cx="50%"
                  cy="50%"
                  style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                />
              </svg>

              {/* Time Display */}
              <div className="absolute text-center">
                <p
                  className={cn(
                    'text-[11px] uppercase tracking-[0.16em] font-bold mb-3 px-3 py-1 rounded-full inline-block',
                    'bg-background/60 backdrop-blur-sm border border-border/40',
                    timerSettings[mode].color
                  )}
                >
                  {timerSettings[mode].label}
                </p>
                <p className="num-display text-7xl sm:text-[5.5rem] font-extrabold text-card-foreground font-mono tracking-tighter leading-none">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Session{' '}
                    <span className="num-display font-bold text-card-foreground">
                      {sessionsThisCycle + 1}
                    </span>{' '}
                    of 4
                  </span>
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-5 mt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={resetTimer}
                className="w-14 h-14 rounded-2xl border-2 transition-all duration-300 hover:scale-105"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button
                onClick={toggleTimer}
                size="lg"
                className={cn(
                  'w-24 h-24 rounded-3xl text-lg transition-all duration-300',
                  'shadow-2xl hover:scale-105 active:scale-95',
                  isRunning 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30' 
                    : 'bg-gradient-to-br from-primary to-primary/80 shadow-primary/30'
                )}
              >
                {isRunning ? (
                  <Pause className="w-10 h-10" />
                ) : (
                  <Play className="w-10 h-10 ml-1" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-14 h-14 rounded-2xl border-2 transition-all duration-300 hover:scale-105"
              >
                {soundEnabled ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass glass-dark card-hover animate-fade-in-up stagger-1 group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-bold">
                  Total
                </span>
              </div>
              <p className="num-display text-4xl font-extrabold text-primary leading-none">
                {focusSessionsCompleted}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                Sessions Completed
              </p>
            </CardContent>
          </Card>
          <Card className="glass glass-dark card-hover animate-fade-in-up stagger-2 group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-bold">
                  Focus
                </span>
              </div>
              <p className="num-display text-4xl font-extrabold text-emerald-500 leading-none">
                {Math.floor((focusSessionsCompleted * 25) / 60)}
                <span className="text-2xl text-emerald-500/70">h </span>
                {(focusSessionsCompleted * 25) % 60}
                <span className="text-2xl text-emerald-500/70">m</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                Total Focus Time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <Card className="glass glass-dark animate-fade-in-up stagger-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Pomodoro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { num: 1, text: 'Focus for 25 mins, then take a 5-min break' },
                { num: 2, text: 'After 4 sessions, enjoy a 15-min break' },
                { num: 3, text: 'Remove all distractions during focus' },
                { num: 4, text: 'Stretch and hydrate during breaks' },
              ].map((tip) => (
                <div 
                  key={tip.num} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {tip.num}
                  </span>
                  <p className="text-sm text-muted-foreground">{tip.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
