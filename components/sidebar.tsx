'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  ClipboardList,
  FileQuestion,
  BarChart3,
  Timer,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
  { id: 'study-planner', label: 'Study Planner', icon: CalendarDays, description: 'Plan your schedule' },
  { id: 'daily-tasks', label: 'Daily Tasks', icon: ListTodo, description: 'Today\'s to-do list' },
  { id: 'upcoming-exams', label: 'Upcoming Exams', icon: ClipboardList, description: 'Exam calendar' },
  { id: 'mock-tests', label: 'Mock Tests', icon: FileQuestion, description: 'Practice quizzes' },
  { id: 'progress', label: 'Progress Tracker', icon: BarChart3, description: 'Your analytics' },
  { id: 'focus-mode', label: 'Focus Mode', icon: Timer, description: 'Pomodoro timer' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activePage, setActivePage, theme, toggleTheme } = useAppStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-400 ease-out',
        'bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/50',
        'flex flex-col',
        'shadow-[4px_0_32px_rgba(0,0,0,0.04)]',
        'dark:shadow-[4px_0_32px_rgba(0,0,0,0.25)]',
        sidebarOpen ? 'w-72' : 'w-[76px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'relative flex items-center gap-4 border-b border-sidebar-border/50 transition-all duration-300',
          sidebarOpen ? 'px-6 py-5' : 'p-4 justify-center'
        )}
      >
        {/* Ambient glow behind logo */}
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 w-16 h-16 bg-primary/20 rounded-full blur-2xl pointer-events-none"
          aria-hidden
        />
        <div
          className={cn(
            'relative flex items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-primary via-primary to-primary/75',
            'text-primary-foreground shadow-lg shadow-primary/30',
            'transition-all duration-300',
            'hover:shadow-xl hover:shadow-primary/40 hover:scale-105',
            sidebarOpen ? 'w-12 h-12' : 'w-11 h-11'
          )}
        >
          <GraduationCap
            className={cn(
              'transition-all duration-300',
              sidebarOpen ? 'w-6 h-6' : 'w-5 h-5'
            )}
          />
          {/* Inner gradient highlight */}
          <div
            className="absolute inset-x-2 top-1 h-1/3 rounded-xl bg-white/15 blur-sm"
            aria-hidden
          />
        </div>
        {sidebarOpen && (
          <div className="relative animate-fade-in min-w-0">
            <h1 className="font-bold text-lg text-sidebar-foreground tracking-tight leading-tight">
              ExamPrep <span className="gradient-text">AI</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <p className="text-[11px] text-muted-foreground font-medium">
                Smart Study Assistant
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className={cn(
          'px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60',
          !sidebarOpen && 'sr-only'
        )}>
          Menu
        </p>
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'group relative w-full flex items-center rounded-2xl touch-feedback',
                'transition-all duration-250 ease-out',
                sidebarOpen ? 'gap-4 px-4 py-3.5' : 'justify-center p-3.5',
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                `animate-fade-in stagger-${Math.min(index + 1, 6)}`
              )}
              style={{ animationFillMode: 'backwards' }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full animate-scale-in" />
              )}
              
              <div className={cn(
                'relative flex items-center justify-center transition-all duration-250',
                'w-10 h-10 rounded-xl',
                isActive 
                  ? 'bg-primary/15 text-primary' 
                  : 'bg-transparent group-hover:bg-sidebar-accent/50',
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-transform duration-250',
                  isActive && 'scale-110',
                  !isActive && 'group-hover:scale-105'
                )} />
              </div>
              
              {sidebarOpen && (
                <div className="flex flex-col items-start animate-fade-in min-w-0">
                  <span className={cn(
                    'text-sm font-semibold truncate',
                    isActive && 'text-primary'
                  )}>
                    {item.label}
                  </span>
                  <span className={cn(
                    'text-[11px] text-muted-foreground truncate max-w-full',
                    isActive && 'text-primary/60'
                  )}>
                    {item.description}
                  </span>
                </div>
              )}
              
              {/* Active dot indicator (when expanded) */}
              {isActive && sidebarOpen && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={cn(
        'border-t border-sidebar-border/50 space-y-2',
        sidebarOpen ? 'p-4' : 'p-3'
      )}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'group w-full flex items-center rounded-2xl touch-feedback',
            'transition-all duration-250 ease-out',
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            sidebarOpen ? 'gap-4 px-4 py-3.5' : 'justify-center p-3.5'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl',
            'bg-secondary/50 group-hover:bg-secondary transition-all duration-250'
          )}>
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </div>
          {sidebarOpen && (
            <div className="flex flex-col items-start animate-fade-in">
              <span className="text-sm font-semibold">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Switch appearance
              </span>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'w-full rounded-2xl h-12 transition-all duration-250',
            sidebarOpen ? 'justify-between px-4' : 'justify-center'
          )}
        >
          {sidebarOpen && <span className="text-sm text-muted-foreground font-medium">Collapse</span>}
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            'bg-secondary/50 transition-all duration-300',
            'group-hover:bg-secondary'
          )}>
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </Button>
      </div>
    </aside>
  )
}
