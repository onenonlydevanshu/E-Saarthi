'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-20 w-60 rounded-2xl" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 rounded-2xl border border-border/50 bg-card/50', className)}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
      <Skeleton className="h-20 flex-1 rounded-2xl" />
    </div>
  )
}
