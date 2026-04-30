'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Flame, Clock, CheckCircle2, Target, TrendingUp, Sparkles } from 'lucide-react'

export function TopSummaryBar() {
  const { studyStreak, totalStudyHours, tasks, focusSessionsCompleted, getPerformanceData } = useAppStore()
  
  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length
  const performanceData = getPerformanceData()

  const summaryItems = [
    {
      icon: Flame,
      value: studyStreak,
      label: 'Day Streak',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      glowColor: 'shadow-orange-500/20',
    },
    {
      icon: Clock,
      value: `${totalStudyHours}h`,
      label: 'Studied',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      glowColor: 'shadow-blue-500/20',
    },
    {
      icon: CheckCircle2,
      value: `${completedTasks}/${totalTasks}`,
      label: 'Tasks',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20',
    },
    {
      icon: Target,
      value: focusSessionsCompleted,
      label: 'Focus',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      glowColor: 'shadow-violet-500/20',
    },
    {
      icon: TrendingUp,
      value: `${performanceData.overallAccuracy}%`,
      label: 'Accuracy',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      glowColor: 'shadow-primary/20',
    },
  ]

  return (
    <div className="mb-8 animate-fade-in">
      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {summaryItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl',
                  'bg-card/80 backdrop-blur-xl border',
                  item.borderColor,
                  'shadow-lg',
                  item.glowColor,
                  `animate-scale-in stagger-${index + 1}`
                )}
              >
                <div className={cn('p-2 rounded-xl', item.bgColor)}>
                  <Icon className={cn('w-4 h-4', item.color)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-card-foreground leading-none">
                    {item.value}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {item.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop: Full width bar */}
      <div className="hidden lg:block">
        <div
          className={cn(
            'relative flex items-center justify-between gap-6 px-7 py-5 rounded-3xl overflow-hidden',
            'bg-gradient-to-r from-card/90 via-card/80 to-card/90',
            'backdrop-blur-2xl border border-border/40',
            'shadow-[0_12px_40px_-16px_rgba(0,0,0,0.08),0_4px_12px_-6px_rgba(0,0,0,0.04)]',
            'dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5),0_4px_12px_-6px_rgba(0,0,0,0.3)]',
            'transition-all duration-300 hover:border-border/60'
          )}
        >
          {/* Subtle decorative gradient line on top */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            aria-hidden
          />

          {/* Left: Greeting with icon */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 shadow-inner flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
              <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-md -z-10" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                Today&apos;s Progress
              </p>
              <p className="text-base font-bold text-foreground tracking-tight mt-0.5">
                Keep up the great work
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-1.5">
            {summaryItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-2.5 rounded-2xl',
                    'border border-transparent',
                    'hover:border-border/60 hover:bg-secondary/40',
                    'transition-all duration-300 cursor-default',
                    `animate-fade-in stagger-${index + 1}`
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-xl transition-transform duration-300',
                      item.bgColor,
                      'group-hover:scale-110 group-hover:rotate-3'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <div className="flex flex-col">
                    <span className="num-display text-xl font-extrabold text-card-foreground leading-none">
                      {item.value}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
