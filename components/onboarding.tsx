"use client";

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Onboarding() {
  const exams = useAppStore((s) => s.exams)
  const setUserProfile = useAppStore((s) => s.setUserProfile)
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted)
  const setSelectedExamId = useAppStore((s) => s.setSelectedExamId)

  const [name, setName] = useState('')
  const [exam, setExam] = useState(exams[0]?.id ?? '')
  const [hours, setHours] = useState(2)
  const [saving, setSaving] = useState(false)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setSaving(true)
    setUserProfile({ userName: name || null, targetExam: exam || null, studyHoursPerDay: hours })
    if (exam) setSelectedExamId(exam)
    setOnboardingCompleted(true)
    setSaving(false)
  }

  return (
    <div className="min-h-[260px] w-full max-w-md mx-auto p-6 rounded-2xl border border-border/40 bg-card/90">
      <h3 className="text-lg font-semibold mb-2">Tell me about you</h3>
      <p className="text-sm text-muted-foreground mb-4">This helps me tailor plans and tasks. No account needed.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Your name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Devanshu" />
        </label>

        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Target exam</div>
          <Select onValueChange={(v) => setExam(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Study hours per day</div>
          <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} min={1} max={12} />
        </label>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Start Chat'}</Button>
        </div>
      </form>
    </div>
  )
}
