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

function normalizeStructuredData(data: unknown): StructuredChatData {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const raw = data as Record<string, unknown>
  const plan =
    raw.plan && typeof raw.plan === 'object'
      ? (raw.plan as StructuredChatData['plan'])
      : raw.studyPlan && typeof raw.studyPlan === 'object'
        ? (raw.studyPlan as StructuredChatData['plan'])
        : undefined

  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.filter((task): task is string => typeof task === 'string')
    : Array.isArray(raw.dailyTasks)
      ? raw.dailyTasks.filter((task): task is string => typeof task === 'string')
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

  try {
    const parsed = JSON.parse(candidate) as Partial<StructuredChatResponse> & {
      data?: unknown
    }
    const action = isStructuredChatAction(parsed.action)
      ? parsed.action
      : 'ask_question'
    const message = normalizeText(parsed.message, normalizeText(content, ''))

    return {
      action,
      message: message || 'I need a little more information to continue.',
      data: normalizeStructuredData(parsed.data),
    }
  } catch {
    return {
      action: 'ask_question',
      message:
        normalizeText(candidate, '') ||
        'I need a little more information to continue.',
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
        deps.addTask({ title: action.taskTitle, completed: false })
        // Find the newly added task to attach the focus session to it,
        // navigate to the page, close the chat, and arm the auto-start
        // flag so the Pomodoro timer kicks off the moment the page mounts.
        setTimeout(() => {
          const newTask = deps
            .getTasks()
            .find((t) => t.title === action.taskTitle && !t.completed)
          deps.setCurrentFocusTask(
            newTask
              ? { id: newTask.id, title: newTask.title }
              : { id: `focus-${Date.now()}`, title: action.taskTitle }
          )
          deps.setActivePage('focus-mode')
          deps.setChatOpen(false)
          deps.setFocusAutoStart(true)
        }, 50)
        return {
          action,
          status: 'success',
          message: `Starting focus timer: ${action.taskTitle}`,
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
        // Handled separately in chat panel via UI state
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
      return [
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
        executeAgentAction({ type: 'navigate', page: 'study-planner' }, deps),
      ]
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
