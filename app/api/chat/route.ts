import { NextRequest } from 'next/server'
import { getSyllabusById, formatSyllabusForAI, type ExamSyllabus } from '@/lib/syllabus-data'
const SYSTEM_PROMPT = `You are an AI exam preparation controller.

Return exactly one valid JSON object and nothing else.

Required shape:
{
  "action": "create_plan" | "add_tasks" | "start_focus" | "update_progress" | "ask_question",
  "message": "plain text only",
  "data": {}
}

Rules:
- Do not use markdown.
- Do not use code blocks.
- Do not add any text before or after the JSON.
- Always include action, message, and data.
- Keep message concise and user-facing.
- Use data.plan for study plans, data.tasks for daily tasks, data.taskTitle for focus, and data.progress for performance summaries.
`

// Keywords for different intents
const FOCUS_KEYWORDS = ['distract', 'unfocus', 'focus', 'concentrate', 'procrastinat', 'attention', 'overwhelm', 'pomodoro', 'timer', 'motivation', 'stressed', 'anxious']
const STUDY_PLAN_KEYWORDS = ['study plan', 'schedule', 'timetable', 'routine', 'plan my', 'create plan', 'make plan', 'generate plan', 'weekly plan', 'monthly plan', 'preparation plan', 'adaptive plan', 'personalized plan']
const DAILY_TASK_KEYWORDS = ['what should i study', 'today\'s tasks', 'daily tasks', 'what to study', 'suggest tasks', 'today\'s plan', 'study today', 'give me tasks']
const PERFORMANCE_KEYWORDS = ['my performance', 'how am i doing', 'my progress', 'my weak', 'my strong', 'analyze my', 'performance report', 'insights']

interface PerformanceData {
  overallAccuracy: number
  weakAreas: string[]
  strongAreas: string[]
  taskCompletionRate: number
  studyConsistency: number
  recentQuizScores?: { subject: string; score: number }[]
}

interface MemoryContext {
  recentCompletedTasks?: string[]
  recentQuizScores?: Array<{ examName: string; scorePercent: number; date: string }>
  recommendationHistory?: string[]
}

function detectIntent(message: string): { focus: boolean; studyPlan: boolean; dailyTasks: boolean; performance: boolean } {
  const lowerMessage = message.toLowerCase()
  return {
    focus: FOCUS_KEYWORDS.some(keyword => lowerMessage.includes(keyword)),
    studyPlan: STUDY_PLAN_KEYWORDS.some(keyword => lowerMessage.includes(keyword)),
    dailyTasks: DAILY_TASK_KEYWORDS.some(keyword => lowerMessage.includes(keyword)),
    performance: PERFORMANCE_KEYWORDS.some(keyword => lowerMessage.includes(keyword))
  }
}

function generateAdaptiveStudyPlan(performanceData: PerformanceData, examName: string): string {
  const { weakAreas, strongAreas, taskCompletionRate } = performanceData
  
  const hoursPerDay = taskCompletionRate > 80 ? 7 : taskCompletionRate > 60 ? 6 : 5
  
  const schedule = []
  const today = new Date()
  for (let day = 1; day <= 7; day++) {
    const isWeakFocusDay = day % 2 === 1
    const topics = isWeakFocusDay
      ? [`${weakAreas[0] || 'Weak Subject'} - Deep Practice`, `${weakAreas[1] || 'Review'} - Fundamentals`, 'Problem Solving']
      : [`${strongAreas[0] || 'Strong Subject'} - Advanced`, `${weakAreas[0] || 'Weak Subject'} - Review`, 'Mock Test Practice']

    const dayDate = new Date(today)
    dayDate.setDate(today.getDate() + day)

    schedule.push({
      day,
      date: dayDate.toISOString().split('T')[0],
      topics,
      hours: hoursPerDay,
      priority: isWeakFocusDay ? 'high' : 'medium'
    })
  }
  
  return JSON.stringify({
    examName: examName || 'Competitive Exam',
    examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hoursPerDay,
    schedule,
    adaptive: true,
    focusAreas: weakAreas
  }, null, 2)
}

function generateAdaptiveTasks(
  performanceData: PerformanceData,
  memoryContext?: MemoryContext
): string[] {
  const { weakAreas, strongAreas, overallAccuracy } = performanceData
  
  const tasks: string[] = []
  
  // Priority tasks for weak areas (60%)
  if (weakAreas[0]) {
    tasks.push(`[PRIORITY] ${weakAreas[0]}: Solve 25 practice questions focusing on fundamentals`)
    tasks.push(`[PRIORITY] ${weakAreas[0]}: Watch concept video and make notes (30 mins)`)
  }
  if (weakAreas[1]) {
    tasks.push(`[PRIORITY] ${weakAreas[1]}: Complete 2 previous year question sets`)
  }
  
  // Practice tasks for strong areas (20%)
  if (strongAreas[0]) {
    tasks.push(`[PRACTICE] ${strongAreas[0]}: Advanced problems to maintain edge (15 mins)`)
  }
  
  // Adaptive difficulty based on accuracy
  if (overallAccuracy < 60) {
    tasks.push('[REVISION] Review basic concepts and formulas from weak chapters')
    tasks.push('[NEW] Start with easier topics to build confidence')
  } else if (overallAccuracy < 80) {
    tasks.push('[CHALLENGE] Attempt 1 full-length mock test section')
    tasks.push('[REVISION] Quick revision of yesterday\'s topics')
  } else {
    tasks.push('[CHALLENGE] Solve advanced/tricky questions from competitive sources')
    tasks.push('[NEW] Explore optional topics for bonus marks')
  }
  
  const recentlyCompleted = new Set(
    (memoryContext?.recentCompletedTasks || []).map((t) => t.toLowerCase().trim())
  )
  const filtered = tasks.filter(
    (task) => !recentlyCompleted.has(task.toLowerCase().trim())
  )
  return (filtered.length > 0 ? filtered : tasks).slice(0, 6)
}

// Helper to render an [AGENT_ACTIONS] block from any list of actions
function buildAgentActionsBlock(actions: Array<Record<string, unknown>>): string {
  if (!actions.length) return ''
  return `\n\n[AGENT_ACTIONS]\n${JSON.stringify(actions, null, 2)}\n[/AGENT_ACTIONS]`
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function buildStructuredResponse(
  action: 'create_plan' | 'add_tasks' | 'start_focus' | 'update_progress' | 'ask_question',
  message: string,
  data: Record<string, unknown> = {}
): string {
  return JSON.stringify({ action, message, data })
}

function stripControllerBlocks(content: string): string {
  return content
    .replace(/\[AGENT_ACTIONS\][\s\S]*?\[\/AGENT_ACTIONS\]/g, '')
    .replace(/\[STUDY_PLAN\][\s\S]*?\[\/STUDY_PLAN\]/g, '')
    .replace(/\[DAILY_TASKS\][\s\S]*?\[\/DAILY_TASKS\]/g, '')
    .trim()
}

function buildChatControllerBlock(rawResponse: string): string {
  const actionMatch = rawResponse.match(/\[AGENT_ACTIONS\]([\s\S]*?)\[\/AGENT_ACTIONS\]/)
  const studyPlanMatch = rawResponse.match(/\[STUDY_PLAN\]([\s\S]*?)\[\/STUDY_PLAN\]/)
  const dailyTasksMatch = rawResponse.match(/\[DAILY_TASKS\]([\s\S]*?)\[\/DAILY_TASKS\]/)

  const actions = actionMatch ? safeJsonParse<Array<Record<string, unknown>>>(actionMatch[1].trim()) ?? [] : []
  const studyPlan = studyPlanMatch ? safeJsonParse<Record<string, unknown>>(studyPlanMatch[1].trim()) : undefined
  const dailyTasks = dailyTasksMatch ? safeJsonParse<string[]>(dailyTasksMatch[1].trim()) : undefined
  const message = stripControllerBlocks(rawResponse)
  const primaryAction = studyPlan
    ? 'create_plan'
    : dailyTasks && dailyTasks.length > 0
      ? 'add_tasks'
      : actions.some((a) => a.type === 'start_focus')
        ? 'start_focus'
        : 'none'
  const focusAction = actions.find((a) => a.type === 'start_focus') as
    | { type: 'start_focus'; taskTitle?: string }
    | undefined

  return `\n\n[CHAT_CONTROLLER]\n${JSON.stringify(
    {
      message,
      action: primaryAction,
      data: {
        ...(studyPlan ? { plan: studyPlan } : {}),
        ...(dailyTasks ? { tasks: dailyTasks } : {}),
        ...(focusAction?.taskTitle ? { taskTitle: focusAction.taskTitle } : {}),
        // Legacy keys retained for compatibility with older clients
        ...(studyPlan ? { studyPlan } : {}),
        ...(dailyTasks ? { dailyTasks } : {}),
      },
      actions,
    },
    null,
    2
  )}\n[/CHAT_CONTROLLER]`
}

function withControllerBlock(rawResponse: string): string {
  return `${rawResponse}${buildChatControllerBlock(rawResponse)}`
}

// Enhanced mock responses with adaptive learning and syllabus
function getMockResponse(
  message: string,
  performanceData?: PerformanceData,
  syllabus?: ExamSyllabus | null,
  memoryContext?: MemoryContext
): {
  response: string
  intent: { focus: boolean; studyPlan: boolean; dailyTasks: boolean; performance: boolean } 
} {
  const intent = detectIntent(message)
  const lowerMessage = message.toLowerCase()
  
  const perfData = performanceData || {
    overallAccuracy: 72,
    weakAreas: ['Reasoning', 'Quantitative Aptitude'],
    strongAreas: ['English Grammar', 'General Knowledge'],
    taskCompletionRate: 78,
    studyConsistency: 80
  }
  
  const examName = syllabus?.shortName || 'your exam'
  const examSubjects = syllabus?.subjects || []
  const importantTopics = syllabus?.importantTopics || []
  const recommendedBooks = syllabus?.recommendedBooks || []
  
  if (intent.performance) {
    return {
      response: buildStructuredResponse(
        'update_progress',
        `Your progress is ready. Accuracy is ${perfData.overallAccuracy}%, task completion is ${perfData.taskCompletionRate}%, and the main focus areas are ${perfData.weakAreas.join(', ')}.`,
        {
          progress: {
            overallAccuracy: perfData.overallAccuracy,
            taskCompletionRate: perfData.taskCompletionRate,
            studyConsistency: perfData.studyConsistency,
            weakAreas: perfData.weakAreas,
            strongAreas: perfData.strongAreas,
          },
          tasks: [
            `Practice ${perfData.weakAreas[0] || 'weak subject'} for 1 hour`,
          ],
          taskTitle: `${perfData.weakAreas[0] || 'Study'} - Improvement Session`,
        }
      ),
      intent
    }
  }
  
  if (intent.dailyTasks) {
    const adaptiveTasks = generateAdaptiveTasks(perfData, memoryContext)
    const firstTask = adaptiveTasks[0]?.replace(/^\[\w+\]\s*/, '') || 'Start studying'
    
    return {
      response: buildStructuredResponse(
        'add_tasks',
        `I created ${adaptiveTasks.length} tasks for today. Start with ${firstTask}.`,
        {
          tasks: adaptiveTasks,
          taskTitle: firstTask,
        }
      ),
      intent
    }
  }
  
  if (intent.studyPlan) {
    const adaptivePlan = generateAdaptiveStudyPlan(perfData, syllabus?.examName || examName)
    const firstTopic = examSubjects[0]?.topics[0] || perfData.weakAreas[0] || 'Day 1 Topics'
    
    return {
      response: buildStructuredResponse(
        'create_plan',
        `Your ${examName} study plan is ready in Study Planner. Start with ${firstTopic}.`,
        {
          plan: JSON.parse(adaptivePlan),
          taskTitle: firstTopic,
          recommendedBooks,
          importantTopics,
        }
      ),
      intent
    }
  }
  
  if (intent.focus) {
    const suggestedFocus = perfData.weakAreas[0] || 'Study Session'
    return {
      response: buildStructuredResponse(
        'start_focus',
        `Focus Mode is ready. Start with ${suggestedFocus}.`,
        {
          taskTitle: `${suggestedFocus} - Focused Practice`,
        }
      ),
      intent
    }
  }
  
  if (lowerMessage.includes('upsc') || lowerMessage.includes('ias') || lowerMessage.includes('civil service')) {
    return {
      response: buildStructuredResponse(
        'ask_question',
        `I can build a UPSC plan, daily tasks, or a focus session based on your weak areas.`,
        {
          question: 'Would you like a UPSC study plan, daily tasks, or a focus session?',
          progress: {
            strongAreas: perfData.strongAreas,
            weakAreas: perfData.weakAreas,
          },
        }
      ),
      intent
    }
  }
  
  // Default mentor response with performance awareness
  return {
    response: buildStructuredResponse(
      'ask_question',
      `I am ready to help with performance, study plans, tasks, or focus sessions.`,
      {
        question: `What would you like to work on today?`,
        progress: {
          overallAccuracy: perfData.overallAccuracy,
          strongAreas: perfData.strongAreas,
          weakAreas: perfData.weakAreas,
        },
      }
    ),
    intent
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages: chatHistory, performanceData, memoryContext, selectedExamId } = await request.json()
    
    // Get syllabus for selected exam
    const syllabus: ExamSyllabus | null = selectedExamId ? getSyllabusById(selectedExamId) : null

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.OPENAI_API_KEY
    const intent = detectIntent(message)

    // If no API key, return mock response with streaming simulation
    if (!apiKey) {
      const { response: mockResponse, intent: detectedIntent } = getMockResponse(
        message,
        performanceData,
        syllabus,
        memoryContext
      )
      
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          // Send intent metadata first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            meta: true,
            intent: detectedIntent 
          })}\n\n`))

          const chunkSize = 24
          for (let index = 0; index < mockResponse.length; index += chunkSize) {
            const chunk = mockResponse.slice(index, index + chunkSize)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            await new Promise(resolve => setTimeout(resolve, 12))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // Build syllabus context for OpenAI
    let syllabusContext = ''
    if (syllabus) {
      syllabusContext = `

## SELECTED EXAM SYLLABUS:
${formatSyllabusForAI(syllabus)}

IMPORTANT: Use this syllabus information to create study plans, daily tasks, and recommendations that are SPECIFIC to this exam. Reference actual topics, weightages, and recommended books.`
    }

    // Build performance context for OpenAI
    let performanceContext = ''
    if (performanceData) {
      performanceContext = `

## STUDENT'S PERFORMANCE DATA:
- Overall Accuracy: ${performanceData.overallAccuracy}%
- Weak Areas: ${performanceData.weakAreas?.join(', ') || 'Not determined'}
- Strong Areas: ${performanceData.strongAreas?.join(', ') || 'Not determined'}
- Task Completion Rate: ${performanceData.taskCompletionRate}%
- Study Consistency: ${performanceData.studyConsistency}%

USE THIS DATA to personalize your response. Focus recommendations on their weak areas and acknowledge their strengths.`
    }

    let memoryLayerContext = ''
    if (memoryContext) {
      const completed = memoryContext.recentCompletedTasks?.slice(-10) || []
      const quizMemory = memoryContext.recentQuizScores?.slice(-8) || []
      memoryLayerContext = `

## STUDENT MEMORY LAYER:
- Recently Completed Tasks: ${completed.length > 0 ? completed.join(', ') : 'None recorded'}
- Recent Quiz Memory: ${quizMemory.length > 0 ? quizMemory.map((q: { examName: string; scorePercent: number }) => `${q.examName} (${q.scorePercent}%)`).join(', ') : 'None recorded'}

USE THIS MEMORY to adjust recommendations:
- Avoid repeating the same tasks that were recently completed.
- Increase challenge if recent quiz scores are improving.
- Reinforce weak areas that still show low performance.`
    }

    // Build messages array for OpenAI with enhanced context
    const contextMessage = intent.studyPlan
      ? '\n\nReturn a JSON object with action="create_plan", a plain text message, and data.plan.'
      : intent.dailyTasks
        ? '\n\nReturn a JSON object with action="add_tasks", a plain text message, and data.tasks.'
        : intent.performance
          ? '\n\nReturn a JSON object with action="update_progress", a plain text message, and data.progress.'
          : '\n\nReturn a JSON object with action="ask_question", a plain text message, and a concise question in data.question if details are missing.'

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + syllabusContext + performanceContext + memoryLayerContext + contextMessage },
      ...(chatHistory || []).slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI API with streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'structured_study_assistant_response',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['action', 'message', 'data'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['create_plan', 'add_tasks', 'start_focus', 'update_progress', 'ask_question'],
                },
                message: {
                  type: 'string',
                },
                data: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
        },
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      return new Response(JSON.stringify({ 
        error: error.error?.message || 'Failed to get response from AI' 
      }), {
        status: openaiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Transform the OpenAI stream
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let isFirstChunk = true

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk)
        const lines = text.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              continue
            }
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                // Send intent metadata with first chunk
                if (isFirstChunk) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    meta: true,
                    intent 
                  })}\n\n`))
                  isFirstChunk = false
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    })

    return new Response(openaiResponse.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
