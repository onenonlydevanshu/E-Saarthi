import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Exam {
  id: string
  name: string
  date: string
  category: 'government' | 'private'
  description?: string
}

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export interface StudyPlan {
  id: string
  examName: string
  examDate: string
  hoursPerDay: number
  schedule: ScheduleItem[]
  createdAt: string
}

export interface ScheduleItem {
  day: number
  date: string
  topics: string[]
  hours: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface QuizResult {
  id: string
  score: number
  total: number
  date: string
  examName: string
  category?: string
}

export interface SubjectPerformance {
  subject: string
  totalQuestions: number
  correctAnswers: number
  lastAttempted: string
  streak: number
}

export interface TaskCompletion {
  date: string
  completed: number
  total: number
  topics: string[]
}

export interface AdaptiveInsights {
  weakSubjects: string[]
  strongSubjects: string[]
  recommendedFocusAreas: string[]
  studyPatterns: {
    mostProductiveTime: string
    averageSessionLength: number
    consistencyScore: number
  }
  lastUpdated: string
}

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activePage: string
  setActivePage: (page: string) => void

  // Chat
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  messages: Message[]
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string) => void
  appendToLastMessage: (content: string) => void
  clearMessages: () => void

  // Exams
  exams: Exam[]
  addExam: (exam: Omit<Exam, 'id'>) => void
  removeExam: (id: string) => void
  selectedExamId: string | null
  setSelectedExamId: (id: string | null) => void

  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  clearTasks: () => void

  // Study Plans
  studyPlans: StudyPlan[]
  addStudyPlan: (plan: Omit<StudyPlan, 'id' | 'createdAt'>) => void
  removeStudyPlan: (id: string) => void

  // Progress
  studyStreak: number
  incrementStreak: () => void
  resetStreak: () => void
  totalStudyHours: number
  addStudyHours: (hours: number) => void

  // Quiz Results
  quizResults: QuizResult[]
  addQuizResult: (result: Omit<QuizResult, 'id' | 'date'>) => void

  // Focus Mode
  focusSessionsCompleted: number
  incrementFocusSessions: () => void
  currentFocusTask: { id: string; title: string } | null
  setCurrentFocusTask: (task: { id: string; title: string } | null) => void
  completeFocusTask: () => void
  // One-shot flag: when true, the Focus Mode page will auto-start
  // the Pomodoro timer on its next render and clear the flag. Used by
  // the agent's `start_focus` action so chat can launch focus sessions
  // end-to-end without requiring the user to press play.
  focusAutoStart: boolean
  setFocusAutoStart: (value: boolean) => void

  // Performance Tracking
  subjectPerformance: SubjectPerformance[]
  updateSubjectPerformance: (subject: string, correct: boolean) => void
  taskCompletionHistory: TaskCompletion[]
  addTaskCompletionRecord: (record: Omit<TaskCompletion, 'date'>) => void
  adaptiveInsights: AdaptiveInsights
  updateAdaptiveInsights: () => void
  getPerformanceData: () => {
    overallAccuracy: number
    weakAreas: string[]
    strongAreas: string[]
    taskCompletionRate: number
    studyConsistency: number
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      activePage: 'dashboard',
      setActivePage: (page) => set({ activePage: page }),

      // Chat
      chatOpen: false,
      setChatOpen: (open) => set({ chatOpen: open }),
      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),
      updateLastMessage: (content) =>
        set((state) => ({
          messages: state.messages.map((msg, index) =>
            index === state.messages.length - 1 ? { ...msg, content } : msg
          ),
        })),
      appendToLastMessage: (content) =>
        set((state) => ({
          messages: state.messages.map((msg, index) =>
            index === state.messages.length - 1 ? { ...msg, content: msg.content + content } : msg
          ),
        })),
      clearMessages: () => set({ messages: [] }),

      // Exams
      exams: [
        {
          id: '1',
          name: 'UPSC Civil Services',
          date: '2026-06-15',
          category: 'government',
          description: 'Indian Administrative Service Preliminary Exam',
        },
        {
          id: '2',
          name: 'SSC CGL',
          date: '2026-05-20',
          category: 'government',
          description: 'Staff Selection Commission Combined Graduate Level',
        },
        {
          id: '3',
          name: 'CAT MBA',
          date: '2026-11-28',
          category: 'private',
          description: 'Common Admission Test for IIMs',
        },
        {
          id: '4',
          name: 'Bank PO',
          date: '2026-07-10',
          category: 'government',
          description: 'IBPS Probationary Officer Exam',
        },
      ],
      addExam: (exam) =>
        set((state) => ({
          exams: [...state.exams, { ...exam, id: crypto.randomUUID() }],
        })),
      removeExam: (id) =>
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
        })),
      selectedExamId: 'upsc', // Default to UPSC
      setSelectedExamId: (id) => set({ selectedExamId: id }),

      // Tasks
      tasks: [],
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      clearTasks: () => set({ tasks: [] }),

      // Study Plans
      studyPlans: [],
      addStudyPlan: (plan) =>
        set((state) => ({
          studyPlans: [
            ...state.studyPlans,
            {
              ...plan,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeStudyPlan: (id) =>
        set((state) => ({
          studyPlans: state.studyPlans.filter((p) => p.id !== id),
        })),

      // Progress
      studyStreak: 5,
      incrementStreak: () => set((state) => ({ studyStreak: state.studyStreak + 1 })),
      resetStreak: () => set({ studyStreak: 0 }),
      totalStudyHours: 42,
      addStudyHours: (hours) =>
        set((state) => ({ totalStudyHours: state.totalStudyHours + hours })),

      // Quiz Results
      quizResults: [
        { id: '1', score: 8, total: 10, date: '2026-04-28', examName: 'General Knowledge' },
        { id: '2', score: 7, total: 10, date: '2026-04-27', examName: 'Quantitative Aptitude' },
        { id: '3', score: 9, total: 10, date: '2026-04-26', examName: 'English Grammar' },
      ],
      addQuizResult: (result) =>
        set((state) => ({
          quizResults: [
            ...state.quizResults,
            {
              ...result,
              id: crypto.randomUUID(),
              date: new Date().toISOString().split('T')[0],
            },
          ],
        })),

      // Focus Mode
      focusSessionsCompleted: 12,
      incrementFocusSessions: () =>
        set((state) => ({ focusSessionsCompleted: state.focusSessionsCompleted + 1 })),
      currentFocusTask: null,
      setCurrentFocusTask: (task) => set({ currentFocusTask: task }),
      focusAutoStart: false,
      setFocusAutoStart: (value) => set({ focusAutoStart: value }),
      completeFocusTask: () =>
        set((state) => {
          if (state.currentFocusTask) {
            return {
              tasks: state.tasks.map((t) =>
                t.id === state.currentFocusTask?.id ? { ...t, completed: true } : t
              ),
              currentFocusTask: null,
            }
          }
          return {}
        }),

      // Performance Tracking
      subjectPerformance: [
        { subject: 'General Knowledge', totalQuestions: 30, correctAnswers: 24, lastAttempted: '2026-04-29', streak: 3 },
        { subject: 'Quantitative Aptitude', totalQuestions: 25, correctAnswers: 17, lastAttempted: '2026-04-28', streak: 2 },
        { subject: 'English Grammar', totalQuestions: 20, correctAnswers: 18, lastAttempted: '2026-04-30', streak: 5 },
        { subject: 'Reasoning', totalQuestions: 15, correctAnswers: 10, lastAttempted: '2026-04-27', streak: 1 },
        { subject: 'Current Affairs', totalQuestions: 20, correctAnswers: 16, lastAttempted: '2026-04-29', streak: 4 },
      ],
      updateSubjectPerformance: (subject, correct) =>
        set((state) => {
          const existing = state.subjectPerformance.find(s => s.subject === subject)
          if (existing) {
            return {
              subjectPerformance: state.subjectPerformance.map(s =>
                s.subject === subject
                  ? {
                      ...s,
                      totalQuestions: s.totalQuestions + 1,
                      correctAnswers: correct ? s.correctAnswers + 1 : s.correctAnswers,
                      lastAttempted: new Date().toISOString().split('T')[0],
                      streak: correct ? s.streak + 1 : 0,
                    }
                  : s
              ),
            }
          }
          return {
            subjectPerformance: [
              ...state.subjectPerformance,
              {
                subject,
                totalQuestions: 1,
                correctAnswers: correct ? 1 : 0,
                lastAttempted: new Date().toISOString().split('T')[0],
                streak: correct ? 1 : 0,
              },
            ],
          }
        }),
      taskCompletionHistory: [
        { date: '2026-04-25', completed: 5, total: 7, topics: ['History', 'Polity'] },
        { date: '2026-04-26', completed: 6, total: 6, topics: ['Geography', 'Economy'] },
        { date: '2026-04-27', completed: 4, total: 8, topics: ['Science', 'Current Affairs'] },
        { date: '2026-04-28', completed: 7, total: 7, topics: ['Math', 'Reasoning'] },
        { date: '2026-04-29', completed: 5, total: 6, topics: ['English', 'GK'] },
      ],
      addTaskCompletionRecord: (record) =>
        set((state) => ({
          taskCompletionHistory: [
            ...state.taskCompletionHistory,
            { ...record, date: new Date().toISOString().split('T')[0] },
          ],
        })),
      adaptiveInsights: {
        weakSubjects: ['Reasoning', 'Quantitative Aptitude'],
        strongSubjects: ['English Grammar', 'General Knowledge'],
        recommendedFocusAreas: ['Practice more logical reasoning puzzles', 'Focus on arithmetic shortcuts', 'Review previous year questions'],
        studyPatterns: {
          mostProductiveTime: 'Morning (6-10 AM)',
          averageSessionLength: 45,
          consistencyScore: 78,
        },
        lastUpdated: new Date().toISOString(),
      },
      updateAdaptiveInsights: () =>
        set((state) => {
          const performances = state.subjectPerformance
          const sorted = [...performances].sort((a, b) => {
            const accA = a.totalQuestions > 0 ? a.correctAnswers / a.totalQuestions : 0
            const accB = b.totalQuestions > 0 ? b.correctAnswers / b.totalQuestions : 0
            return accA - accB
          })
          
          const weakSubjects = sorted.slice(0, 2).map(s => s.subject)
          const strongSubjects = sorted.slice(-2).reverse().map(s => s.subject)
          
          const recommendations: string[] = []
          weakSubjects.forEach(subject => {
            if (subject.includes('Reasoning')) recommendations.push('Practice 15 reasoning puzzles daily')
            else if (subject.includes('Quantitative') || subject.includes('Math')) recommendations.push('Focus on speed math and shortcuts')
            else if (subject.includes('English')) recommendations.push('Read newspapers for vocabulary building')
            else recommendations.push(`Dedicate extra 30 mins to ${subject}`)
          })
          
          const recentTasks = state.taskCompletionHistory.slice(-7)
          const avgCompletion = recentTasks.length > 0
            ? recentTasks.reduce((acc, t) => acc + (t.completed / t.total), 0) / recentTasks.length * 100
            : 0
          
          return {
            adaptiveInsights: {
              weakSubjects,
              strongSubjects,
              recommendedFocusAreas: recommendations.slice(0, 3),
              studyPatterns: {
                mostProductiveTime: 'Morning (6-10 AM)',
                averageSessionLength: Math.round(state.totalStudyHours / Math.max(state.focusSessionsCompleted, 1) * 60),
                consistencyScore: Math.round(avgCompletion),
              },
              lastUpdated: new Date().toISOString(),
            },
          }
        }),
      getPerformanceData: () => {
        const state = useAppStore.getState()
        const performances = state.subjectPerformance
        
        const totalQuestions = performances.reduce((acc, p) => acc + p.totalQuestions, 0)
        const totalCorrect = performances.reduce((acc, p) => acc + p.correctAnswers, 0)
        const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
        
        const sorted = [...performances].sort((a, b) => {
          const accA = a.totalQuestions > 0 ? a.correctAnswers / a.totalQuestions : 0
          const accB = b.totalQuestions > 0 ? b.correctAnswers / b.totalQuestions : 0
          return accA - accB
        })
        
        const weakAreas = sorted.slice(0, 2).map(s => s.subject)
        const strongAreas = sorted.slice(-2).reverse().map(s => s.subject)
        
        const recentTasks = state.taskCompletionHistory.slice(-7)
        const taskCompletionRate = recentTasks.length > 0
          ? Math.round(recentTasks.reduce((acc, t) => acc + (t.completed / t.total), 0) / recentTasks.length * 100)
          : 0
        
        const studyConsistency = recentTasks.length >= 5 ? Math.round((recentTasks.length / 7) * 100) : 50
        
        return { overallAccuracy, weakAreas, strongAreas, taskCompletionRate, studyConsistency }
      },
    }),
    {
      name: 'exam-prep-storage',
    }
  )
)
