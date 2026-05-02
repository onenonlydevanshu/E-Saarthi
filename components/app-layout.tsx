'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard, Sparkles, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DashboardPage } from '@/components/pages/dashboard'
import { ChatPanel } from '@/components/agent-chat'
import Onboarding from '@/components/onboarding'

export function AppLayout() {
  const { chatOpen, setChatOpen, exams, onboardingCompleted, userName, selectedExamId, studyHoursPerDay } = useAppStore()
  const [activeView, setActiveView] = useState<'chat' | 'dashboard'>('chat')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get exam name from selectedExamId
  const selectedExamName = selectedExamId ? exams.find(e => e.id === selectedExamId)?.name : null

  useEffect(() => {
    setChatOpen(activeView === 'dashboard')
  }, [activeView, setChatOpen])

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {mounted && !onboardingCompleted && <Onboarding isOpen={true} />}

      {activeView === 'chat' ? (
        <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary),0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(var(--primary),0.08),transparent_28%)]" />
          <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col justify-center">
            <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:px-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agent First</p>
                  <h1 className="text-sm font-semibold text-foreground sm:text-base">E-Saarthi</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onboardingCompleted && selectedExamName && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
                    <span>🎯</span>
                    <span>Target: {selectedExamName}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                  className="gap-2 rounded-xl"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Open Dashboard
                </Button>
              </div>
            </div>

            <ChatPanel
              mode="hero"
              onOpenDashboard={() => setActiveView('dashboard')}
            />
          </div>
        </main>
      ) : (
        <main className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary),0.1),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(var(--primary),0.06),transparent_30%)]" />
          <div className="relative mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('chat')}
                className="gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Agentic dashboard view is live
              </div>
            </div>

            <DashboardPage />
          </div>

          <div className="fixed inset-x-4 bottom-4 z-30 hidden lg:block lg:inset-y-4 lg:right-4 lg:left-auto lg:w-[420px]">
            <ChatPanel
              mode="dock"
              onOpenDashboard={() => setActiveView('dashboard')}
            />
          </div>
        </main>
      )}
    </div>
  )
}
