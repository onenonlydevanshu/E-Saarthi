'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  Trash2,
  ListChecks,
  RefreshCw,
  Zap,
  CalendarDays,
  Flame,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

const sampleTasks = [
  "Review previous day's notes and key concepts",
  'Complete 20 MCQs on Current Affairs',
  'Read one chapter of your primary textbook',
  'Practice numerical problems (30 mins)',
  'Watch a video lecture on weak topic',
  'Revise formulas and shortcuts',
  'Take a mini mock test (15 questions)',
  'Review and analyze mistakes from practice',
]

export function DailyTasksPage() {
  const { tasks, addTask, toggleTask, removeTask, clearTasks } = useAppStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const todayTasks = tasks.filter(
    (t) => t.createdAt.split('T')[0] === new Date().toISOString().split('T')[0]
  )

  const completedCount = todayTasks.filter((t) => t.completed).length
  const progress =
    todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0

  const generateTasks = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    clearTasks()
    const shuffled = [...sampleTasks].sort(() => Math.random() - 0.5)
    const selectedTasks = shuffled.slice(0, 5 + Math.floor(Math.random() * 2))
    selectedTasks.forEach((title) => {
      addTask({ title, completed: false })
    })
    setIsGenerating(false)
  }

  const allDone = todayTasks.length > 0 && completedCount === todayTasks.length

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in pb-8">
      {/* Header */}
      <header className="relative">
        <div
          className="absolute -top-12 -left-12 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden
        />
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground tracking-tight">
                {format(new Date(), 'EEEE, MMMM d')}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Daily <span className="gradient-text-bold">Tasks</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
              Your AI-curated study plan for today. Stay consistent, finish strong.
            </p>
          </div>

          {/* Right-aligned actions + live progress chip */}
          <div className="flex flex-wrap items-center gap-3">
            {todayTasks.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="w-9 h-9 -rotate-90">
                    <circle
                      className="text-secondary"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="transparent"
                      r="14"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="text-primary transition-all duration-500"
                      strokeWidth="3"
                      strokeDasharray={87.96}
                      strokeDashoffset={87.96 * (1 - progress / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="14"
                      cx="18"
                      cy="18"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-primary num-display">
                    {Math.round(progress)}
                  </span>
                </div>
                <div className="leading-tight">
                  <p className="num-display text-base font-bold text-card-foreground">
                    {completedCount}
                    <span className="text-muted-foreground/60 font-medium">
                      /{todayTasks.length}
                    </span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Done today
                  </p>
                </div>
              </div>
            )}

            {todayTasks.length > 0 && (
              <Button
                variant="outline"
                onClick={clearTasks}
                className="rounded-xl h-11"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <Button
              onClick={generateTasks}
              disabled={isGenerating}
              className="rounded-xl h-11 shadow-lg shadow-primary/25 gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  What Should I Study?
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-1 lg:sticky lg:top-6 lg:self-start">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <span className="tracking-tight">Today&apos;s Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center pt-2">
              <div className="relative inline-flex items-center justify-center">
                {/* Ambient glow */}
                <div
                  className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                  aria-hidden
                />
                <svg className="relative w-44 h-44 transform -rotate-90">
                  <circle
                    className="text-secondary"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="76"
                    cx="50%"
                    cy="50%"
                  />
                  <circle
                    className="text-primary transition-all duration-700 ease-out"
                    strokeWidth="10"
                    strokeDasharray={477.5}
                    strokeDashoffset={477.5 * (1 - progress / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="76"
                    cx="50%"
                    cy="50%"
                    style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="num-display text-5xl font-extrabold text-card-foreground tracking-tight">
                    {Math.round(progress)}
                    <span className="text-2xl text-muted-foreground/60 font-bold">
                      %
                    </span>
                  </span>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mt-1">
                    Complete
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-1.5">
              <p className="num-display text-lg font-bold text-card-foreground tracking-tight">
                {completedCount}{' '}
                <span className="text-muted-foreground font-medium">of</span>{' '}
                {todayTasks.length}{' '}
                <span className="text-muted-foreground font-medium">tasks</span>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {todayTasks.length === 0
                  ? 'Generate your tasks to get started.'
                  : allDone
                    ? "Amazing work — you've finished today's plan!"
                    : "Keep the momentum going, you're doing great."}
              </p>
            </div>

            {todayTasks.length > 0 && !allDone && (
              <Button
                variant="outline"
                className="w-full rounded-xl h-11 group"
                onClick={generateTasks}
              >
                <RefreshCw className="w-4 h-4 mr-2 transition-transform duration-500 group-hover:rotate-180" />
                Regenerate Tasks
              </Button>
            )}

            {allDone && (
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-scale-in">
                <Flame className="w-5 h-5" />
                <span className="font-semibold tracking-tight">
                  All tasks completed!
                </span>
                <Zap className="w-4 h-4" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="glass glass-dark lg:col-span-2 animate-fade-in-up stagger-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 shadow-inner">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="tracking-tight">Task Checklist</span>
              </CardTitle>
              {todayTasks.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {todayTasks.length} {todayTasks.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="relative mb-6">
                  <div
                    className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
                    aria-hidden
                  />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-xl shadow-primary/15 border border-primary/10">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-2xl text-card-foreground tracking-tight mb-2">
                  No tasks for today
                </h3>
                <p className="text-muted-foreground max-w-[340px] mb-8 leading-relaxed">
                  Let your AI mentor analyze your weak areas and generate a
                  personalized list of bite-sized study tasks.
                </p>
                <Button
                  onClick={generateTasks}
                  disabled={isGenerating}
                  size="lg"
                  className="rounded-xl shadow-lg shadow-primary/25 h-12 px-7 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Tasks
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {todayTasks.map((task, index) => (
                  <li
                    key={task.id}
                    className={cn(
                      'group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300',
                      'border',
                      task.completed
                        ? 'bg-gradient-to-r from-emerald-500/8 to-transparent border-emerald-500/20'
                        : 'bg-card/40 border-border/50 hover:bg-card/70 hover:border-primary/25 hover:shadow-md hover:-translate-y-0.5',
                      'animate-fade-in-up'
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Index */}
                    <span
                      className={cn(
                        'hidden sm:flex flex-shrink-0 items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-all duration-300 num-display',
                        task.completed
                          ? 'bg-emerald-500/15 text-emerald-500/80 line-through'
                          : 'bg-secondary/70 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 transition-transform duration-200 hover:scale-110 active:scale-90"
                      aria-label={
                        task.completed
                          ? `Mark "${task.title}" as not done`
                          : `Mark "${task.title}" as done`
                      }
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                      ) : (
                        <Circle className="w-7 h-7 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      )}
                    </button>

                    {/* Title */}
                    <span
                      className={cn(
                        'flex-1 text-sm sm:text-base transition-all duration-300 leading-snug',
                        task.completed
                          ? 'text-muted-foreground line-through decoration-emerald-500/40'
                          : 'text-card-foreground font-medium'
                      )}
                    >
                      {task.title}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => removeTask(task.id)}
                      className={cn(
                        'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                        'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                        'transition-all duration-200',
                        'opacity-0 group-hover:opacity-100 focus:opacity-100',
                        'sm:opacity-30'
                      )}
                      aria-label={`Remove "${task.title}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

