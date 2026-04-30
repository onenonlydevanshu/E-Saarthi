// Timer durations (in seconds)
export const TIMER_DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
} as const

export const SESSIONS_BEFORE_LONG_BREAK = 4

// Quiz categories
export const QUIZ_CATEGORIES = [
  {
    id: 'gk',
    name: 'General Knowledge',
    description: 'Current affairs and static GK',
    questionCount: 10,
  },
  {
    id: 'quant',
    name: 'Quantitative Aptitude',
    description: 'Math and numerical ability',
    questionCount: 10,
  },
  {
    id: 'reasoning',
    name: 'Logical Reasoning',
    description: 'Analytical and logical thinking',
    questionCount: 10,
  },
  {
    id: 'english',
    name: 'English',
    description: 'Grammar and comprehension',
    questionCount: 10,
  },
] as const

// Exam categories
export const EXAM_CATEGORIES = ['government', 'private'] as const
export type ExamCategory = typeof EXAM_CATEGORIES[number]

// Focus keywords for chat detection
export const FOCUS_KEYWORDS = [
  'distract', 'distraction', 'distracted',
  'unfocus', 'unfocused', "can't focus", 'cannot focus', 'not focused',
  'losing focus', 'lost focus', 'no focus',
  "can't concentrate", 'cannot concentrate', 'not concentrating',
  'procrastinating', 'procrastination', 'procrastinate',
  'wandering', 'mind wandering',
  'not productive', 'unproductive',
  'need to focus', 'help me focus', 'want to focus',
  'struggling to study', "can't study", 'cannot study',
  'attention', 'attention span', 'losing attention',
  'overwhelmed', 'stressed', 'anxious about studying',
  'start focus', 'activate focus', 'enable focus mode',
  'pomodoro', 'timer', 'focus timer'
] as const

// Study plan keywords
export const STUDY_PLAN_KEYWORDS = [
  'study plan', 'schedule', 'timetable', 'routine',
  'plan my', 'create plan', 'make plan', 'generate plan',
  'weekly plan', 'monthly plan', 'preparation plan'
] as const

// Daily task keywords
export const DAILY_TASK_KEYWORDS = [
  'what should i study', "today's tasks", 'daily tasks',
  'what to study', 'suggest tasks', "today's plan",
  'study today', 'give me tasks'
] as const

// Animation delays
export const ANIMATION_DELAYS = {
  stagger1: 'stagger-1',
  stagger2: 'stagger-2',
  stagger3: 'stagger-3',
  stagger4: 'stagger-4',
  stagger5: 'stagger-5',
  stagger6: 'stagger-6',
  stagger7: 'stagger-7',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  appState: 'exam-prep-storage',
  theme: 'exam-prep-theme',
} as const

// API endpoints
export const API_ENDPOINTS = {
  chat: '/api/chat',
} as const

// Default values
export const DEFAULTS = {
  studyHoursPerDay: 6,
  studyStreak: 0,
  totalStudyHours: 0,
  focusSessions: 0,
} as const
