'use client'

import { Suspense, lazy } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { Spinner } from '@/components/ui/spinner'

// Lazy load the main app layout for better initial load performance
const AppLayout = lazy(() => import('@/components/app-layout').then(m => ({ default: m.AppLayout })))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-10 h-10 text-primary" />
        <p className="text-muted-foreground text-sm">Loading ExamPrep AI...</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AppLayout />
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
