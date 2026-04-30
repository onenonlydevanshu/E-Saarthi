import { NextRequest } from 'next/server'
import { getSyllabusById, formatSyllabusForAI, type ExamSyllabus } from '@/lib/syllabus-data'
import { AGENT_ACTION_SCHEMA } from '@/lib/agent-actions'

const SYSTEM_PROMPT = `You are an expert AI Study Mentor named "PrepMaster" - a highly experienced educator specializing in competitive exam preparation for government and private exams like UPSC, SSC, Bank PO, CAT, GATE, JEE, NEET, and more.

You are not just a chatbot - you are a true AGENT that can directly control the entire app. The student's UI updates in real-time based on the actions you emit.

## Your Personality:
- Warm, encouraging, and supportive like a caring teacher
- Patient and understanding of student struggles
- Motivating without being pushy
- Professional yet friendly

## ADAPTIVE LEARNING CONTEXT:
You have access to the student's performance data. Use this to personalize your responses:
- Focus more on their weak subjects
- Acknowledge their strengths
- Adjust difficulty based on their accuracy
- Consider their task completion patterns

## AGENT ACTIONS (CRITICAL - HOW YOU CONTROL THE UI):

At the END of your response, you MUST emit a JSON array of actions inside an [AGENT_ACTIONS]...[/AGENT_ACTIONS] block whenever your reply implies a UI change. The client parses this block, executes each action against the app store, and the UI updates instantly.

${AGENT_ACTION_SCHEMA}

### Rules for emitting actions:
- ALWAYS emit actions when the user asks you to do something (e.g. "add a task", "start focus", "go to mock tests").
- ALWAYS emit "add_study_plan" when you generate a study plan - DO NOT make the user click extra buttons.
- ALWAYS emit "add_tasks" when you generate daily tasks.
- ALWAYS emit "start_focus" when the user asks to focus on a specific topic.
- Emit "navigate" to take the user to a relevant page (e.g. show them the planner after adding a plan).
- Emit "show_focus_prompt" when the student is distracted/overwhelmed but hasn't asked to start focus yet.
- Combine multiple actions in one block, e.g. add a study plan AND navigate to the planner.
- The [AGENT_ACTIONS] block is REQUIRED - never skip it when actions apply.
- Keep emitting [STUDY_PLAN] and [DAILY_TASKS] blocks too (they power the preview cards), but ALSO emit the equivalent agent actions.

### Example: User asks "Create a 7-day plan for SSC"
Each schedule entry MUST include "day", "date" (ISO YYYY-MM-DD, starting tomorrow), "topics" (array), and "hours". The "date" field is required - the UI will not render days without it.

[AGENT_ACTIONS]
[
  {"type": "add_study_plan", "examName": "SSC CGL", "examDate": "2026-06-15", "hoursPerDay": 6, "schedule": [{"day": 1, "date": "2026-05-01", "topics": ["Quant - Fundamentals"], "hours": 6}, {"day": 2, "date": "2026-05-02", "topics": ["English Grammar"], "hours": 6}]},
  {"type": "navigate", "page": "study-planner"}
]
[/AGENT_ACTIONS]

### Example: User says "I can't focus, help"
[AGENT_ACTIONS]
[{"type": "show_focus_prompt"}]
[/AGENT_ACTIONS]

### Example: User says "Start focusing on algebra"
[AGENT_ACTIONS]
[{"type": "start_focus", "taskTitle": "Algebra - Deep Practice"}]
[/AGENT_ACTIONS]

## Your Capabilities:

### 1. Adaptive Study Plan Generation
When creating study plans, consider the student's performance data:
- Allocate MORE time to weak subjects (lower accuracy)
- Include maintenance practice for strong subjects
- Adjust based on task completion rate

Format study plans like this:
[STUDY_PLAN]
{
  "examName": "Exam Name Here",
  "examDate": "YYYY-MM-DD",
  "hoursPerDay": 6,
  "schedule": [
    {"day": 1, "date": "YYYY-MM-DD", "topics": ["Weak Subject - Fundamentals", "Strong Subject - Advanced"], "hours": 6, "priority": "high"},
    {"day": 2, "date": "YYYY-MM-DD", "topics": ["Weak Subject - Practice", "Mixed Review"], "hours": 6, "priority": "medium"}
  ],
  "adaptive": true,
  "focusAreas": ["Subject 1", "Subject 2"]
}
[/STUDY_PLAN]

### 2. Adaptive Daily Task Generation
When suggesting daily tasks, prioritize based on:
- Weak subjects need more attention (60% of tasks)
- Strong subjects for confidence (20% of tasks)
- New topics for growth (20% of tasks)

Format tasks like this:
[DAILY_TASKS]
["[PRIORITY] Task for weak area", "[PRACTICE] Task for strong area", "[NEW] Exploration task"]
[/DAILY_TASKS]

Include priority tags: [PRIORITY], [PRACTICE], [REVISION], [NEW], [CHALLENGE]

### 3. Performance-Based Recommendations
Always acknowledge the student's:
- Strong areas (celebrate wins!)
- Areas needing improvement (be constructive)
- Recent progress (consistency matters)

### 4. Exam Guidance
- Provide subject-wise breakdowns and weightage
- Share exam patterns, important topics, and strategies
- Give time management tips for exam day
- Recommend quality resources and books

### 5. Concept Explanation
- Break down complex topics into simple, digestible parts
- Use analogies and real-world examples
- Provide memory techniques and mnemonics
- Connect concepts to exam relevance

### 6. Motivation & Mental Health
- Address exam anxiety and stress
- Provide productivity tips
- Help with procrastination (suggest Focus Mode with Pomodoro timer)
- Celebrate progress and encourage consistency

## Guidelines:
- Keep responses conversational but informative
- Use bullet points and formatting for clarity
- Ask clarifying questions when needed
- Always reference performance data when available
- If discussing focus or distraction, recommend the Focus Mode feature
- Provide actionable advice, not just theory

## Response Format:
- Use markdown formatting (bold, bullet points, numbered lists)
- Keep responses focused and not overly long
- Include specific examples when explaining concepts
- End responses with a question or next step when appropriate`

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

function generateAdaptiveTasks(performanceData: PerformanceData): string[] {
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
  
  return tasks
}

// Helper to render an [AGENT_ACTIONS] block from any list of actions
function buildAgentActionsBlock(actions: Array<Record<string, unknown>>): string {
  if (!actions.length) return ''
  return `\n\n[AGENT_ACTIONS]\n${JSON.stringify(actions, null, 2)}\n[/AGENT_ACTIONS]`
}

// Enhanced mock responses with adaptive learning and syllabus
function getMockResponse(message: string, performanceData?: PerformanceData, syllabus?: ExamSyllabus | null): { 
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
      response: `## Your Performance Analysis

I've analyzed your study data and here's what I found:

### Overall Statistics
- **Quiz Accuracy**: ${perfData.overallAccuracy}% 
- **Task Completion Rate**: ${perfData.taskCompletionRate}%
- **Study Consistency**: ${perfData.studyConsistency}%

### Strengths (Keep it up!)
${perfData.strongAreas.map(s => `- **${s}** - You're performing well here!`).join('\n')}

### Areas for Improvement
${perfData.weakAreas.map(s => `- **${s}** - Needs more focused practice`).join('\n')}

### My Recommendations

Based on your performance, here's what I suggest:

1. **Allocate 60% study time to weak areas** - Focus on ${perfData.weakAreas.join(' and ')}
2. **Use spaced repetition** - Review weak topics every 2-3 days
3. **Take targeted mock tests** - Focus on sections where you score below 70%
4. **Maintain your strengths** - Quick 15-min daily practice for ${perfData.strongAreas[0]}

${perfData.overallAccuracy < 70 
  ? '\n**Note**: Your accuracy is below target. I recommend going back to basics and building a stronger foundation before attempting advanced questions.'
  : perfData.overallAccuracy > 85 
    ? '\n**Excellent Progress!** You\'re doing great! Time to challenge yourself with harder questions and full-length mock tests.'
    : '\n**Good Progress!** You\'re on the right track. Focus on consistency and you\'ll see improvement soon.'}

Would you like me to create an adaptive study plan based on this analysis?

[ACTION:add-task:Practice ${perfData.weakAreas[0] || 'weak subject'} for 1 hour] [ACTION:focus:${perfData.weakAreas[0] || 'Study'} - Improvement Session]${buildAgentActionsBlock([
        { type: 'navigate', page: 'progress-tracker' },
        {
          type: 'add_task',
          title: `Practice ${perfData.weakAreas[0] || 'weak subject'} for 1 hour`,
        },
      ])}`,
      intent
    }
  }
  
  if (intent.dailyTasks) {
    const adaptiveTasks = generateAdaptiveTasks(perfData)
    const firstTask = adaptiveTasks[0]?.replace(/^\[\w+\]\s*/, '') || 'Start studying'
    
    return {
      response: `## Your Personalized Study Tasks for Today

Based on your performance data, I've created an **adaptive task list** that focuses on your improvement areas while maintaining your strengths.

**Your Stats Today:**
- Accuracy: ${perfData.overallAccuracy}% | Weak Areas: ${perfData.weakAreas.join(', ')}

[DAILY_TASKS]
${JSON.stringify(adaptiveTasks)}
[/DAILY_TASKS]

### Why These Tasks?

${perfData.weakAreas[0] ? `- **${perfData.weakAreas[0]}** gets priority because your accuracy here needs improvement` : ''}
${perfData.weakAreas[1] ? `- **${perfData.weakAreas[1]}** is included for balanced improvement` : ''}
${perfData.strongAreas[0] ? `- **${perfData.strongAreas[0]}** is maintained with lighter practice to keep your edge` : ''}

**Pro Tip**: ${perfData.taskCompletionRate < 70 
  ? 'I noticed your task completion rate is lower. Try breaking tasks into smaller chunks!'
  : 'Great task completion rate! Keep up the momentum!'}

Start with the [PRIORITY] tasks when your energy is highest. Ready to begin?

[ACTION:focus:${firstTask}] [ACTION:view:tasks]${buildAgentActionsBlock([
        { type: 'add_tasks', titles: adaptiveTasks },
        { type: 'navigate', page: 'daily-tasks' },
      ])}`,
      intent
    }
  }
  
  if (intent.studyPlan) {
    const adaptivePlan = generateAdaptiveStudyPlan(perfData, syllabus?.examName || examName)
    const firstTopic = examSubjects[0]?.topics[0] || perfData.weakAreas[0] || 'Day 1 Topics'
    
    // Build syllabus-specific content
    const syllabusInfo = syllabus ? `
**Selected Exam:** ${syllabus.examName} (${syllabus.shortName})
**Total Marks:** ${syllabus.totalMarks} | **Duration:** ${syllabus.duration}

**Subjects to Cover (by weightage):**
${examSubjects.sort((a, b) => b.weightage - a.weightage).slice(0, 4).map(s => `- ${s.name}: ${s.weightage}% (${s.difficulty} difficulty)`).join('\n')}
` : ''

    const booksInfo = recommendedBooks.length > 0 ? `
### Recommended Resources
${recommendedBooks.slice(0, 4).map(b => `- ${b}`).join('\n')}
` : ''
    
    return {
      response: `## Your Adaptive ${examName} Study Plan

I've created a **personalized study plan** using the official ${examName} syllabus and your performance data:

${syllabusInfo}
**Your Profile:**
- Overall Accuracy: ${perfData.overallAccuracy}%
- Weak Areas: ${perfData.weakAreas.join(', ')}
- Strong Areas: ${perfData.strongAreas.join(', ')}

[STUDY_PLAN]
${adaptivePlan}
[/STUDY_PLAN]

### How This Plan Uses the ${examName} Syllabus

1. **High-weightage subjects first** - Focus on subjects that carry more marks
2. **${perfData.weakAreas[0] || 'Weak areas'}** gets extra attention based on your accuracy
3. **Topic coverage** - All important topics from the syllabus are included
4. **Difficulty progression** - Starting with easier topics, progressing to harder ones
${booksInfo}
### Key Topics to Master
${importantTopics.slice(0, 3).map(t => `- ${t}`).join('\n') || '- Focus on fundamentals first'}

Ready to start? Your plan is now in your Study Planner. Want to focus on Day 1 right now?

[ACTION:focus:${firstTopic}] [ACTION:modify:Adjust hours or topics] [ACTION:view:planner]${buildAgentActionsBlock([
        (() => {
          const parsed = JSON.parse(adaptivePlan) as {
            examName: string
            examDate: string
            hoursPerDay: number
            schedule: Array<{ day: number; topics: string[]; hours: number }>
          }
          return {
            type: 'add_study_plan',
            examName: parsed.examName,
            examDate: parsed.examDate,
            hoursPerDay: parsed.hoursPerDay,
            schedule: parsed.schedule,
          }
        })(),
        { type: 'navigate', page: 'study-planner' },
      ])}`,
      intent
    }
  }
  
  if (intent.focus) {
    const suggestedFocus = perfData.weakAreas[0] || 'Study Session'
    return {
      response: `I understand you're struggling with focus - it's completely normal during intense exam prep!

**Quick Analysis of Your Study Patterns:**
- Task Completion: ${perfData.taskCompletionRate}%
- Consistency Score: ${perfData.studyConsistency}%

${perfData.taskCompletionRate < 70 
  ? '**I notice your task completion could improve.** This might be due to overly ambitious goals or distractions.'
  : '**Your completion rate is good!** Let\'s optimize your focus during study sessions.'}

### My Focus Recommendations:

1. **Use the Pomodoro Technique**
   - 25 minutes focused study
   - 5 minutes break
   - After 4 sessions, 15-20 min break

2. **Prioritize Weak Areas First**
   - Start with ${perfData.weakAreas[0] || 'your weakest subject'} when fresh
   - Save easier topics for low-energy times

3. **Set Micro-Goals**
   - "Complete 10 questions" instead of "Study Math"
   - Check off tasks for dopamine hits

4. **Environment Setup**
   - Phone in another room
   - Use website blockers
   - Have water and snacks ready

**I highly recommend activating Focus Mode!** It has a Pomodoro timer that will help you build disciplined study habits.

Ready to start a focused session on your weak area?

[ACTION:focus:${suggestedFocus} - Focused Practice] [ACTION:add-task:Complete 25 ${suggestedFocus} questions]${buildAgentActionsBlock([
        { type: 'show_focus_prompt' },
      ])}`,
      intent
    }
  }
  
  if (lowerMessage.includes('upsc') || lowerMessage.includes('ias') || lowerMessage.includes('civil service')) {
    return {
      response: `## UPSC Civil Services - Personalized Guidance

Based on your performance profile, here's my adaptive UPSC strategy:

**Your Current Standing:**
- Strong in: ${perfData.strongAreas.join(', ')}
- Needs work: ${perfData.weakAreas.join(', ')}

### Customized UPSC Strategy

**For Your Weak Areas (${perfData.weakAreas.join(', ')}):**
${perfData.weakAreas.includes('Reasoning') || perfData.weakAreas.includes('Quantitative') 
  ? '- Focus on CSAT Paper II preparation\n- Daily 50 questions practice\n- Time yourself strictly' 
  : '- Dedicate morning hours (peak focus)\n- Use NCERT as foundation\n- Make short notes'}

**For Your Strong Areas (${perfData.strongAreas.join(', ')}):**
- Maintain with 30-min daily practice
- Focus on advanced/tricky questions
- Help others (teaching reinforces learning)

### Recommended Daily Routine

| Time | Activity | Subject Focus |
|------|----------|---------------|
| 6-8 AM | Current Affairs | Newspapers |
| 9-12 PM | **${perfData.weakAreas[0] || 'Weak Subject'}** | Deep Study |
| 2-5 PM | ${perfData.strongAreas[0] || 'Strong Subject'} | Advanced Practice |
| 6-8 PM | **${perfData.weakAreas[1] || 'Second Priority'}** | Problem Solving |
| 9-10 PM | Revision | All Subjects |

Want me to create a detailed weekly plan for UPSC based on your performance?`,
      intent
    }
  }
  
  // Default mentor response with performance awareness
  return {
    response: `## Welcome! I'm PrepMaster, Your Adaptive AI Mentor

I've analyzed your learning profile and I'm ready to help you succeed!

**Your Quick Stats:**
- Quiz Accuracy: **${perfData.overallAccuracy}%** ${perfData.overallAccuracy > 75 ? '(Great!)' : perfData.overallAccuracy > 60 ? '(Good progress!)' : '(Let\'s improve!)'}
- Strong Areas: ${perfData.strongAreas.join(', ')}
- Focus Areas: ${perfData.weakAreas.join(', ')}

### How I Can Help You Today

📊 **Analyze Performance**
"How am I doing?" - Get detailed insights

📋 **Create Adaptive Plans**
"Create a study plan for UPSC" - Personalized schedules

📝 **Smart Daily Tasks**
"What should I study today?" - Priority-based tasks

💪 **Stay Focused**
"I'm feeling distracted" - Activate Focus Mode

### Quick Actions
Try saying:
- "Analyze my performance"
- "Create an adaptive study plan"
- "Give me today's tasks based on my weak areas"
- "Help me improve in ${perfData.weakAreas[0] || 'Reasoning'}"

What would you like to work on today?`,
    intent
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages: chatHistory, performanceData, selectedExamId } = await request.json()
    
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
      const { response: mockResponse, intent: detectedIntent } = getMockResponse(message, performanceData, syllabus)
      
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          // Send intent metadata first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            meta: true,
            intent: detectedIntent 
          })}\n\n`))
          
          const words = mockResponse.split(' ')
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '')
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

    // Build messages array for OpenAI with enhanced context
    const contextMessage = intent.studyPlan 
      ? '\n\nNote: The user is asking for a study plan. Include the [STUDY_PLAN] JSON format. Make it ADAPTIVE based on their performance data.'
      : intent.dailyTasks 
        ? '\n\nNote: The user is asking for daily tasks. Include the [DAILY_TASKS] JSON format. Prioritize tasks for their WEAK AREAS.'
        : intent.performance
          ? '\n\nNote: The user wants performance analysis. Provide detailed insights based on their data.'
          : ''

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + syllabusContext + performanceContext + contextMessage },
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
