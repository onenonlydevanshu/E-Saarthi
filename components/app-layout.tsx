'use client'

import { memo, Suspense, lazy, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/sidebar'
import { ChatPanel } from '@/components/chat-panel'
import { TopSummaryBar } from '@/components/top-summary-bar'
import { Menu, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/loading-skeleton'

// Lazy load page components for better code splitting
const DashboardPage = lazy(() => import('@/components/pages/dashboard').then(m => ({ default: m.DashboardPage })))
const StudyPlannerPage = lazy(() => import('@/components/pages/study-planner').then(m => ({ default: m.StudyPlannerPage })))
const DailyTasksPage = lazy(() => import('@/components/pages/daily-tasks').then(m => ({ default: m.DailyTasksPage })))
const UpcomingExamsPage = lazy(() => import('@/components/pages/upcoming-exams').then(m => ({ default: m.UpcomingExamsPage })))
const MockTestsPage = lazy(() => import('@/components/pages/mock-tests').then(m => ({ default: m.MockTestsPage })))
const ProgressTrackerPage = lazy(() => import('@/components/pages/progress-tracker').then(m => ({ default: m.ProgressTrackerPage })))
const FocusModePage = lazy(() => import('@/components/pages/focus-mode').then(m => ({ default: m.FocusModePage })))

const pages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: DashboardPage,
  'study-planner': StudyPlannerPage,
  'daily-tasks': DailyTasksPage,
  'upcoming-exams': UpcomingExamsPage,
  'mock-tests': MockTestsPage,
  progress: ProgressTrackerPage,
  'focus-mode': FocusModePage,
}

// Memoized Mobile Header component
const MobileHeader = memo(function MobileHeader({ 
  onToggleSidebar 
}: { 
  onToggleSidebar: () => void 
}) {
  return (
    <header className={cn(
      'lg:hidden fixed top-0 left-0 right-0 z-30',
      'h-16 bg-background/80 backdrop-blur-2xl',
      'border-b border-border/50',
      'flex items-center gap-4 px-4',
      'shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="rounded-xl"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">ExamPrep AI</h1>
        </div>
      </div>
    </header>
  )
})

// Page loading fallback
function PageLoadingFallback() {
  return (
    <div className="animate-fade-in">
      <DashboardSkeleton />
    </div>
  )
}

export function AppLayout() {
  const { sidebarOpen, setSidebarOpen, activePage, chatOpen } = useAppStore()

  const ActivePage = useMemo(() => pages[activePage] || DashboardPage, [activePage])

  const handleToggleSidebar = useMemo(
    () => () => setSidebarOpen(!sidebarOpen),
    [setSidebarOpen, sidebarOpen]
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader onToggleSidebar={handleToggleSidebar} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onKeyDown={(e) => e.key === 'Enter' && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'lg:block transition-all duration-300',
          sidebarOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-400 ease-out',
          'pt-16 lg:pt-0',
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-[76px]',
          chatOpen ? 'lg:mr-[440px]' : ''
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto">
          <TopSummaryBar />
          <Suspense fallback={<PageLoadingFallback />}>
            <ActivePage />
          </Suspense>
        </div>
      </main>

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  )
}
