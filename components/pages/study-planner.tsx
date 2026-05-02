'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  BookOpen,
  Trash2,
  Plus,
  Target,
  Zap,
  Wand2,
  MessageSquare,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, addDays, differenceInDays } from 'date-fns'

// Plans created within this many ms are considered "freshly generated"
// and get the AI highlight treatment.
const FRESH_PLAN_WINDOW_MS = 30_000

export function StudyPlannerPage() {
  const { studyPlans, addStudyPlan, removeStudyPlan, setChatOpen } = useAppStore()
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('4')
  const [isGenerating, setIsGenerating] = useState(false)
  const [dismissedFreshId, setDismissedFreshId] = useState<string | null>(null)
  const [hasMounted, setHasMounted] = useState(false)
  const [freshPlanId, setFreshPlanId] = useState<string | null>(null)
  const [todayIso, setTodayIso] = useState('')

  // Track which plan IDs are currently mounted so we can detect new ones
  // arriving from the AI agent and trigger highlight + scroll behavior.
  const knownPlanIdsRef = useRef<Set<string>>(new Set(studyPlans.map((p) => p.id)))
  const planRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const [highlightedPlanId, setHighlightedPlanId] = useState<string | null>(null)

  const freshPlan = useMemo(() => {
    if (!freshPlanId) return null
    return studyPlans.find((plan) => plan.id === freshPlanId) ?? null
  }, [studyPlans, freshPlanId])

  useEffect(() => {
    setHasMounted(true)
    setTodayIso(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (!hasMounted || studyPlans.length === 0) return

    const sorted = [...studyPlans].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const latest = sorted[0]
    const ageMs = new Date().getTime() - new Date(latest.createdAt).getTime()

    if (ageMs <= FRESH_PLAN_WINDOW_MS && latest.id !== dismissedFreshId) {
      setFreshPlanId(latest.id)
      return
    }

    setFreshPlanId(null)
  }, [hasMounted, studyPlans, dismissedFreshId])

  // When a brand-new plan appears (e.g. AI added one), highlight it and
  // scroll it into view automatically.
  useEffect(() => {
    const known = knownPlanIdsRef.current
    const incoming = studyPlans.filter((p) => !known.has(p.id))

    if (incoming.length > 0) {
      const newest = incoming[incoming.length - 1]
      setHighlightedPlanId(newest.id)

      // Scroll the new plan into view after it mounts
      requestAnimationFrame(() => {
        const el = planRefs.current.get(newest.id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })

      // Auto-clear the highlight after a few seconds
      const t = window.setTimeout(() => setHighlightedPlanId(null), 4500)

      // Update tracker
      studyPlans.forEach((p) => known.add(p.id))

      return () => window.clearTimeout(t)
    }

    // Keep tracker in sync with current ids (handles deletions too)
    knownPlanIdsRef.current = new Set(studyPlans.map((p) => p.id))
  }, [studyPlans])

  const generateSchedule = async () => {
    if (!examName || !examDate || !hoursPerDay) return

    setIsGenerating(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const days = differenceInDays(new Date(examDate), new Date())
    const schedule = []

    const topics = [
      ['Introduction & Basics', 'Core Concepts'],
      ['Advanced Topics', 'Problem Solving'],
      ['Practice Questions', 'Mock Tests'],
      ['Revision', 'Weak Areas'],
      ['Formula Review', 'Quick Notes'],
      ['Previous Year Papers', 'Analysis'],
      ['Final Revision', 'Rest & Prepare'],
    ]

    for (let i = 0; i < Math.min(days, 30); i++) {
      const topicIndex = i % topics.length
      schedule.push({
        day: i + 1,
        date: format(addDays(new Date(), i + 1), 'yyyy-MM-dd'),
        topics: topics[topicIndex],
        hours: parseInt(hoursPerDay),
      })
    }

    addStudyPlan({
      examName,
      examDate,
      hoursPerDay: parseInt(hoursPerDay),
      schedule,
    })

    setExamName('')
    setExamDate('')
    setHoursPerDay('4')
    setIsGenerating(false)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>AI-Powered Planning</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground text-lg">
          Create personalized study schedules for your exams
        </p>
      </div>

      {/* Fresh AI plan banner */}
      {freshPlan && (
        <div
          className={cn(
            'relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl',
            'bg-gradient-to-r from-primary/15 via-primary/8 to-accent/10',
            'border border-primary/30 shadow-lg shadow-primary/10',
            'animate-fade-in-up'
          )}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 shadow-inner flex-shrink-0">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              AI Agent Update
            </p>
            <p className="font-bold text-card-foreground text-base sm:text-lg">
              PrepMaster just added &ldquo;{freshPlan.examName}&rdquo;
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {freshPlan.schedule.length} days planned at {freshPlan.hoursPerDay}h per day. Scroll down to view it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen(true)}
              className="rounded-xl border-primary/30 hover:bg-primary/10 gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Refine with AI
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissedFreshId(freshPlan.id)}
              className="rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create Plan Form */}
        <Card className="glass glass-dark card-hover lg:col-span-1 animate-fade-in-up stagger-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              Create New Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="examName" className="text-sm font-medium">Exam Name</Label>
              <Input
                id="examName"
                placeholder="e.g., UPSC Prelims"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="h-12 rounded-xl input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examDate" className="text-sm font-medium">Exam Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="h-12 rounded-xl input-premium"
                min={todayIso || format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm font-medium">Study Hours per Day</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                max="12"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="h-12 rounded-xl input-premium"
              />
            </div>
            <Button
              onClick={generateSchedule}
              disabled={!examName || !examDate || !hoursPerDay || isGenerating}
              className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Schedule
                </>
              )}
            </Button>

            {/* AI hint */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
              <Wand2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Or just ask PrepMaster: <span className="text-card-foreground font-medium">&ldquo;Create a 30-day study plan for UPSC&rdquo;</span> and it&apos;ll appear here automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Study Plans List */}
        <div className="lg:col-span-2 space-y-5">
          {studyPlans.length === 0 ? (
            <Card className="glass glass-dark animate-fade-in-up stagger-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-xl text-card-foreground mb-2">No Study Plans Yet</h3>
                <p className="text-muted-foreground max-w-[320px] mb-6">
                  Create one with the form, or ask PrepMaster to build one for you.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setChatOpen(true)}
                  className="rounded-xl gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask PrepMaster
                </Button>
              </CardContent>
            </Card>
          ) : (
            studyPlans.map((plan, planIndex) => {
              const isHighlighted = plan.id === highlightedPlanId
              const isFresh = freshPlan?.id === plan.id

              return (
                <div
                  key={plan.id}
                  ref={(el) => {
                    if (el) planRefs.current.set(plan.id, el)
                    else planRefs.current.delete(plan.id)
                  }}
                  className="scroll-mt-24"
                >
                  <Card
                    className={cn(
                      'glass glass-dark card-hover overflow-hidden transition-all duration-500',
                      'animate-fade-in-up',
                      isHighlighted &&
                        'ring-2 ring-primary/60 shadow-2xl shadow-primary/20 scale-[1.005]'
                    )}
                    style={{ animationDelay: `${planIndex * 0.1}s` }}
                  >
                    <CardHeader className="flex flex-row items-start justify-between pb-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'flex items-center justify-center w-12 h-12 rounded-2xl shadow-inner',
                            isFresh
                              ? 'bg-gradient-to-br from-primary/30 to-primary/10'
                              : 'bg-gradient-to-br from-primary/20 to-primary/5'
                          )}
                        >
                          {isFresh ? (
                            <Wand2 className="w-6 h-6 text-primary" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="text-xl">{plan.examName}</CardTitle>
                            {isFresh && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/25 animate-pulse">
                                <Sparkles className="w-3 h-3" />
                                AI Generated
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(plan.examDate), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                              <Clock className="w-4 h-4" />
                              {plan.hoursPerDay}h/day
                            </span>
                            <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium">
                              <Target className="w-4 h-4" />
                              {plan.schedule.length} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStudyPlan(plan.id)}
                        className="text-muted-foreground hover:text-destructive rounded-xl"
                        aria-label={`Delete ${plan.examName} plan`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[450px] overflow-y-auto pr-2">
                        {plan.schedule.slice(0, 16).map((day, index) => {
                          // Defensively handle missing/invalid dates
                          const dateValid =
                            day.date && !Number.isNaN(new Date(day.date).getTime())
                          return (
                            <div
                              key={day.day}
                              className={cn(
                                'group p-4 rounded-2xl border transition-all duration-300',
                                'bg-gradient-to-br from-secondary/40 to-secondary/20',
                                'border-border/30 hover:border-primary/30',
                                'hover:shadow-md hover:-translate-y-0.5',
                                'animate-scale-in'
                              )}
                              style={{ animationDelay: `${index * 0.03}s` }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                  Day {day.day}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {dateValid ? format(new Date(day.date), 'MMM d') : '—'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {day.topics.map((topic, i) => (
                                  <p
                                    key={i}
                                    className="text-sm text-card-foreground truncate group-hover:text-primary transition-colors"
                                  >
                                    {topic}
                                  </p>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                <Zap className="w-3.5 h-3.5" />
                                {day.hours} hours
                              </div>
                            </div>
                          )
                        })}
                        {plan.schedule.length > 16 && (
                          <div className="p-4 rounded-2xl border border-dashed border-border/50 flex items-center justify-center bg-secondary/10">
                            <span className="text-sm text-muted-foreground text-center">
                              +{plan.schedule.length - 16} more days
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
