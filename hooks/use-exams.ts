'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MCPExamData } from '@/lib/mcp-exams-data'

interface UseExamsOptions {
  category?: 'government' | 'private'
  type?: string
  importance?: 'high' | 'medium' | 'low'
  withinDays?: number
  autoFetch?: boolean
}

interface UseExamsReturn {
  exams: MCPExamData[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  search: (query: string) => Promise<void>
  source: string | null
  lastFetched: string | null
}

export function useExams(options: UseExamsOptions = {}): UseExamsReturn {
  const { autoFetch = true, ...filters } = options
  const [exams, setExams] = useState<MCPExamData[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string | null>(null)
  
  const fetchExams = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.type) params.set('type', filters.type)
      if (filters.importance) params.set('importance', filters.importance)
      if (filters.withinDays) params.set('withinDays', String(filters.withinDays))
      
      const response = await fetch(`/api/exams?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      setExams(data.exams || [])
      setSource(data.source || null)
      setLastFetched(data.timestamp || null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch exams'
      setError(message)
      console.error('[useExams] Error:', err)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.type, filters.importance, filters.withinDays])
  
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      return fetchExams()
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/exams?search=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      setExams(data.exams || [])
      setSource(data.source || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [fetchExams])
  
  useEffect(() => {
    if (autoFetch) {
      fetchExams()
    }
  }, [autoFetch, fetchExams])
  
  return {
    exams,
    isLoading,
    error,
    refresh: fetchExams,
    search,
    source,
    lastFetched,
  }
}
