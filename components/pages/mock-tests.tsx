'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  FileText,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  Timer,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const quizCategories = [
  {
    id: 'gk',
    name: 'General Knowledge',
    description: 'Current affairs and static GK',
    questions: 10,
    duration: '15 min',
    color: 'from-blue-500/15 to-blue-500/5',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    id: 'quant',
    name: 'Quantitative Aptitude',
    description: 'Mathematics and reasoning',
    questions: 10,
    duration: '20 min',
    color: 'from-violet-500/15 to-violet-500/5',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
  {
    id: 'english',
    name: 'English Grammar',
    description: 'Grammar and vocabulary',
    questions: 10,
    duration: '15 min',
    color: 'from-emerald-500/15 to-emerald-500/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    id: 'reasoning',
    name: 'Logical Reasoning',
    description: 'Puzzles and patterns',
    questions: 10,
    duration: '20 min',
    color: 'from-amber-500/15 to-amber-500/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
]

const sampleQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    explanation: 'Mars is called the Red Planet due to iron oxide (rust) on its surface.',
  },
  {
    id: '2',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 2,
    explanation: 'Canberra is the capital city of Australia, not Sydney as commonly assumed.',
  },
  {
    id: '3',
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 1,
    explanation: 'William Shakespeare wrote Romeo and Juliet around 1594-1596.',
  },
  {
    id: '4',
    question: 'What is the chemical symbol for Gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    explanation: 'Au comes from the Latin word "Aurum" meaning gold.',
  },
  {
    id: '5',
    question: 'Which is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 3,
    explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.',
  },
  {
    id: '6',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: 2,
    explanation: 'World War II ended in 1945 with the surrender of Japan.',
  },
  {
    id: '7',
    question: 'What is the square root of 144?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    explanation: '12 x 12 = 144, so the square root of 144 is 12.',
  },
  {
    id: '8',
    question: 'Which gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctAnswer: 2,
    explanation: 'Plants absorb CO2 during photosynthesis and release oxygen.',
  },
  {
    id: '9',
    question: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Van Gogh'],
    correctAnswer: 1,
    explanation: 'Leonardo da Vinci painted the Mona Lisa between 1503 and 1519.',
  },
  {
    id: '10',
    question: 'What is the currency of Japan?',
    options: ['Yuan', 'Won', 'Yen', 'Ringgit'],
    correctAnswer: 2,
    explanation: 'The Japanese Yen is the official currency of Japan.',
  },
]

export function MockTestsPage() {
  const { addQuizResult } = useAppStore()
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const startQuiz = (categoryId: string) => {
    setActiveQuiz(categoryId)
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(sampleQuestions.length).fill(null))
    setShowResults(false)
    setShowExplanation(false)
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setShowExplanation(false)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = () => {
    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === sampleQuestions[index].correctAnswer ? 1 : 0)
    }, 0)

    const category = quizCategories.find((c) => c.id === activeQuiz)
    if (category) {
      addQuizResult({
        score,
        total: sampleQuestions.length,
        examName: category.name,
      })
    }

    setShowResults(true)
  }

  const resetQuiz = () => {
    setActiveQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setShowResults(false)
    setShowExplanation(false)
  }

  const score = selectedAnswers.reduce((acc, answer, index) => {
    return acc + (answer === sampleQuestions[index].correctAnswer ? 1 : 0)
  }, 0)

  const percentage = Math.round((score / sampleQuestions.length) * 100)

  if (showResults) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-md glass glass-dark text-center overflow-hidden">
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-50',
            percentage >= 70
              ? 'from-emerald-500/20 to-emerald-500/5'
              : percentage >= 50
              ? 'from-amber-500/20 to-amber-500/5'
              : 'from-red-500/20 to-red-500/5'
          )} />
          <CardContent className="relative p-10">
            <div
              className={cn(
                'w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg',
                percentage >= 70
                  ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 shadow-emerald-500/20'
                  : percentage >= 50
                  ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/10 shadow-amber-500/20'
                  : 'bg-gradient-to-br from-red-500/20 to-red-500/10 shadow-red-500/20'
              )}
            >
              <Trophy
                className={cn(
                  'w-12 h-12',
                  percentage >= 70
                    ? 'text-emerald-500'
                    : percentage >= 50
                    ? 'text-amber-500'
                    : 'text-red-500'
                )}
              />
            </div>
            <h2 className="text-3xl font-bold text-card-foreground mb-2">
              {percentage >= 70
                ? 'Excellent!'
                : percentage >= 50
                ? 'Good Effort!'
                : 'Keep Practicing!'}
            </h2>
            <p className="text-muted-foreground mb-8">
              You scored {score} out of {sampleQuestions.length}
            </p>
            <div className={cn(
              'text-7xl font-bold mb-10',
              percentage >= 70
                ? 'text-emerald-500'
                : percentage >= 50
                ? 'text-amber-500'
                : 'text-red-500'
            )}>
              {percentage}%
            </div>
            <div className="space-y-3">
              <Button 
                onClick={resetQuiz} 
                className="w-full rounded-xl h-12 shadow-lg shadow-primary/20"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Another Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                className="w-full rounded-xl h-12"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Review Answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeQuiz) {
    const question = sampleQuestions[currentQuestion]
    const selectedAnswer = selectedAnswers[currentQuestion]
    const isCorrect = selectedAnswer === question.correctAnswer

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-8">
        {/* Progress */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="num-display flex items-baseline gap-1 text-card-foreground font-bold tracking-tight">
              <span className="text-2xl">{currentQuestion + 1}</span>
              <span className="text-sm text-muted-foreground/60 font-medium">
                / {sampleQuestions.length}
              </span>
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Question
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetQuiz}
            className="rounded-xl text-muted-foreground hover:text-destructive"
          >
            Exit Quiz
          </Button>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/70 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]"
            style={{
              width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question Card */}
        <Card className="glass glass-dark animate-scale-in">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-card-foreground mb-8 leading-relaxed">
              {question.question}
            </h2>
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index
                const isCorrectAnswer = index === question.correctAnswer
                const showCorrectness = showExplanation && selectedAnswer !== null

                return (
                  <button
                    key={index}
                    onClick={() => !showExplanation && selectAnswer(index)}
                    disabled={showExplanation}
                    className={cn(
                      'w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300',
                      'border-2',
                      showCorrectness
                        ? isCorrectAnswer
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : isSelected
                          ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10'
                          : 'bg-secondary/30 border-border/50'
                        : isSelected
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                        : 'bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-primary/30 hover:scale-[1.01]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all',
                        showCorrectness
                          ? isCorrectAnswer
                            ? 'bg-emerald-500 text-white'
                            : isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-secondary text-secondary-foreground'
                          : isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {showCorrectness ? (
                        isCorrectAnswer ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </span>
                    <span className={cn(
                      'flex-1 font-medium',
                      showCorrectness && isCorrectAnswer && 'text-emerald-600 dark:text-emerald-400',
                      showCorrectness && isSelected && !isCorrectAnswer && 'text-red-600 dark:text-red-400'
                    )}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div
                className={cn(
                  'mt-8 p-5 rounded-2xl animate-fade-in-up',
                  isCorrect 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-amber-500/10 border border-amber-500/20'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className={cn(
                    'w-5 h-5',
                    isCorrect ? 'text-emerald-500' : 'text-amber-500'
                  )} />
                  <p className="font-semibold text-card-foreground">
                    {isCorrect ? 'Correct!' : 'Explanation'}
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed">{question.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              {!showExplanation ? (
                <Button
                  onClick={() => setShowExplanation(true)}
                  disabled={selectedAnswer === null}
                  className="flex-1 h-14 rounded-xl text-lg shadow-lg shadow-primary/20"
                >
                  Check Answer
                </Button>
              ) : (
                <Button 
                  onClick={nextQuestion} 
                  className="flex-1 h-14 rounded-xl text-lg shadow-lg shadow-primary/20"
                >
                  {currentQuestion < sampleQuestions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    'Finish Quiz'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in pb-8">
      {/* Header */}
      <header className="relative">
        <div
          className="absolute -top-12 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden
        />
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-wide text-foreground">
              Test Your Knowledge
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Mock <span className="gradient-text-bold">Tests</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Practice with topic-wise quizzes to identify weak spots and lock in
            your preparation.
          </p>
        </div>
      </header>

      {/* Quiz Categories */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {quizCategories.map((category, index) => (
          <Card
            key={category.id}
            className={cn(
              'glass glass-dark card-hover cursor-pointer group overflow-hidden relative',
              'animate-fade-in-up'
            )}
            style={{ animationDelay: `${index * 0.08}s` }}
            onClick={() => startQuiz(category.id)}
          >
            {/* Hover gradient wash */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                category.color
              )}
              aria-hidden
            />
            {/* Top-right index pill */}
            <span className="absolute top-4 right-4 z-10 num-display text-[10px] font-bold tracking-wider text-muted-foreground/60 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 uppercase">
              {String(index + 1).padStart(2, '0')}
            </span>

            <CardContent className="relative p-6">
              <div
                className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-2xl mb-5 transition-all duration-500 shadow-inner',
                  'group-hover:scale-110 group-hover:rotate-6',
                  category.iconBg
                )}
              >
                <FileText className={cn('w-7 h-7', category.iconColor)} />
              </div>
              <h3 className="font-bold text-lg text-card-foreground mb-1.5 tracking-tight group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                {category.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
                <span className="flex items-center gap-1.5 bg-secondary/60 px-2.5 py-1.5 rounded-lg font-medium">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="num-display">{category.questions}</span>{' '}
                  Questions
                </span>
                <span className="flex items-center gap-1.5 bg-secondary/60 px-2.5 py-1.5 rounded-lg font-medium">
                  <Timer className="w-3.5 h-3.5" />
                  {category.duration}
                </span>
              </div>
              <Button className="w-full rounded-xl h-11 shadow-lg shadow-primary/15 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:-translate-y-0.5">
                <Play className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:translate-x-0.5" />
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
