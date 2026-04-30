/**
 * /api/exams - MCP Layer for Exam Data
 * 
 * This route acts as the Model Context Protocol layer between the application
 * and the exam data source. It handles:
 * - Fetching upcoming exams with filters
 * - Searching exams by query
 * - Getting individual exam details
 * 
 * Query Parameters:
 * - category: 'government' | 'private'
 * - type: filter by exam type (e.g., 'Banking', 'Civil Services')
 * - importance: 'high' | 'medium' | 'low'
 * - withinDays: only exams within N days
 * - search: search query
 * - id: get specific exam
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  fetchUpcomingExams, 
  fetchExamById, 
  searchExams,
  type MCPExamData 
} from '@/lib/mcp-exams-data'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const id = searchParams.get('id')
    const search = searchParams.get('search')
    const category = searchParams.get('category') as 'government' | 'private' | null
    const type = searchParams.get('type')
    const importance = searchParams.get('importance') as 'high' | 'medium' | 'low' | null
    const withinDaysParam = searchParams.get('withinDays')
    const withinDays = withinDaysParam ? parseInt(withinDaysParam, 10) : undefined
    
    // Get specific exam by ID
    if (id) {
      const exam = await fetchExamById(id)
      if (!exam) {
        return NextResponse.json(
          { error: 'Exam not found', source: 'mcp' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        exam,
        source: 'mcp',
        timestamp: new Date().toISOString(),
      })
    }
    
    // Search exams
    if (search) {
      const results = await searchExams(search)
      return NextResponse.json({
        exams: results,
        count: results.length,
        query: search,
        source: 'mcp',
        timestamp: new Date().toISOString(),
      })
    }
    
    // Fetch with filters
    const filters: Parameters<typeof fetchUpcomingExams>[0] = {}
    if (category) filters.category = category
    if (type) filters.type = type
    if (importance) filters.importance = importance
    if (withinDays !== undefined && !isNaN(withinDays)) filters.withinDays = withinDays
    
    const exams = await fetchUpcomingExams(filters)
    
    return NextResponse.json({
      exams,
      count: exams.length,
      filters,
      source: 'mcp',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MCP Exams API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch exams from MCP source', 
        details: error instanceof Error ? error.message : 'Unknown error',
        source: 'mcp'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint - allows refresh/sync request from MCP layer
 * Useful for triggering data updates from the source
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'refresh') {
      // In production, this would trigger an MCP server refresh
      const exams = await fetchUpcomingExams()
      return NextResponse.json({
        success: true,
        message: 'MCP data refreshed',
        count: exams.length,
        timestamp: new Date().toISOString(),
      })
    }
    
    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'MCP request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
