// Re-export types from store for convenience
export type {
  Exam,
  Task,
  StudyPlan,
  ScheduleItem,
  Message,
  QuizQuestion,
  QuizResult,
} from './store'

// API Response types
export interface ChatResponse {
  response: string
  intent?: {
    focus: boolean
    studyPlan: boolean
    dailyTasks: boolean
  }
}

export interface StreamChunk {
  content?: string
  meta?: boolean
  intent?: {
    focus: boolean
    studyPlan: boolean
    dailyTasks: boolean
  }
}

// Quiz types
export interface QuizCategory {
  id: string
  name: string
  icon: string
  description: string
  questionCount: number
}

// Timer types
export type TimerMode = 'work' | 'shortBreak' | 'longBreak'

export interface TimerSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

// Navigation types
export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// Chart data types
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}
