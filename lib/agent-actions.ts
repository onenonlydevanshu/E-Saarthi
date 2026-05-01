/**
 * Agent Action System
 *
 * The AI can emit structured JSON commands inside [AGENT_ACTIONS]...[/AGENT_ACTIONS]
 * blocks in its responses. These are parsed on the client and executed against
 * the Zustand store, automatically triggering UI updates.
 *
 * This makes the chatbot a true "agent" - every feature in the app can be
 * controlled via natural language conversation.
 */

import type { ScheduleItem } from './store'

export type StructuredChatAction =
  | 'create_plan'
  | 'add_tasks'
  | 'start_focus'
  | 'update_progress'
  | 'ask_question'

export interface StructuredChatData {
  plan?: {
    examName: string
    examDate: string
    hoursPerDay: number
    schedule: ScheduleItem[]
  }
  tasks?: string[]
  taskTitle?: string
  progress?: Record<string, unknown>
  question?: string
  [key: string]: unknown
}

export interface StructuredChatResponse {
  action: StructuredChatAction
  message: string
  data?: StructuredChatData
}

const DEFAULT_NEXT_STEPS: Record<StructuredChatAction, string> = {
  create_plan:
    'Next step: add today\'s plan tasks and start a 25-minute focus session on the first topic.',
  add_tasks:
    'Next step: start a focus session on the first task and then mark it complete.',
  start_focus:
    'Next step: stay in Focus Mode for one full 25-minute session before switching tasks.',
  update_progress:
    'Next step: pick one weak area and schedule a focused practice block today.',
  ask_question:
    'Next step: tell me your immediate goal so I can take the right action for you.',
}

const DEFAULT_ACTION_FEEDBACK: Record<StructuredChatAction, string> = {
  create_plan: 'Plan generated.',
  add_tasks: 'Tasks updated.',
  start_focus: 'Focus activated.',
  update_progress: 'Progress analyzed.',
  ask_question: 'I need one detail to proceed.',
}

// All supported action types the agent can emit
export type AgentAction =
  | { type: 'navigate'; page: AppPage }
  | { type: 'add_task'; title: string }
  | { type: 'add_tasks'; titles: string[] }
  | { type: 'complete_task'; title: string }
  | { type: 'clear_tasks' }
  | {
      type: 'add_study_plan'
      examName: string
      examDate: string
      hoursPerDay: number
      schedule: ScheduleItem[]
    }
  | { type: 'start_focus'; taskTitle: string }
  | { type: 'select_exam'; examId: string }
  | {
      type: 'add_exam'
      name: string
      date: string
      category: 'government' | 'private'
      description?: string
    }
  | { type: 'set_theme'; theme: 'light' | 'dark' }
  | { type: 'show_focus_prompt' }
  | { type: 'open_chat' }
  | { type: 'close_chat' }

export type AppPage =
  | 'dashboard'
  | 'study-planner'
  | 'daily-tasks'
  | 'upcoming-exams'
  | 'mock-tests'
  | 'progress-tracker'
  | 'focus-mode'

// Public-facing description of what each action does (used in system prompt)
export const AGENT_ACTION_SCHEMA = `
Available agent actions (emit as JSON array inside [AGENT_ACTIONS]...[/AGENT_ACTIONS]):

1. { "type": "navigate", "page": "dashboard" | "study-planner" | "daily-tasks" | "upcoming-exams" | "mock-tests" | "progress-tracker" | "focus-mode" }
   - Switches the active page in the UI.

2. { "type": "add_task", "title": "Task description" }
   - Adds a single task to Daily Tasks.

3. { "type": "add_tasks", "titles": ["Task 1", "Task 2"] }
   - Adds multiple tasks to Daily Tasks at once.

4. { "type": "complete_task", "title": "Exact task title" }
   - Marks a task as completed by its title.

5. { "type": "clear_tasks" }
   - Removes all tasks from Daily Tasks.

6. { "type": "add_study_plan", "examName": "...", "examDate": "YYYY-MM-DD", "hoursPerDay": 6, "schedule": [...] }
   - Adds a complete study plan to the Study Planner.

7. { "type": "start_focus", "taskTitle": "What to study" }
   - Adds the task and immediately starts Focus Mode timer for it.

8. { "type": "select_exam", "examId": "upsc" | "ssc-cgl" | "rrb-ntpc" | "cat" | "bank-po" | "gate" }
   - Changes the selected exam syllabus.

9. { "type": "add_exam", "name": "Exam Name", "date": "YYYY-MM-DD", "category": "government" | "private", "description": "..." }
   - Adds an exam to the user's Upcoming Exams list.

10. { "type": "set_theme", "theme": "light" | "dark" }
    - Switches the UI theme.

11. { "type": "show_focus_prompt" }
    - Shows a focus mode prompt card (used when student says they're distracted).

12. { "type": "open_chat" } / { "type": "close_chat" }
    - Opens or closes the chat panel.
`.trim()

export const CHAT_CONTROLLER_SCHEMA = `
Primary controller payload (return as a single JSON object only):

{
  "action": "create_plan" | "add_tasks" | "start_focus" | "update_progress" | "ask_question",
  "message": "Human-readable assistant response in plain text",
  "data": {
    "plan": { "examName": "...", "examDate": "YYYY-MM-DD", "hoursPerDay": 6, "schedule": [...] },
    "tasks": ["Task 1", "Task 2"],
    "taskTitle": "Specific task to focus on",
    "progress": {}
  }
}

Rules:
- "action", "message", and "data" are required.
- "message" must be plain text only.
- Include "data.plan" when you generate a study plan.
- Include "data.tasks" when you generate tasks.
- Include "data.taskTitle" for focus starts.
- Include "data.progress" when summarizing performance.
`.trim()

// Methods the executor needs from the Zustand store
export interface AgentActionExecutorDeps {
  setActivePage: (page: string) => void
  addTask: (task: { title: string; completed: boolean }) => void
  toggleTask: (id: string) => void
  clearTasks: () => void
  addStudyPlan: (plan: {
    examName: string
    examDate: string
    hoursPerDay: number
    schedule: ScheduleItem[]
  }) => void
  setCurrentFocusTask: (task: { id: string; title: string } | null) => void
  setFocusAutoStart: (value: boolean) => void
  setSelectedExamId: (id: string | null) => void
  addExam: (exam: {
    name: string
    date: string
    category: 'government' | 'private'
    description?: string
  }) => void
  setTheme: (theme: 'light' | 'dark') => void
  setChatOpen: (open: boolean) => void
  getTasks: () => Array<{ id: string; title: string; completed: boolean }>
  setShowFocusPrompt?: (value: boolean) => void
}

export interface ExecutedAction {
  action: AgentAction
  status: 'success' | 'error'
  message: string
}

export interface ChatControllerData {
  plan?: {
    examName: string
    examDate: string
    hoursPerDay: number
    schedule: ScheduleItem[]
  }
  tasks?: string[]
  taskTitle?: string
  studyPlan?: {
    examName: string
    examDate: string
    hoursPerDay: number
    schedule: ScheduleItem[]
  }
  dailyTasks?: string[]
}

export interface ChatControllerPayload {
  message: string
  action?: StructuredChatAction
  actions: AgentAction[]
  data?: ChatControllerData
}

export interface StructuredChatResponseResult {
  response: StructuredChatResponse
  executedActions: ExecutedAction[]
}

export interface StructuredChatResponseHandlerDeps extends AgentActionExecutorDeps {
  setDetectedPlan?: (plan: StructuredChatData['plan'] | null) => void
  setDetectedTasks?: (tasks: string[] | null) => void
}

function hasNextStepSuggestion(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('next step:') ||
    normalized.includes('next,') ||
    normalized.includes('you should') ||
    normalized.includes('start with')
  )
}

function ensureNextStepMessage(
  action: StructuredChatAction,
  message: string,
  data?: StructuredChatData
): string {
  const trimmed = message.trim()
  if (hasNextStepSuggestion(trimmed)) return trimmed

  if (action === 'start_focus' && data?.taskTitle) {
    return `${trimmed} Next step: start the timer for "${data.taskTitle}" now.`
  }

  if (action === 'create_plan') {
    const firstPlanTask = data?.plan?.schedule?.[0]?.topics?.[0]
    if (firstPlanTask) {
      return `${trimmed} Next step: begin with "${firstPlanTask}" and launch Focus Mode.`
    }
  }

  return `${trimmed} ${DEFAULT_NEXT_STEPS[action]}`.trim()
}

function hasActionFeedback(action: StructuredChatAction, message: string): boolean {
  const normalized = message.toLowerCase()
  switch (action) {
    case 'create_plan':
      return normalized.includes('plan') && (normalized.includes('created') || normalized.includes('generated') || normalized.includes('ready'))
    case 'add_tasks':
      return normalized.includes('task') && (normalized.includes('added') || normalized.includes('updated') || normalized.includes('created'))
    case 'start_focus':
      return normalized.includes('focus') && (normalized.includes('started') || normalized.includes('active') || normalized.includes('ready'))
    case 'update_progress':
      return normalized.includes('progress') || normalized.includes('accuracy') || normalized.includes('performance')
    case 'ask_question':
      return normalized.includes('?') || normalized.includes('need') || normalized.includes('share')
    default:
      return false
  }
}

function ensureActionFeedbackMessage(
  action: StructuredChatAction,
  message: string
): string {
  const trimmed = message.trim()
  if (!trimmed) return DEFAULT_ACTION_FEEDBACK[action]
  if (hasActionFeedback(action, trimmed)) return trimmed
  return `${DEFAULT_ACTION_FEEDBACK[action]} ${trimmed}`.trim()
}

function getPrimaryReference(data?: StructuredChatData): string | null {
  if (!data) return null
  const taskReference = data.taskTitle?.trim() || data.tasks?.[0]?.trim()
  if (taskReference) return taskReference

  const planTopic = data.plan?.schedule?.[0]?.topics?.[0]?.trim()
  if (planTopic) return planTopic

  const planExam = data.plan?.examName?.trim()
  if (planExam) return planExam

  const progress = data.progress as Record<string, unknown> | undefined
  const weakAreas = Array.isArray(progress?.weakAreas)
    ? progress?.weakAreas.filter((item): item is string => typeof item === 'string')
    : []
  return weakAreas[0] || null
}

function ensureSpecificReferenceMessage(
  action: StructuredChatAction,
  message: string,
  data?: StructuredChatData
): string {
  const trimmed = message.trim()
  const reference = getPrimaryReference(data)
  if (!reference) return trimmed
  if (trimmed.toLowerCase().includes(reference.toLowerCase())) return trimmed

  if (action === 'start_focus') {
    return `${trimmed} Focus target: ${reference}.`
  }

  return `${trimmed} Priority focus: ${reference}.`
}

function ensureProgressToneMessage(
  action: StructuredChatAction,
  message: string,
  data?: StructuredChatData
): string {
  if (action !== 'update_progress') return message

  const progress = data?.progress as Record<string, unknown> | undefined
  const completion = typeof progress?.taskCompletionRate === 'number' ? progress.taskCompletionRate : null
  const consistency = typeof progress?.studyConsistency === 'number' ? progress.studyConsistency : null
  const accuracy = typeof progress?.overallAccuracy === 'number' ? progress.overallAccuracy : null

  const lowered = message.toLowerCase()
  if (lowered.includes('consistency') || lowered.includes('on track') || lowered.includes('behind')) {
    return message
  }

  if (
    (completion !== null && completion < 55) ||
    (consistency !== null && consistency < 55) ||
    (accuracy !== null && accuracy < 60)
  ) {
    return `${message} You are behind on consistency, so focus on one high-impact weak-area task now.`
  }

  if (
    (completion !== null && completion >= 75) &&
    (consistency !== null && consistency >= 75)
  ) {
    return `${message} Your consistency is strong, so reinforce it with one targeted task next.`
  }

  return `${message} Your progress is steady, so lock in one specific task next.`
}

function replaceGenericEncouragement(message: string, data?: StructuredChatData): string {
  const reference = getPrimaryReference(data)
  if (!reference) return message

  return message
    .replace(/\bkeep going\b/gi, `continue with ${reference}`)
    .replace(/\bstay consistent\b/gi, `stay consistent on ${reference}`)
}

function personalizeMessage(
  action: StructuredChatAction,
  message: string,
  data?: StructuredChatData
): string {
  const specific = ensureSpecificReferenceMessage(action, message, data)
  const toned = ensureProgressToneMessage(action, specific, data)
  return replaceGenericEncouragement(toned, data)
}

function makeMessageConcise(message: string): string {
  const collapsed = message.replace(/\s+/g, ' ').trim()
  const sentenceParts = collapsed
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const twoSentenceMessage = sentenceParts.slice(0, 2).join(' ').trim() || collapsed
  if (twoSentenceMessage.length <= 220) return twoSentenceMessage
  return `${twoSentenceMessage.slice(0, 217).trimEnd()}...`
}

function deriveTasksFromPlan(plan: StructuredChatData['plan']): string[] {
  if (!plan?.schedule?.length) return []

  return plan.schedule
    .slice(0, 2)
    .flatMap((day) =>
      (day.topics || []).slice(0, 2).map((topic) => `Day ${day.day}: ${topic}`)
    )
    .filter(Boolean)
    .slice(0, 6)
}

function isStructuredChatAction(value: unknown): value is StructuredChatAction {
  return (
    value === 'create_plan' ||
    value === 'add_tasks' ||
    value === 'start_focus' ||
    value === 'update_progress' ||
    value === 'ask_question'
  )
}

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function normalizeStructuredData(data: unknown): StructuredChatData {
  const parsedData = parseMaybeJson(data)
  if (!parsedData || typeof parsedData !== 'object') {
    return {}
  }

  const raw = parsedData as Record<string, unknown>
  const parsedPlan = parseMaybeJson(raw.plan)
  const parsedStudyPlan = parseMaybeJson(raw.studyPlan)
  const parsedTasks = parseMaybeJson(raw.tasks)
  const parsedDailyTasks = parseMaybeJson(raw.dailyTasks)
  const plan =
    parsedPlan && typeof parsedPlan === 'object'
      ? (parsedPlan as StructuredChatData['plan'])
      : parsedStudyPlan && typeof parsedStudyPlan === 'object'
        ? (parsedStudyPlan as StructuredChatData['plan'])
        : undefined

  const tasks = Array.isArray(parsedTasks)
    ? parsedTasks.filter((task): task is string => typeof task === 'string')
    : Array.isArray(parsedDailyTasks)
      ? parsedDailyTasks.filter((task): task is string => typeof task === 'string')
      : undefined

  const taskTitle = normalizeText(raw.taskTitle ?? raw.focusTask ?? tasks?.[0], '')

  const progress =
    raw.progress && typeof raw.progress === 'object'
      ? (raw.progress as Record<string, unknown>)
      : undefined

  const question = normalizeText(raw.question, '')

  return {
    ...raw,
    ...(plan ? { plan } : {}),
    ...(tasks ? { tasks } : {}),
    ...(taskTitle ? { taskTitle } : {}),
    ...(progress ? { progress } : {}),
    ...(question ? { question } : {}),
  }
}

function normalizeTaskTitle(taskTitle: string): string {
  return taskTitle.trim()
}

export function startFocusSession(
  taskTitle: string,
  deps: AgentActionExecutorDeps
): { taskTitle: string; taskId: string | null } | null {
  const normalizedTitle = normalizeTaskTitle(taskTitle)
  if (!normalizedTitle) return null

  const existingTask = deps
    .getTasks()
    .find((task) => !task.completed && task.title.trim() === normalizedTitle)

  if (!existingTask) {
    deps.addTask({ title: normalizedTitle, completed: false })
  }

  const selectedTask =
    deps
      .getTasks()
      .find((task) => !task.completed && task.title.trim() === normalizedTitle) ??
    existingTask

  const taskId = selectedTask?.id ?? null
  deps.setCurrentFocusTask(
    taskId
      ? { id: taskId, title: selectedTask?.title ?? normalizedTitle }
      : { id: `focus-${Date.now()}`, title: normalizedTitle }
  )
  deps.setFocusAutoStart(true)
  deps.setActivePage('focus-mode')
  deps.setShowFocusPrompt?.(false)
  deps.setChatOpen(false)

  return {
    taskTitle: normalizedTitle,
    taskId,
  }
}

function extractJsonCandidate(content: string): string {
  const trimmed = content.trim()
  const legacyMatch = trimmed.match(/\[CHAT_CONTROLLER\]([\s\S]*?)\[\/CHAT_CONTROLLER\]/)
  const source = legacyMatch?.[1]?.trim() ?? trimmed

  const fenced = source
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  if (fenced.startsWith('{') && fenced.endsWith('}')) {
    return fenced
  }

  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return fenced.slice(start, end + 1)
  }

  return fenced
}

export function normalizeStructuredChatResponse(
  content: string
): StructuredChatResponse {
  const candidate = extractJsonCandidate(content)
  const fallbackMessage = normalizeText(stripAgentActions(content), '')

  try {
    const parsed = JSON.parse(candidate) as Partial<StructuredChatResponse> & {
      data?: unknown
    }
    const action = isStructuredChatAction(parsed.action)
      ? parsed.action
      : 'ask_question'
    const message = normalizeText(
      parsed.message,
      fallbackMessage || normalizeText(content, '')
    )

    const normalizedData = normalizeStructuredData(parsed.data)
    const normalizedMessage = makeMessageConcise(
      ensureNextStepMessage(
        action,
        personalizeMessage(
          action,
          ensureActionFeedbackMessage(
            action,
            message || 'I need a little more information to continue.'
          ),
          normalizedData
        ),
        normalizedData
      )
    )

    return {
      action,
      message: normalizedMessage,
      data: normalizedData,
    }
  } catch {
    const fallback =
      fallbackMessage ||
      normalizeText(candidate, '') ||
      'I need a little more information to continue.'
    return {
      action: 'ask_question',
      message: makeMessageConcise(
        ensureNextStepMessage(
          'ask_question',
          personalizeMessage(
            'ask_question',
            ensureActionFeedbackMessage('ask_question', fallback)
          )
        )
      ),
      data: {},
    }
  }
}

/**
 * Execute a single agent action against the store.
 */
export function executeAgentAction(
  action: AgentAction,
  deps: AgentActionExecutorDeps
): ExecutedAction {
  try {
    switch (action.type) {
      case 'navigate': {
        deps.setActivePage(action.page)
        return {
          action,
          status: 'success',
          message: `Navigated to ${formatPageName(action.page)}`,
        }
      }

      case 'add_task': {
        deps.addTask({ title: action.title, completed: false })
        return {
          action,
          status: 'success',
          message: `Added task: ${action.title}`,
        }
      }

      case 'add_tasks': {
        action.titles.forEach((title) =>
          deps.addTask({ title, completed: false })
        )
        return {
          action,
          status: 'success',
          message: `Added ${action.titles.length} tasks to Daily Tasks`,
        }
      }

      case 'complete_task': {
        const task = deps
          .getTasks()
          .find(
            (t) =>
              t.title.toLowerCase().trim() ===
              action.title.toLowerCase().trim()
          )
        if (task && !task.completed) {
          deps.toggleTask(task.id)
          return {
            action,
            status: 'success',
            message: `Marked "${action.title}" as completed`,
          }
        }
        return {
          action,
          status: 'error',
          message: `Could not find an open task matching "${action.title}"`,
        }
      }

      case 'clear_tasks': {
        deps.clearTasks()
        return { action, status: 'success', message: 'Cleared all tasks' }
      }

      case 'add_study_plan': {
        // Defensive: ensure every schedule item has a `date` field even if
        // the AI forgot to emit one. We backfill from "tomorrow + day - 1".
        const today = new Date()
        const normalizedSchedule = action.schedule.map((item, idx) => {
          if (item.date) return item
          const d = new Date(today)
          d.setDate(today.getDate() + (item.day ?? idx + 1))
          return { ...item, date: d.toISOString().split('T')[0] }
        })
        deps.addStudyPlan({
          examName: action.examName,
          examDate: action.examDate,
          hoursPerDay: action.hoursPerDay,
          schedule: normalizedSchedule,
        })
        return {
          action,
          status: 'success',
          message: `Added ${normalizedSchedule.length}-day plan: ${action.examName}`,
        }
      }

      case 'start_focus': {
        const focusResult = startFocusSession(action.taskTitle, deps)
        return {
          action,
          status: 'success',
          message: focusResult
            ? `Active task set: ${focusResult.taskTitle}. Focus timer started.`
            : `Unable to start focus for task: ${action.taskTitle}`,
        }
      }

      case 'select_exam': {
        deps.setSelectedExamId(action.examId)
        return {
          action,
          status: 'success',
          message: `Switched syllabus to ${action.examId.toUpperCase()}`,
        }
      }

      case 'add_exam': {
        deps.addExam({
          name: action.name,
          date: action.date,
          category: action.category,
          description: action.description,
        })
        return {
          action,
          status: 'success',
          message: `Added ${action.name} to upcoming exams`,
        }
      }

      case 'set_theme': {
        deps.setTheme(action.theme)
        return {
          action,
          status: 'success',
          message: `Switched to ${action.theme} mode`,
        }
      }

      case 'show_focus_prompt': {
        deps.setShowFocusPrompt?.(true)
        return {
          action,
          status: 'success',
          message: 'Showed focus prompt',
        }
      }

      case 'open_chat': {
        deps.setChatOpen(true)
        return { action, status: 'success', message: 'Opened chat' }
      }

      case 'close_chat': {
        deps.setChatOpen(false)
        return { action, status: 'success', message: 'Closed chat' }
      }

      default: {
        return {
          action,
          status: 'error',
          message: 'Unknown action type',
        }
      }
    }
  } catch (err) {
    return {
      action,
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to execute action',
    }
  }
}

/**
 * Parse an [AGENT_ACTIONS]...[/AGENT_ACTIONS] block from raw AI output.
 * Returns the actions array if found, otherwise null.
 */
export function parseAgentActions(content: string): AgentAction[] | null {
  const match = content.match(/\[AGENT_ACTIONS\]([\s\S]*?)\[\/AGENT_ACTIONS\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (a): a is AgentAction =>
          typeof a === 'object' && a !== null && typeof a.type === 'string'
      )
    }
    return null
  } catch {
    return null
  }
}

/**
 * Parse a [CHAT_CONTROLLER]...[/CHAT_CONTROLLER] block.
 * Returns null when missing or invalid.
 */
export function parseChatControllerPayload(
  content: string
): ChatControllerPayload | null {
  const structured = normalizeStructuredChatResponse(content)
  const actions: AgentAction[] = []
  const plan = structured.data?.plan
  const tasks = structured.data?.tasks ?? []
  const taskTitle = structured.data?.taskTitle || tasks[0]

  if (structured.action === 'create_plan' && plan) {
    actions.push({
      type: 'add_study_plan',
      examName: plan.examName,
      examDate: plan.examDate,
      hoursPerDay: plan.hoursPerDay,
      schedule: plan.schedule,
    })
  }

  if (structured.action === 'add_tasks' && tasks.length > 0) {
    actions.push({ type: 'add_tasks', titles: tasks })
  }

  if (structured.action === 'start_focus' && taskTitle) {
    actions.push({ type: 'start_focus', taskTitle })
  }

  if (structured.action === 'update_progress') {
    actions.push({ type: 'navigate', page: 'progress-tracker' })
  }

  return {
    message: structured.message,
    action: structured.action,
    actions,
    data: structured.data,
  }
}

export function executeStructuredChatResponse(
  payload: StructuredChatResponse,
  deps: AgentActionExecutorDeps
): ExecutedAction[] {
  switch (payload.action) {
    case 'create_plan': {
      const plan = payload.data?.plan
      if (!plan) return []
      const derivedTasks =
        payload.data?.tasks && payload.data.tasks.length > 0
          ? payload.data.tasks
          : deriveTasksFromPlan(plan)

      const actions: ExecutedAction[] = [
        executeAgentAction(
          {
            type: 'add_study_plan',
            examName: plan.examName,
            examDate: plan.examDate,
            hoursPerDay: plan.hoursPerDay,
            schedule: plan.schedule,
          },
          deps
        ),
      ]

      if (derivedTasks.length > 0) {
        actions.push(
          executeAgentAction({ type: 'add_tasks', titles: derivedTasks }, deps)
        )
      }

      actions.push(executeAgentAction({ type: 'navigate', page: 'study-planner' }, deps))

      return actions
    }

    case 'add_tasks': {
      const tasks = payload.data?.tasks ?? []
      if (tasks.length === 0) return []
      return [
        executeAgentAction({ type: 'add_tasks', titles: tasks }, deps),
        executeAgentAction({ type: 'navigate', page: 'daily-tasks' }, deps),
      ]
    }

    case 'start_focus': {
      const taskTitle = payload.data?.taskTitle || payload.data?.tasks?.[0]
      if (!taskTitle) return []
      return [executeAgentAction({ type: 'start_focus', taskTitle }, deps)]
    }

    case 'update_progress': {
      return [
        executeAgentAction({ type: 'navigate', page: 'progress-tracker' }, deps),
      ]
    }

    case 'ask_question':
    default:
      return []
  }
}

export function handleStructuredChatResponse(
  content: string,
  deps: StructuredChatResponseHandlerDeps
): StructuredChatResponseResult {
  const response = normalizeStructuredChatResponse(content)
  if (response.action === 'create_plan' && response.data?.plan) {
    const autoTasks =
      response.data.tasks && response.data.tasks.length > 0
        ? response.data.tasks
        : deriveTasksFromPlan(response.data.plan)
    response.data = {
      ...response.data,
      tasks: autoTasks,
      taskTitle:
        response.data.taskTitle || autoTasks[0] || response.data.plan.schedule?.[0]?.topics?.[0],
    }
  }

  response.message = makeMessageConcise(
    ensureNextStepMessage(
      response.action,
      personalizeMessage(
        response.action,
        ensureActionFeedbackMessage(response.action, response.message),
        response.data
      ),
      response.data
    )
  )

  if (response.data?.plan) {
    deps.setDetectedPlan?.(response.data.plan)
  }

  if (response.data?.tasks?.length) {
    deps.setDetectedTasks?.(response.data.tasks)
  }

  const executedActions = executeStructuredChatResponse(response, deps)

  if (response.action === 'ask_question' && response.data?.question) {
    deps.setDetectedPlan?.(null)
    deps.setDetectedTasks?.(null)
  }

  return { response, executedActions }
}

/**
 * Strip agent action blocks from a message before display.
 */
export function stripAgentActions(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[AGENT_ACTIONS\][\s\S]*?\[\/AGENT_ACTIONS\]/g, '')
    .replace(/\[CHAT_CONTROLLER\][\s\S]*?\[\/CHAT_CONTROLLER\]/g, '')
    .trim()
}

function formatPageName(page: string): string {
  return page
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
