'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  AlertTriangle,
  Star,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, differenceInDays } from 'date-fns'

export function DashboardPage() {
  const {
    exams,
    quizResults,
    setActivePage,
    adaptiveInsights,
    getPerformanceData,
    setChatOpen,
    userName,
    totalStudyHours,
    studyHoursPerDay,
  } = useAppStore()

  const performanceData = getPerformanceData()
  const upcomingExam = exams.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )[0]
  const daysUntilExam = upcomingExam
    ? differenceInDays(new Date(upcomingExam.date), new Date())
    : null

  const averageQuizScore =
    quizResults.length > 0
      ? Math.round(
          quizResults.reduce((acc, r) => acc + (r.score / r.total) * 100, 0) /
            quizResults.length
        )
      : 0

  // Stat tile config for the AI Insights card
  const insightStats = [
    {
      icon: Target,
      label: 'Accuracy',
      value: `${performanceData.overallAccuracy}%`,
      hint:
        performanceData.overallAccuracy >= 75
          ? 'Excellent!'
          : performanceData.overallAccuracy >= 60
          ? 'Good progress'
          : 'Needs improvement',
      tint: 'blue',
    },
    {
      icon: AlertTriangle,
      label: 'Focus Areas',
      values: adaptiveInsights.weakSubjects.slice(0, 2),
      tint: 'amber',
    },
    {
      icon: Star,
      label: 'Strengths',
      values: adaptiveInsights.strongSubjects.slice(0, 2),
      tint: 'emerald',
    },
    {
      icon: TrendingUp,
      label: 'Consistency',
      value: `${adaptiveInsights.studyPatterns.consistencyScore}%`,
      hint: 'Task completion',
      tint: 'violet',
    },
  ] as const

  const tintClasses: Record<string, string> = {
    blue: 'from-blue-500/12 to-blue-500/5 border-blue-500/20 [&_[data-icon]]:text-blue-500 [&_[data-icon-bg]]:bg-blue-500/10',
    amber:
      'from-amber-500/12 to-amber-500/5 border-amber-500/20 [&_[data-icon]]:text-amber-500 [&_[data-icon-bg]]:bg-amber-500/10',
    emerald:
      'from-emerald-500/12 to-emerald-500/5 border-emerald-500/20 [&_[data-icon]]:text-emerald-500 [&_[data-icon-bg]]:bg-emerald-500/10',
    violet:
      'from-violet-500/12 to-violet-500/5 border-violet-500/20 [&_[data-icon]]:text-violet-500 [&_[data-icon-bg]]:bg-violet-500/10',
  }

  return (
    <div className="relative space-y-10 animate-fade-in">
      {/* Decorative ambient glows */}
      <div
        className="glow-blob bg-primary/30 -top-32 -left-20 w-96 h-96"
        aria-hidden
      />
      <div
        className="glow-blob bg-accent/20 top-40 right-0 w-80 h-80"
        aria-hidden
      />

      {/* Welcome Header */}
      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-2">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-foreground">Welcome back, </span>
            <span className="gradient-text-bold">{userName || 'Student'}</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md">
            Ready to crush your study goals today? Your AI mentor is standing by
            whenever you need a hand.
          </p>
        </div>

        {upcomingExam && daysUntilExam !== null && daysUntilExam >= 0 && (
          <div
            className={cn(
              'group relative flex items-center gap-5 px-6 py-5 rounded-3xl',
              'bg-gradient-to-br from-card via-card/95 to-card/80',
              'border border-primary/20',
              'shadow-[0_12px_40px_-16px_rgba(99,102,241,0.35)]',
              'backdrop-blur-xl overflow-hidden',
              'animate-fade-in-up stagger-1',
              'transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30'
            )}
          >
            {/* Decorative gradient overlay on the card */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 opacity-50"
              aria-hidden
            />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 shadow-inner">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <div className="relative">
              <p className="section-heading mb-1.5">Next Exam</p>
              <p className="font-bold text-lg text-foreground tracking-tight leading-tight">
                {upcomingExam.name}
              </p>
              <p className="text-sm mt-1">
                {daysUntilExam === 0 ? (
                  <span className="text-primary font-semibold">Today!</span>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    <span className="text-foreground font-bold">
                      {daysUntilExam}
                    </span>{' '}
                    days remaining
                  </span>
                )}
              </p>
            </div>
            <Zap className="relative w-5 h-5 text-primary/70 animate-pulse ml-1" />
          </div>
        )}
      </div>

      {/* AI Insights Card */}
      <Card className="relative glass glass-dark card-hover animate-fade-in-up stagger-2 overflow-hidden">
        {/* Subtle dot-grid backdrop */}
        <div
          className="absolute inset-0 dot-grid opacity-40 pointer-events-none"
          aria-hidden
        />
        <CardHeader className="relative pb-5">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 shadow-inner">
                <Brain className="w-6 h-6 text-primary" />
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md -z-10" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">
                  AI Performance Insights
                </p>
                <p className="text-xs font-normal text-muted-foreground mt-1">
                  Updated in real-time as you study
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen(true)}
              className="gap-2 rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50 self-start sm:self-auto"
            >
              <MessageSquare className="w-4 h-4" />
              Get Advice
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {insightStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className={cn(
                    'stat-tile relative p-5 rounded-2xl',
                    'bg-gradient-to-br border',
                    tintClasses[stat.tint]
                  )}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      data-icon-bg
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                    >
                      <Icon data-icon className="w-4 h-4" />
                    </div>
                    <span className="section-heading">{stat.label}</span>
                  </div>
                  {stat.value ? (
                    <>
                      <p className="num-display text-3xl font-extrabold text-card-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {stat.hint}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-1.5 pt-0.5">
                      {stat.values?.map((subject) => (
                        <p
                          key={subject}
                          className="text-sm font-semibold text-card-foreground truncate leading-snug"
                        >
                          {subject}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Recommendations */}
          {adaptiveInsights.recommendedFocusAreas.length > 0 && (
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="section-heading">AI Recommendations</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {adaptiveInsights.recommendedFocusAreas
                  .slice(0, 2)
                  .map((rec, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl',
                        'bg-card/60 border border-border/40',
                        'transition-all duration-300 hover:border-primary/30 hover:bg-card/80'
                      )}
                    >
                      <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-md bg-primary/10 flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm text-card-foreground leading-relaxed">
                        {rec}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-3">
          <CardHeader className="pb-5">
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">Quick Actions</p>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  Jump to what you need
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              {
                icon: Target,
                label: "Generate Today's Tasks",
                hint: 'AI-curated daily list',
                page: 'daily-tasks',
                tint: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Calendar,
                label: 'Create Study Plan',
                hint: 'Adaptive 7-day schedule',
                page: 'study-planner',
                tint: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Trophy,
                label: 'Take Mock Test',
                hint: 'Practice & assess',
                page: 'mock-tests',
                tint: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Clock,
                label: 'Start Focus Session',
                hint: 'Pomodoro timer',
                page: 'focus-mode',
                tint: 'text-violet-500',
                bg: 'bg-violet-500/10',
              },
            ].map((action) => (
              <button
                key={action.page}
                onClick={() => setActivePage(action.page)}
                className={cn(
                  'group relative w-full flex items-center gap-4 p-4 rounded-2xl text-left',
                  'border border-border/50 bg-card/30',
                  'transition-all duration-300 ease-out',
                  'hover:border-primary/30 hover:bg-card/70 hover:-translate-y-0.5',
                  'hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-300 group-hover:scale-110',
                    action.bg
                  )}
                >
                  <action.icon className={cn('w-5 h-5', action.tint)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-card-foreground leading-tight">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.hint}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card className="glass glass-dark card-hover animate-fade-in-up stagger-4">
          <CardHeader className="pb-5">
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">Performance</p>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  Your test history at a glance
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            {/* Average Quiz Score */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="section-heading">Average Score</span>
                <span className="num-display text-4xl font-extrabold text-card-foreground">
                  {averageQuizScore}
                  <span className="text-xl text-muted-foreground/70 ml-1">
                    %
                  </span>
                </span>
              </div>
              <div className="relative h-2.5 bg-secondary/60 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  style={{ width: `${averageQuizScore}%` }}
                />
              </div>
            </div>

            {/* Recent Quiz Results */}
            <div className="space-y-3">
              <p className="section-heading">Recent Tests</p>
              <div className="space-y-2">
                {quizResults.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground border border-dashed border-border/50 rounded-2xl">
                    <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No tests taken yet</p>
                    <p className="text-xs mt-1">
                      Take your first mock to see your stats
                    </p>
                  </div>
                ) : (
                  quizResults
                    .slice(-3)
                    .reverse()
                    .map((result) => {
                      const pct = result.score / result.total
                      return (
                        <div
                          key={result.id}
                          className={cn(
                            'group flex items-center justify-between py-3 px-4 rounded-xl',
                            'bg-secondary/40 border border-border/30',
                            'hover:bg-secondary/70 hover:border-border/60',
                            'transition-all duration-200 animate-slide-in'
                          )}
                        >
                          <span className="text-sm font-semibold text-card-foreground truncate pr-3">
                            {result.examName}
                          </span>
                          <span
                            className={cn(
                              'num-display text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap',
                              pct >= 0.7
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : pct >= 0.5
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-red-500/15 text-red-500'
                            )}
                          >
                            {result.score}/{result.total}
                          </span>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Exams Preview */}
        <Card className="glass glass-dark card-hover lg:col-span-2 animate-fade-in-up stagger-5">
          <CardHeader className="flex flex-row items-center justify-between pb-5">
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">
                  Upcoming Exams
                </p>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  Stay ahead of your schedule
                </p>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePage('upcoming-exams')}
              className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {exams.length === 0 ? (
                <div className="col-span-full text-center py-14 text-muted-foreground border border-dashed border-border/50 rounded-2xl">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No upcoming exams</p>
                  <Button
                    variant="link"
                    onClick={() => setActivePage('upcoming-exams')}
                    className="text-primary mt-1"
                  >
                    Add your first exam
                  </Button>
                </div>
              ) : (
                exams.slice(0, 4).map((exam, index) => {
                  const days = differenceInDays(new Date(exam.date), new Date())
                  const isUrgent = days <= 7 && days >= 0
                  return (
                    <div
                      key={exam.id}
                      className={cn(
                        'group relative p-5 rounded-2xl border overflow-hidden',
                        'bg-gradient-to-br from-card/80 to-card/40',
                        'border-border/40',
                        'transition-all duration-300 ease-out',
                        'hover:border-primary/30 hover:-translate-y-1',
                        'hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.15)]',
                        isUrgent &&
                          'border-amber-500/30 bg-gradient-to-br from-amber-500/8 to-amber-500/3',
                        `animate-scale-in stagger-${Math.min(index + 1, 4)}`
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                            exam.category === 'government'
                              ? 'bg-blue-500/15 text-blue-500'
                              : 'bg-violet-500/15 text-violet-500'
                          )}
                        >
                          {exam.category === 'government' ? 'Govt' : 'Private'}
                        </span>
                        {days >= 0 && (
                          <span
                            className={cn(
                              'num-display text-xs font-bold px-2 py-0.5 rounded-md',
                              isUrgent
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'text-muted-foreground bg-secondary/60'
                            )}
                          >
                            {days === 0 ? 'Today' : `${days}d`}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-card-foreground truncate mb-1.5 group-hover:text-primary transition-colors leading-tight">
                        {exam.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {format(new Date(exam.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
