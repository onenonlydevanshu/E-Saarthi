/**
 * MCP (Model Context Protocol) Exams Data Source
 * 
 * This file simulates an MCP server data source for upcoming competitive exams.
 * In a real production setup, this would be replaced with a connection to an
 * actual MCP server or external API (e.g., government exam portal API).
 * 
 * The data here represents a curated knowledge base of major Indian competitive
 * exams with realistic dates, categories, and metadata.
 */

export interface MCPExamData {
  id: string
  name: string
  fullName: string
  date: string // ISO format
  category: 'government' | 'private'
  type: string // e.g., "Civil Services", "Banking", "Engineering"
  description: string
  registrationDeadline?: string
  applicationLink?: string
  eligibility?: string
  examMode: 'online' | 'offline' | 'hybrid'
  totalSeats?: number
  difficulty: 'easy' | 'moderate' | 'hard' | 'very-hard'
  syllabusId?: string // Links to syllabus-data.ts
  importance: 'high' | 'medium' | 'low'
  source: 'mcp-server' | 'official-api' | 'curated'
  lastUpdated: string
}

// Calculate dates relative to current date (April 30, 2026)
const today = new Date('2026-04-30')

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

export const MCP_EXAMS_DATABASE: MCPExamData[] = [
  // Government Exams - Civil Services
  {
    id: 'mcp-upsc-prelims-2026',
    name: 'UPSC Prelims 2026',
    fullName: 'Union Public Service Commission - Civil Services Preliminary Examination 2026',
    date: addDays(today, 28),
    category: 'government',
    type: 'Civil Services',
    description: 'Preliminary stage of UPSC Civil Services Examination. Two papers - General Studies and CSAT.',
    registrationDeadline: addDays(today, -45),
    eligibility: 'Bachelor\'s degree, Age 21-32',
    examMode: 'offline',
    totalSeats: 1056,
    difficulty: 'very-hard',
    syllabusId: 'upsc',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  {
    id: 'mcp-upsc-mains-2026',
    name: 'UPSC Mains 2026',
    fullName: 'UPSC Civil Services Main Examination 2026',
    date: addDays(today, 145),
    category: 'government',
    type: 'Civil Services',
    description: 'Main stage of UPSC. 9 descriptive papers including essay and optional subject.',
    eligibility: 'Qualified UPSC Prelims candidates',
    examMode: 'offline',
    difficulty: 'very-hard',
    syllabusId: 'upsc',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // SSC Exams
  {
    id: 'mcp-ssc-cgl-tier1-2026',
    name: 'SSC CGL Tier I 2026',
    fullName: 'Staff Selection Commission - Combined Graduate Level Tier I',
    date: addDays(today, 42),
    category: 'government',
    type: 'Government Services',
    description: 'Tier I online exam for Group B and C posts in central government.',
    registrationDeadline: addDays(today, 5),
    eligibility: 'Bachelor\'s degree, Age 18-32',
    examMode: 'online',
    totalSeats: 17727,
    difficulty: 'moderate',
    syllabusId: 'ssc-cgl',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  {
    id: 'mcp-ssc-chsl-2026',
    name: 'SSC CHSL 2026',
    fullName: 'SSC Combined Higher Secondary Level Examination',
    date: addDays(today, 75),
    category: 'government',
    type: 'Government Services',
    description: 'For LDC, JSA, PA/SA, DEO posts in various government departments.',
    eligibility: '12th Pass, Age 18-27',
    examMode: 'online',
    difficulty: 'moderate',
    importance: 'medium',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // Railways
  {
    id: 'mcp-rrb-ntpc-2026',
    name: 'RRB NTPC 2026',
    fullName: 'Railway Recruitment Board - Non-Technical Popular Categories',
    date: addDays(today, 56),
    category: 'government',
    type: 'Railways',
    description: 'For non-technical posts in Indian Railways including station master, goods guard, etc.',
    registrationDeadline: addDays(today, 12),
    eligibility: '12th Pass / Graduate, Age 18-33',
    examMode: 'online',
    totalSeats: 11558,
    difficulty: 'moderate',
    syllabusId: 'rrb-ntpc',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  {
    id: 'mcp-rrb-group-d-2026',
    name: 'RRB Group D 2026',
    fullName: 'Railway Recruitment Board - Group D (Level 1)',
    date: addDays(today, 90),
    category: 'government',
    type: 'Railways',
    description: 'For track maintainer, helper, assistant pointsman positions.',
    eligibility: '10th Pass, Age 18-33',
    examMode: 'online',
    difficulty: 'easy',
    importance: 'medium',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // Banking
  {
    id: 'mcp-ibps-po-2026',
    name: 'IBPS PO 2026',
    fullName: 'Institute of Banking Personnel Selection - Probationary Officer',
    date: addDays(today, 18),
    category: 'government',
    type: 'Banking',
    description: 'For PO/MT positions in 11 public sector banks.',
    registrationDeadline: addDays(today, -10),
    eligibility: 'Graduate, Age 20-30',
    examMode: 'online',
    totalSeats: 4500,
    difficulty: 'moderate',
    syllabusId: 'bank-po',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  {
    id: 'mcp-sbi-po-2026',
    name: 'SBI PO 2026',
    fullName: 'State Bank of India - Probationary Officer',
    date: addDays(today, 65),
    category: 'government',
    type: 'Banking',
    description: 'PO recruitment for State Bank of India. Three-stage selection.',
    eligibility: 'Graduate, Age 21-30',
    examMode: 'online',
    totalSeats: 2000,
    difficulty: 'hard',
    syllabusId: 'bank-po',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // Private Exams - Management
  {
    id: 'mcp-cat-2026',
    name: 'CAT 2026',
    fullName: 'Common Admission Test for IIMs and Top B-Schools',
    date: addDays(today, 210),
    category: 'private',
    type: 'Management',
    description: 'Entrance exam for MBA/PGDM at IIMs and 1000+ B-schools.',
    registrationDeadline: addDays(today, 165),
    eligibility: 'Bachelor\'s degree (50%)',
    examMode: 'online',
    difficulty: 'very-hard',
    syllabusId: 'cat',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  {
    id: 'mcp-xat-2026',
    name: 'XAT 2026',
    fullName: 'Xavier Aptitude Test for XLRI and Xavier Schools',
    date: addDays(today, 245),
    category: 'private',
    type: 'Management',
    description: 'For admission to XLRI Jamshedpur and other Xavier schools.',
    eligibility: 'Bachelor\'s degree',
    examMode: 'online',
    difficulty: 'hard',
    importance: 'medium',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // Engineering
  {
    id: 'mcp-gate-2026',
    name: 'GATE 2026',
    fullName: 'Graduate Aptitude Test in Engineering 2026',
    date: addDays(today, 250),
    category: 'government',
    type: 'Engineering',
    description: 'For PG admission to IITs/NITs and PSU recruitment.',
    registrationDeadline: addDays(today, 180),
    eligibility: 'B.E./B.Tech or equivalent',
    examMode: 'online',
    difficulty: 'hard',
    syllabusId: 'gate',
    importance: 'high',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // Teaching
  {
    id: 'mcp-ctet-2026',
    name: 'CTET 2026',
    fullName: 'Central Teacher Eligibility Test',
    date: addDays(today, 35),
    category: 'government',
    type: 'Teaching',
    description: 'Eligibility test for teachers in central government schools (KVS, NVS).',
    eligibility: 'B.Ed / D.El.Ed',
    examMode: 'offline',
    difficulty: 'moderate',
    importance: 'medium',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
  // Defense
  {
    id: 'mcp-cds-2026',
    name: 'CDS 2026',
    fullName: 'Combined Defence Services Examination',
    date: addDays(today, 102),
    category: 'government',
    type: 'Defense',
    description: 'For admission to IMA, INA, AFA, and OTA.',
    eligibility: 'Graduate (varies by service)',
    examMode: 'offline',
    difficulty: 'moderate',
    importance: 'medium',
    source: 'mcp-server',
    lastUpdated: today.toISOString(),
  },
]

/**
 * MCP Server Functions
 * These simulate MCP protocol calls
 */

export async function fetchUpcomingExams(filters?: {
  category?: 'government' | 'private'
  type?: string
  importance?: 'high' | 'medium' | 'low'
  withinDays?: number
}): Promise<MCPExamData[]> {
  // Simulate network latency for realistic MCP behavior
  await new Promise(resolve => setTimeout(resolve, 300))
  
  let exams = [...MCP_EXAMS_DATABASE]
  
  // Filter only upcoming exams
  const now = new Date()
  exams = exams.filter(exam => new Date(exam.date) >= now)
  
  // Apply filters
  if (filters?.category) {
    exams = exams.filter(e => e.category === filters.category)
  }
  if (filters?.type) {
    exams = exams.filter(e => e.type.toLowerCase() === filters.type!.toLowerCase())
  }
  if (filters?.importance) {
    exams = exams.filter(e => e.importance === filters.importance)
  }
  if (filters?.withinDays) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + filters.withinDays)
    exams = exams.filter(e => new Date(e.date) <= cutoff)
  }
  
  // Sort by date
  exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  return exams
}

export async function fetchExamById(id: string): Promise<MCPExamData | null> {
  await new Promise(resolve => setTimeout(resolve, 100))
  return MCP_EXAMS_DATABASE.find(e => e.id === id) || null
}

export async function searchExams(query: string): Promise<MCPExamData[]> {
  await new Promise(resolve => setTimeout(resolve, 150))
  const lowerQuery = query.toLowerCase()
  return MCP_EXAMS_DATABASE.filter(exam => 
    exam.name.toLowerCase().includes(lowerQuery) ||
    exam.fullName.toLowerCase().includes(lowerQuery) ||
    exam.type.toLowerCase().includes(lowerQuery) ||
    exam.description.toLowerCase().includes(lowerQuery)
  )
}
