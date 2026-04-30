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
 * Strip agent action blocks from a message before display.
 */
export function stripAgentActions(content: string): string {
  return content.replace(/\[AGENT_ACTIONS\][\s\S]*?\[\/AGENT_ACTIONS\]/g, '').trim()
}

function formatPageName(page: string): string {
  return page
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
