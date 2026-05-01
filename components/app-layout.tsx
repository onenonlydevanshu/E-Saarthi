'use client'

import { memo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/sidebar'
import { ChatPanel } from '@/components/chat-panel'
import { RightPanel } from '@/components/right-panel'
import { TopSummaryBar } from '@/components/top-summary-bar'
import { Menu, GraduationCap, Sparkles, MessageSquare, LayoutPanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export function AppLayout() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const [mobileView, setMobileView] = useState<'chat' | 'panels'>('chat')

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen)

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
          sidebarOpen ? 'lg:ml-[220px]' : 'lg:ml-[76px]'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1800px] mx-auto space-y-6">
          <TopSummaryBar />

          <div className="lg:hidden flex items-center gap-2 rounded-2xl border border-border/50 bg-card/85 p-1">
            <Button
              variant={mobileView === 'chat' ? 'default' : 'ghost'}
              onClick={() => setMobileView('chat')}
              className="flex-1 rounded-xl gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={mobileView === 'panels' ? 'default' : 'ghost'}
              onClick={() => setMobileView('panels')}
              className="flex-1 rounded-xl gap-2"
            >
              <LayoutPanelLeft className="w-4 h-4" />
              Panels
            </Button>
          </div>

          <section className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1.9fr)_minmax(360px,1fr)] xl:gap-6 items-start">
            <div className={cn('space-y-4', mobileView === 'panels' ? 'hidden xl:block' : 'block xl:block')}>
              <div className="flex items-center gap-3 px-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                    Central Controller
                  </p>
                  <h2 className="text-xl font-bold text-foreground">
                    AI Exam Coach
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Chat drives plans, tasks, focus, and progress.
                  </p>
                </div>
              </div>

              <ChatPanel embedded />
            </div>

            <div className={cn('space-y-4', mobileView === 'chat' ? 'hidden xl:block' : 'block xl:block')}>
              <RightPanel />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
