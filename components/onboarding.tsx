"use client";

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingProps {
  isOpen: boolean
}

export default function Onboarding({ isOpen }: OnboardingProps) {
  const exams = useAppStore((s) => s.exams)
  const setUserProfile = useAppStore((s) => s.setUserProfile)
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted)
  const setSelectedExamId = useAppStore((s) => s.setSelectedExamId)

  const [name, setName] = useState('')
  const [exam, setExam] = useState(exams[0]?.id ?? '')
  const [hours, setHours] = useState(2)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setUserProfile({ userName: name.trim() || null, targetExam: exam || null, studyHoursPerDay: hours })
    if (exam) setSelectedExamId(exam)
    setOnboardingCompleted(true)
    setSaving(false)
  }

  if (!isOpen || !mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />

      {/* Decorative gradient blobs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-30" aria-hidden />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-20" aria-hidden />

      {/* Modal card - Glassmorphism */}
      <div className="relative w-full max-w-md animate-fade-in z-10">
        <div className="rounded-[32px] border border-white/20 bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Premium gradient accent line at top */}
          <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

          {/* Content */}
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome to E-Saarthi</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Your AI exam preparation companion</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Let me get to know you better so I can create personalized study plans, smart daily tasks, and adaptive guidance tailored to your goals.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  What's your name?
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Devanshu"
                  className="rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/60"
                  disabled={saving}
                  autoFocus
                />
              </div>

              {/* Target Exam */}
              <div className="space-y-2">
                <label htmlFor="exam" className="block text-sm font-medium text-foreground">
                  Target Exam
                </label>
                <Select value={exam} onValueChange={(v) => setExam(v)} disabled={saving}>
                  <SelectTrigger className="rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 text-foreground">
                    <SelectValue placeholder="Choose your target exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Daily Study Hours */}
              <div className="space-y-2">
                <label htmlFor="hours" className="block text-sm font-medium text-foreground">
                  Daily Study Target (hours)
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="hours"
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(Math.max(1, Math.min(12, Number(e.target.value))))}
                    min={1}
                    max={12}
                    className="rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 text-foreground text-center"
                    disabled={saving}
                  />
                  <span className="text-sm text-muted-foreground font-medium">hours/day</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!name.trim() || saving}
                className="w-full rounded-xl h-11 font-medium bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    <span>Starting your journey...</span>
                  </div>
                ) : (
                  "Let's Get Started →"
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              No account or sign-up needed. Your data is stored locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
