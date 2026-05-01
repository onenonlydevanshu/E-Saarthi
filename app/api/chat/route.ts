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
- Keep message concise and user-facing (1-2 short sentences).
- Every message must include a clear next step suggestion.
- Keep mentor tone: proactive, supportive, and action-oriented.
- Avoid generic phrasing. Anchor recommendations to current app state when available.
- Maintain continuity by referencing the latest completed action or active flow when context is available.
- Do not return purely informational updates; every message must drive an immediate productive next action.
- If completed tasks exist, briefly acknowledge progress in X out of Y format and encourage continuation in one short line.
- Reference specific subjects, weak areas, or task titles instead of generic terms like "topic" or "task" when context is available.
- Adjust tone by progress: encouraging and corrective when behind, reinforcing and precise when consistent.
- Avoid generic motivational phrases without context.
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
  currentFocusTask?: string
}

interface AppStateContext {
  activePage?: string
  pendingTasksCount?: number
  completedTasksCount?: number
  latestPlanExamName?: string
  latestPlanTopTopic?: string
  nextPendingTaskTitle?: string
}

interface RecentActionContext {
  action: 'create_plan' | 'add_tasks' | 'start_focus' | 'update_progress' | 'ask_question'
  summary: string
}

type ControllerAction =
  | 'create_plan'
  | 'add_tasks'
  | 'start_focus'
  | 'update_progress'
  | 'ask_question'

interface SuggestionContext {
  lastSuggestedAction?: ControllerAction | null
  lastSuggestedTaskTitle?: string | null
  repeatStreak?: number
}

interface DecisionPolicy {
  hasActiveFocus: boolean
  activeFocusTitle: string | null
  hasPendingTasks: boolean
  pendingTasksCount: number
  hasExistingPlan: boolean
  nextPendingTaskTitle: string | null
}

function getPreferredAction(
  intent: { focus: boolean; studyPlan: boolean; dailyTasks: boolean; performance: boolean },
  decisionPolicy: DecisionPolicy
): ControllerAction {
  if (decisionPolicy.hasActiveFocus) return 'start_focus'
  if (decisionPolicy.hasPendingTasks && (intent.studyPlan || intent.dailyTasks)) {
    return 'start_focus'
  }
  if (intent.studyPlan && decisionPolicy.hasExistingPlan) return 'ask_question'
  if (intent.studyPlan) return 'create_plan'
  if (intent.dailyTasks) return 'add_tasks'
  if (intent.performance) return 'update_progress'
  return 'ask_question'
}

function hasUserIgnoredSuggestion(message: string): boolean {
  const text = message.toLowerCase()
  const ignoreSignals = [
    'not now',
    'later',
    'skip',
    'ignore',
    'did not',
    "didn't",
    'not done',
    'stuck',
    "can't",
    'cannot',
    'still',
    'yet',
  ]
  return ignoreSignals.some((signal) => text.includes(signal))
}

function getRotatedAction(
  preferred: ControllerAction,
  decisionPolicy: DecisionPolicy,
  intent: { focus: boolean; studyPlan: boolean; dailyTasks: boolean; performance: boolean }
): ControllerAction {
  if (preferred === 'start_focus') {
    return 'ask_question'
  }

  if (preferred === 'ask_question') {
    if (decisionPolicy.hasPendingTasks) return 'start_focus'
    if (!decisionPolicy.hasExistingPlan && intent.studyPlan) return 'create_plan'
    if (intent.performance) return 'update_progress'
    return 'add_tasks'
  }

  if (preferred === 'add_tasks') {
    return decisionPolicy.hasPendingTasks ? 'start_focus' : 'update_progress'
  }

  if (preferred === 'create_plan') {
    return decisionPolicy.hasPendingTasks ? 'start_focus' : 'ask_question'
  }

  return decisionPolicy.hasPendingTasks ? 'start_focus' : 'ask_question'
}

function getEffectiveAction(
  preferred: ControllerAction,
  suggestionContext: SuggestionContext | undefined,
  message: string,
  decisionPolicy: DecisionPolicy,
  intent: { focus: boolean; studyPlan: boolean; dailyTasks: boolean; performance: boolean }
): { action: ControllerAction; rotated: boolean } {
  const lastSuggested = suggestionContext?.lastSuggestedAction || null
  const repeatStreak = suggestionContext?.repeatStreak ?? 0
  const userIgnored = hasUserIgnoredSuggestion(message)
  const shouldRotate =
    !!lastSuggested &&
    lastSuggested === preferred &&
    repeatStreak >= 1 &&
    !userIgnored &&
    !decisionPolicy.hasActiveFocus

  if (!shouldRotate) return { action: preferred, rotated: false }
  return {
    action: getRotatedAction(preferred, decisionPolicy, intent),
    rotated: true,
  }
}

function getFocusTaskTitle(
  currentFocusTask?: string | { id?: string; title?: string } | null,
  memoryContext?: MemoryContext
): string {
  if (typeof currentFocusTask === 'string') {
    const trimmed = currentFocusTask.trim()
    if (trimmed) return trimmed
  }

  if (
    currentFocusTask &&
    typeof currentFocusTask === 'object' &&
    typeof currentFocusTask.title === 'string' &&
    currentFocusTask.title.trim()
  ) {
    return currentFocusTask.title.trim()
  }

  const memoryFocus = memoryContext?.currentFocusTask?.trim()
  return memoryFocus || 'No active focus session'
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

function deriveDecisionPolicy(
  appState: AppStateContext | undefined,
  activeFocusTitle: string
): DecisionPolicy {
  const pendingTasksCount = Math.max(0, appState?.pendingTasksCount ?? 0)
  const hasActiveFocus = activeFocusTitle !== 'No active focus session'
  const nextPendingTaskTitle = appState?.nextPendingTaskTitle?.trim() || null

  return {
    hasActiveFocus,
    activeFocusTitle: hasActiveFocus ? activeFocusTitle : null,
    hasPendingTasks: pendingTasksCount > 0,
    pendingTasksCount,
    hasExistingPlan: !!appState?.latestPlanExamName,
    nextPendingTaskTitle,
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
  memoryContext?: MemoryContext,
  appState?: AppStateContext,
  activeFocusTitle = 'No active focus session',
  suggestionContext?: SuggestionContext
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
  const decisionPolicy = deriveDecisionPolicy(appState, activeFocusTitle)
  const preferredAction = getPreferredAction(intent, decisionPolicy)
  const { action: effectiveAction, rotated } = getEffectiveAction(
    preferredAction,
    suggestionContext,
    message,
    decisionPolicy,
    intent
  )

  if (decisionPolicy.hasActiveFocus && decisionPolicy.activeFocusTitle) {
    return {
      response: buildStructuredResponse(
        'start_focus',
        `You already have an active focus session on ${decisionPolicy.activeFocusTitle}. Next step: continue and complete this session before switching tasks.`,
        {
          taskTitle: decisionPolicy.activeFocusTitle,
        }
      ),
      intent,
    }
  }

  if (effectiveAction === 'start_focus' && decisionPolicy.hasPendingTasks) {
    const priorityTask =
      decisionPolicy.nextPendingTaskTitle ||
      perfData.weakAreas[0] ||
      'your highest-priority pending task'

    return {
      response: buildStructuredResponse(
        'start_focus',
        rotated
          ? `To keep progress moving, switch to your next pending task: ${priorityTask}. Next step: start focus and finish one full cycle.`
          : `You have ${decisionPolicy.pendingTasksCount} pending tasks already. Next step: start focus on ${priorityTask} before creating anything new.`,
        {
          taskTitle: priorityTask,
        }
      ),
      intent,
    }
  }

  if (effectiveAction === 'ask_question' && intent.studyPlan && decisionPolicy.hasExistingPlan) {
    const topTopic = appState?.latestPlanTopTopic || 'today\'s top plan topic'
    return {
      response: buildStructuredResponse(
        'ask_question',
        `A study plan already exists for ${appState?.latestPlanExamName}. Next step: execute ${topTopic} now, or tell me if you want to replace the current plan.`,
        {
          question: 'Should I replace your existing study plan, or continue with it?'
        }
      ),
      intent,
    }
  }
  
  if (effectiveAction === 'update_progress') {
    const weakArea = perfData.weakAreas[0] || 'your weakest topic'
    return {
      response: buildStructuredResponse(
        'update_progress',
        `Accuracy is ${perfData.overallAccuracy}% and completion is ${perfData.taskCompletionRate}%. Next step: run a 25-minute focus session on ${weakArea}.`,
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
  
  if (effectiveAction === 'add_tasks') {
    const adaptiveTasks = generateAdaptiveTasks(perfData, memoryContext)
    const firstTask = adaptiveTasks[0]?.replace(/^\[\w+\]\s*/, '') || 'Start studying'
    
    return {
      response: buildStructuredResponse(
        'add_tasks',
        `Added ${adaptiveTasks.length} tasks based on your weak areas. Next step: start focus on ${firstTask}.`,
        {
          tasks: adaptiveTasks,
          taskTitle: firstTask,
        }
      ),
      intent
    }
  }
  
  if (effectiveAction === 'create_plan') {
    const adaptivePlan = generateAdaptiveStudyPlan(perfData, syllabus?.examName || examName)
    const firstTopic = examSubjects[0]?.topics[0] || perfData.weakAreas[0] || 'Day 1 Topics'
    
    return {
      response: buildStructuredResponse(
        'create_plan',
        `Your ${examName} plan is ready in Study Planner. Next step: start your first focus session on ${firstTopic}.`,
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
        `Focus Mode is ready for ${suggestedFocus}. Next step: run one full 25-minute cycle now.`,
        {
          taskTitle: `${suggestedFocus} - Focused Practice`,
        }
      ),
      intent
    }
  }
  
  if (lowerMessage.includes('upsc') || lowerMessage.includes('ias') || lowerMessage.includes('civil service')) {
    const upscWeakArea = perfData.weakAreas[0] || 'Polity'
    return {
      response: buildStructuredResponse(
        'ask_question',
        `I can build UPSC work around your weak area: ${upscWeakArea}. Next step: choose plan, tasks, or focus session.`,
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
      `I can act on your current state right now. Next step: choose one of plan, tasks, performance, or focus session.`,
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
    const {
      message,
      messages: chatHistory,
      performanceData,
      memoryContext,
      currentFocusTask,
      appState,
      recentActionHistory,
      suggestionContext,
      selectedExamId,
    } = await request.json()
    
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
    const typedAppState =
      appState && typeof appState === 'object'
        ? (appState as AppStateContext)
        : undefined
    const activeFocusTitle = getFocusTaskTitle(currentFocusTask, memoryContext)
    const decisionPolicy = deriveDecisionPolicy(typedAppState, activeFocusTitle)
    const preferredAction = getPreferredAction(intent, decisionPolicy)
    const { action: effectiveAction, rotated: wasActionRotated } = getEffectiveAction(
      preferredAction,
      suggestionContext,
      message,
      decisionPolicy,
      intent
    )

    // If no API key, return mock response with streaming simulation
    if (!apiKey) {
      const { response: mockResponse, intent: detectedIntent } = getMockResponse(
        message,
        performanceData,
        syllabus,
        memoryContext,
        typedAppState,
        activeFocusTitle,
        suggestionContext
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
- Current Focus Session: ${activeFocusTitle}

USE THIS MEMORY to adjust recommendations:
- Avoid repeating the same tasks that were recently completed.
- Increase challenge if recent quiz scores are improving.
- Reinforce weak areas that still show low performance.`
    }

    let appStateContext = ''
    if (typedAppState) {
      appStateContext = `

## LIVE APP STATE:
- Active Page: ${typedAppState.activePage || 'Unknown'}
- Pending Tasks: ${typedAppState.pendingTasksCount ?? 0}
- Completed Tasks: ${typedAppState.completedTasksCount ?? 0}
- Latest Plan Exam: ${typedAppState.latestPlanExamName || 'None'}
- Latest Plan Top Topic: ${typedAppState.latestPlanTopTopic || 'None'}
- Next Pending Task: ${typedAppState.nextPendingTaskTitle || 'None'}

USE THIS STATE in your response:
- Mention one concrete state item when giving a recommendation.
- If a focus session is active, continue that task before suggesting a new one.
- If pending tasks exist, prioritize the top pending task as the next action.
- If no pending tasks exist, create a small immediate action list.
- Use explicit subject/task names from this state and context in both message and next step.`
    }

  const decisionPolicyContext = `

## DECISION PRIORITY POLICY:
1) If an active focus session exists, continue that task and avoid introducing new actions.
2) If pending tasks exist, prioritize executing them before creating new tasks or plans.
3) Suggest creating a new study plan only when no existing plan is available.
4) If recommendations are repetitive, choose the next pending or plan-linked task instead.

Current Policy State:
- Active Focus Session: ${decisionPolicy.hasActiveFocus ? decisionPolicy.activeFocusTitle : 'No'}
- Pending Tasks Count: ${decisionPolicy.pendingTasksCount}
- Existing Plan Present: ${decisionPolicy.hasExistingPlan ? 'Yes' : 'No'}
- Priority Pending Task: ${decisionPolicy.nextPendingTaskTitle || 'None'}

Policy Enforcement:
- Do not return purely informational text.
- Keep action + next step tightly aligned with this policy.
- If completed tasks are greater than 0, acknowledge progress briefly (example: You’ve completed 3 out of 5 tasks) and immediately guide the next step.
- Tone guardrail: if completion or consistency is below 55, be encouraging with a concrete corrective action; if 75 or above, reinforce progress and raise precision.
- Do not use vague phrases like "keep going" unless tied to a specific subject or task title.`

  const suggestionContextBlock = `

## SUGGESTION CONTINUITY:
- Last Suggested Action: ${suggestionContext?.lastSuggestedAction || 'None'}
- Last Suggested Task: ${suggestionContext?.lastSuggestedTaskTitle || 'None'}
- Suggestion Repeat Streak: ${suggestionContext?.repeatStreak ?? 0}
- Current Effective Action: ${effectiveAction}
- Action Rotated This Turn: ${wasActionRotated ? 'Yes' : 'No'}

Anti-repetition rules:
- Avoid repeating the same next step unless the user explicitly ignored/deferred it.
- If repeating would occur, rotate to the next meaningful action based on current state.
- Keep recommendations progressive and context-aware.`

    let actionContinuityContext = ''
    if (Array.isArray(recentActionHistory) && recentActionHistory.length > 0) {
      const normalized = recentActionHistory
        .filter(
          (item): item is RecentActionContext =>
            !!item &&
            typeof item === 'object' &&
            typeof item.action === 'string' &&
            typeof item.summary === 'string'
        )
        .slice(-3)

      if (normalized.length > 0) {
        actionContinuityContext = `

## RECENT AGENT ACTIONS:
${normalized.map((item, index) => `${index + 1}. ${item.action}: ${item.summary}`).join('\n')}

CONTINUITY REQUIREMENT:
- Continue from the latest action above whenever relevant.
- Mention exactly one continuity reference in the message when it helps the user act now.`
      }
    }

    // Build messages array for OpenAI with enhanced context
    const contextMessage =
      effectiveAction === 'start_focus'
        ? '\n\nReturn a JSON object with action="start_focus", a plain text message, and data.taskTitle set to the active or top pending task. Guide continuation/completion of concrete work now.'
        : effectiveAction === 'ask_question'
          ? '\n\nReturn a JSON object with action="ask_question", a plain text message, and data.question that resolves the next decision while still recommending immediate progress on current work.'
          : effectiveAction === 'create_plan'
            ? '\n\nReturn a JSON object with action="create_plan", a plain text message, and data.plan. Also include data.tasks for immediate execution and data.taskTitle for the first focus task.'
            : effectiveAction === 'add_tasks'
              ? '\n\nReturn a JSON object with action="add_tasks", a plain text message, and data.tasks. Keep tasks executable now and non-repetitive with recent suggestions.'
              : '\n\nReturn a JSON object with action="update_progress", a plain text message, and data.progress. Include one concrete next action based on current state.'

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + syllabusContext + performanceContext + memoryLayerContext + appStateContext + decisionPolicyContext + suggestionContextBlock + actionContinuityContext + contextMessage },
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
    let pendingSseBuffer = ''

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        pendingSseBuffer += decoder.decode(chunk, { stream: true })
        const lines = pendingSseBuffer.split('\n')
        pendingSseBuffer = lines.pop() ?? ''

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line || !line.startsWith('data: ')) continue

          const data = line.slice(6)
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              // Send intent metadata with first content chunk.
              if (isFirstChunk) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  meta: true,
                  intent,
                })}\n\n`))
                isFirstChunk = false
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          } catch {
            // Ignore malformed stream fragments.
          }
        }
      },
      flush(controller) {
        const remainder = pendingSseBuffer.trim()
        if (!remainder || !remainder.startsWith('data: ')) return

        const data = remainder.slice(6)
        if (data === '[DONE]') {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          return
        }

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            if (isFirstChunk) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                meta: true,
                intent,
              })}\n\n`))
              isFirstChunk = false
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
        } catch {
          // Ignore malformed trailing fragment.
        }
      },
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
