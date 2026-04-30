'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Flame,
  Clock,
  CheckCircle2,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  Zap,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import { format, subDays } from 'date-fns'

export function ProgressTrackerPage() {
  const {
    studyStreak,
    totalStudyHours,
    tasks,
    quizResults,
    focusSessionsCompleted,
  } = useAppStore()

  const completedTasks = tasks.filter((t) => t.completed).length
  const taskCompletionRate = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0

  const averageQuizScore = quizResults.length > 0
    ? Math.round(
        quizResults.reduce((acc, r) => acc + (r.score / r.total) * 100, 0) /
          quizResults.length
      )
    : 0

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    return {
      day: format(date, 'EEE'),
      hours: Math.floor(Math.random() * 4) + 2,
      tasks: Math.floor(Math.random() * 5) + 3,
    }
  })

  const quizPerformance = quizResults.slice(-7).map((result, index) => ({
    name: `Quiz ${index + 1}`,
    score: Math.round((result.score / result.total) * 100),
  }))

  const stats = [
    {
      label: 'Study Streak',
      value: `${studyStreak}`,
      suffix: 'days',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-500/15 to-orange-500/5',
      borderColor: 'border-orange-500/20',
    },
    {
      label: 'Study Hours',
      value: `${totalStudyHours}`,
      suffix: 'hours',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-500/15 to-blue-500/5',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Task Rate',
      value: `${taskCompletionRate}`,
      suffix: '%',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Quiz Score',
      value: `${averageQuizScore}`,
      suffix: '%',
      icon: Trophy,
      color: 'text-amber-500',
      bgColor: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Focus Sessions',
      value: focusSessionsCompleted.toString(),
      suffix: 'done',
      icon: Target,
      color: 'text-violet-500',
      bgColor: 'bg-gradient-to-br from-violet-500/15 to-violet-500/5',
      borderColor: 'border-violet-500/20',
    },
    {
      label: 'Weekly Progress',
      value: '+15',
      suffix: '%',
      icon: TrendingUp,
      color: 'text-teal-500',
      bgColor: 'bg-gradient-to-br from-teal-500/15 to-teal-500/5',
      borderColor: 'border-teal-500/20',
    },
  ]

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in pb-8">
      {/* Header */}
      <header className="relative">
        <div
          className="absolute -top-12 right-1/3 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden
        />
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide text-foreground">
              Analytics Dashboard
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Progress <span className="gradient-text-bold">Tracker</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Monitor your study cadence, identify trends, and turn data into a
            sharper preparation strategy.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className={cn(
                'glass glass-dark stat-tile border group cursor-default',
                stat.borderColor,
                'animate-fade-in-up'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-inner',
                      stat.bgColor
                    )}
                  >
                    <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', stat.color)} />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-muted-foreground/60">
                    {stat.suffix}
                  </span>
                </div>
                <p className="num-display text-2xl sm:text-3xl font-extrabold text-card-foreground leading-none tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-2 font-semibold tracking-wide">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Study Hours */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              Weekly Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="day"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {quizPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="score"
                      fill="hsl(var(--primary))"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Take some quizzes to see your performance trend</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Study Streak */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6 relative">
              <div
                className="absolute inset-0 bg-orange-500/15 blur-3xl rounded-full"
                aria-hidden
              />
              <div className="relative text-center">
                <div className="num-display text-7xl font-extrabold text-orange-500 mb-2 animate-float drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]">
                  {studyStreak}
                </div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-bold">
                  days in a row
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-2">
              {Array.from({ length: 7 }, (_, i) => {
                const active = i < studyStreak % 7
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300',
                      active
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:scale-110'
                        : 'bg-secondary/70 text-muted-foreground/60 border border-border/40'
                    )}
                  >
                    {format(subDays(new Date(), 6 - i), 'E')[0]}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quiz Results */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-4">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              Recent Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {quizResults
                .slice(-5)
                .reverse()
                .map((result, index) => {
                  const percentage = Math.round(
                    (result.score / result.total) * 100
                  )
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        'flex items-center justify-between gap-3 p-3.5 rounded-xl',
                        'bg-card/40 border border-border/40',
                        'hover:bg-card/70 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300',
                        'animate-slide-in'
                      )}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground tracking-tight truncate">
                          {result.examName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                          {format(new Date(result.date), 'MMM d, yyyy')} ·{' '}
                          <span className="num-display">
                            {result.score}/{result.total}
                          </span>
                        </p>
                      </div>
                      <div
                        className={cn(
                          'num-display flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-extrabold tracking-tight border',
                          percentage >= 70
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                            : percentage >= 50
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/25'
                              : 'bg-red-500/15 text-red-500 border-red-500/25'
                        )}
                      >
                        {percentage}%
                      </div>
                    </div>
                  )
                })}
              {quizResults.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary/50 border border-border/40 flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No quiz results yet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="tracking-tight">Monthly Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                {
                  label: 'Study Hours',
                  current: totalStudyHours,
                  target: 60,
                  unit: 'h',
                  color: 'from-primary to-primary/60',
                },
                {
                  label: 'Tasks Done',
                  current: completedTasks,
                  target: 50,
                  unit: '',
                  color: 'from-emerald-500 to-emerald-400/70',
                },
                {
                  label: 'Quizzes Taken',
                  current: quizResults.length,
                  target: 20,
                  unit: '',
                  color: 'from-amber-500 to-amber-400/70',
                },
              ].map((goal, index) => {
                const pct = Math.min((goal.current / goal.target) * 100, 100)
                return (
                  <div
                    key={goal.label}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-baseline text-sm mb-2">
                      <span className="text-muted-foreground font-semibold tracking-tight">
                        {goal.label}
                      </span>
                      <span className="num-display text-card-foreground font-bold tracking-tight">
                        {goal.current}
                        {goal.unit}
                        <span className="text-muted-foreground/60 font-medium">
                          {' '}
                          / {goal.target}
                          {goal.unit}
                        </span>
                      </span>
                    </div>
                    <div className="h-3 bg-secondary/60 rounded-full overflow-hidden border border-border/40">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700 bg-gradient-to-r shadow-[0_0_10px_currentColor]/20',
                          goal.color
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
