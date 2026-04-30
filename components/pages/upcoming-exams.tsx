'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useExams } from '@/hooks/use-exams'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  X,
  Zap,
  Target,
  RefreshCw,
  Search,
  Database,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, differenceInDays } from 'date-fns'

type FilterType = 'all' | 'government' | 'private' | 'high-priority'

export function UpcomingExamsPage() {
  const { exams: userExams, addExam, removeExam } = useAppStore()
  const { exams: mcpExams, isLoading, error, refresh, search, source, lastFetched } = useExams()
  
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [activeTab, setActiveTab] = useState<'mcp' | 'mine'>('mcp')
  const [newExam, setNewExam] = useState({
    name: '',
    date: '',
    category: 'government' as 'government' | 'private',
    description: '',
  })

  const handleAddExam = () => {
    if (!newExam.name || !newExam.date) return
    addExam(newExam)
    setNewExam({ name: '', date: '', category: 'government', description: '' })
    setShowForm(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      search(query)
    } else if (query.length === 0) {
      refresh()
    }
  }

  const handleAddFromMCP = (exam: typeof mcpExams[0]) => {
    addExam({
      name: exam.name,
      date: exam.date,
      category: exam.category,
      description: exam.description,
    })
  }

  const filteredMcpExams = mcpExams.filter(exam => {
    if (filterType === 'all') return true
    if (filterType === 'government') return exam.category === 'government'
    if (filterType === 'private') return exam.category === 'private'
    if (filterType === 'high-priority') return exam.importance === 'high'
    return true
  })

  const sortedUserExams = [...userExams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const getExamStatus = (date: string) => {
    const days = differenceInDays(new Date(date), new Date())
    if (days < 0) return { label: 'Completed', color: 'text-muted-foreground', bg: 'bg-muted' }
    if (days === 0) return { label: 'Today!', color: 'text-red-500', bg: 'bg-red-500/15' }
    if (days <= 7) return { label: `${days}d left`, color: 'text-amber-500', bg: 'bg-amber-500/15' }
    if (days <= 30) return { label: `${days}d left`, color: 'text-blue-500', bg: 'bg-blue-500/15' }
    return { label: `${days}d left`, color: 'text-emerald-500', bg: 'bg-emerald-500/15' }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10'
      case 'moderate': return 'text-blue-500 bg-blue-500/10'
      case 'hard': return 'text-amber-500 bg-amber-500/10'
      case 'very-hard': return 'text-red-500 bg-red-500/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const isAlreadyAdded = (mcpExam: typeof mcpExams[0]) => {
    return userExams.some(e => e.name === mcpExam.name)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Database className="w-4 h-4 text-primary" />
            <span>Powered by MCP Server</span>
            {source && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 text-xs">
                Live
              </span>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            Upcoming Exams
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time exam data from our knowledge base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={refresh}
            disabled={isLoading}
            className="rounded-xl gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="rounded-xl shadow-lg shadow-primary/20 gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Custom
          </Button>
        </div>
      </div>

      {/* Add Exam Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setShowForm(false)}
          />
          <Card className="relative w-full max-w-md glass animate-scale-in overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl">Add Custom Exam</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowForm(false)}
                className="rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="relative space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Exam Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., UPSC Prelims 2026"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  className="h-12 rounded-xl input-premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Exam Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  className="h-12 rounded-xl input-premium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <div className="flex gap-3">
                  <Button
                    variant={newExam.category === 'government' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 h-12 rounded-xl transition-all',
                      newExam.category === 'government' && 'shadow-lg shadow-primary/20'
                    )}
                    onClick={() => setNewExam({ ...newExam, category: 'government' })}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Government
                  </Button>
                  <Button
                    variant={newExam.category === 'private' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 h-12 rounded-xl transition-all',
                      newExam.category === 'private' && 'shadow-lg shadow-primary/20'
                    )}
                    onClick={() => setNewExam({ ...newExam, category: 'private' })}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Private
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description..."
                  value={newExam.description}
                  onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                  className="h-12 rounded-xl input-premium"
                />
              </div>
              <Button
                onClick={handleAddExam}
                disabled={!newExam.name || !newExam.date}
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to My Exams
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MCP Status Banner */}
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-2xl border',
        error 
          ? 'bg-red-500/10 border-red-500/20' 
          : 'bg-emerald-500/10 border-emerald-500/20'
      )}>
        {error ? (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        )}
        <div className="flex-1 text-sm">
          {error ? (
            <p className="text-red-500 font-medium">MCP Connection Error: {error}</p>
          ) : (
            <p className="text-card-foreground">
              <span className="font-medium">MCP Server Connected.</span>{' '}
              <span className="text-muted-foreground">
                {mcpExams.length} exams loaded from data source
                {lastFetched && ` • Last updated: ${format(new Date(lastFetched), 'h:mm a')}`}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('mcp')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
            activeTab === 'mcp'
              ? 'bg-card text-card-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Database className="w-4 h-4" />
          MCP Exams ({mcpExams.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
            activeTab === 'mine'
              ? 'bg-card text-card-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="w-4 h-4" />
          My Exams ({userExams.length})
        </button>
      </div>

      {activeTab === 'mcp' && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search exams (e.g., UPSC, Banking, GATE)..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-12 pl-12 rounded-xl input-premium"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(['all', 'government', 'private', 'high-priority'] as FilterType[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                    filterType === filter
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* MCP Exams List */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass glass-dark animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 w-20 bg-muted rounded-lg" />
                    <div className="h-7 w-3/4 bg-muted rounded-lg" />
                    <div className="h-4 w-full bg-muted rounded-lg" />
                    <div className="h-4 w-5/6 bg-muted rounded-lg" />
                    <div className="h-10 w-full bg-muted rounded-xl" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMcpExams.length === 0 ? (
            <Card className="glass glass-dark animate-fade-in-up">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-xl text-card-foreground mb-2">No Exams Found</h3>
                <p className="text-muted-foreground max-w-[320px]">
                  Try a different search term or filter
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMcpExams.map((exam, index) => {
                const status = getExamStatus(exam.date)
                const days = differenceInDays(new Date(exam.date), new Date())
                const isUrgent = days <= 7 && days >= 0
                const added = isAlreadyAdded(exam)

                return (
                  <Card
                    key={exam.id}
                    className={cn(
                      'glass glass-dark card-hover overflow-hidden group relative',
                      'animate-fade-in-up',
                      isUrgent && 'border-amber-500/30'
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {isUrgent && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                    )}
                    {exam.importance === 'high' && (
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-semibold">
                          <Sparkles className="w-3 h-3" />
                          Top
                        </span>
                      </div>
                    )}
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-semibold',
                            exam.category === 'government'
                              ? 'bg-blue-500/15 text-blue-500'
                              : 'bg-violet-500/15 text-violet-500'
                          )}
                        >
                          {exam.category === 'government' ? 'Govt' : 'Private'}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground">
                          {exam.type}
                        </span>
                        <span className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold capitalize',
                          getDifficultyColor(exam.difficulty)
                        )}>
                          {exam.difficulty.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg text-card-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {exam.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {exam.description}
                        </p>
                      </div>

                      {exam.eligibility && (
                        <div className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                          <span className="font-medium">Eligibility:</span> {exam.eligibility}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(exam.date), 'MMM d, yyyy')}
                        </div>
                        <span
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                            status.bg,
                            status.color
                          )}
                        >
                          {isUrgent && <Zap className="w-3 h-3" />}
                          {status.label}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant={added ? 'outline' : 'default'}
                        disabled={added}
                        onClick={() => handleAddFromMCP(exam)}
                        className="w-full rounded-xl gap-2"
                      >
                        {added ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Added to My Exams
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add to My Exams
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'mine' && (
        <>
          {/* User Exams Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                label: 'My Exams', 
                value: userExams.length, 
                icon: Calendar, 
                color: 'text-blue-500', 
                bgColor: 'bg-gradient-to-br from-blue-500/15 to-blue-500/5',
                borderColor: 'border-blue-500/20'
              },
              { 
                label: 'Government', 
                value: userExams.filter((e) => e.category === 'government').length, 
                icon: Building2, 
                color: 'text-emerald-500', 
                bgColor: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5',
                borderColor: 'border-emerald-500/20'
              },
              { 
                label: 'Private', 
                value: userExams.filter((e) => e.category === 'private').length, 
                icon: Briefcase, 
                color: 'text-violet-500', 
                bgColor: 'bg-gradient-to-br from-violet-500/15 to-violet-500/5',
                borderColor: 'border-violet-500/20'
              },
              { 
                label: 'This Month', 
                value: userExams.filter((e) => differenceInDays(new Date(e.date), new Date()) <= 30 && differenceInDays(new Date(e.date), new Date()) >= 0).length, 
                icon: Clock, 
                color: 'text-amber-500', 
                bgColor: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5',
                borderColor: 'border-amber-500/20'
              },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card 
                  key={stat.label} 
                  className={cn(
                    'glass glass-dark card-hover border',
                    stat.borderColor,
                    'animate-fade-in-up'
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className={cn('p-3 rounded-xl w-fit', stat.bgColor)}>
                        <Icon className={cn('w-6 h-6', stat.color)} />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* User Exams List */}
          {sortedUserExams.length === 0 ? (
            <Card className="glass glass-dark animate-fade-in-up">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-xl text-card-foreground mb-2">No Personal Exams Yet</h3>
                <p className="text-muted-foreground max-w-[320px] mb-6">
                  Browse the MCP exam library or add a custom exam to track your preparation timeline.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setActiveTab('mcp')}
                    variant="outline"
                    className="rounded-xl gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Browse MCP Exams
                  </Button>
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="rounded-xl shadow-lg shadow-primary/20 gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Custom
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedUserExams.map((exam, index) => {
                const status = getExamStatus(exam.date)
                const days = differenceInDays(new Date(exam.date), new Date())
                const isUrgent = days <= 7 && days >= 0

                return (
                  <Card
                    key={exam.id}
                    className={cn(
                      'glass glass-dark card-hover overflow-hidden group',
                      'animate-fade-in-up',
                      days < 0 && 'opacity-60',
                      isUrgent && 'border-amber-500/30'
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {isUrgent && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-semibold',
                            exam.category === 'government'
                              ? 'bg-blue-500/15 text-blue-500'
                              : 'bg-violet-500/15 text-violet-500'
                          )}
                        >
                          {exam.category === 'government' ? 'Government' : 'Private'}
                        </span>
                        <button
                          onClick={() => removeExam(exam.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <h3 className="font-bold text-xl text-card-foreground mb-2 group-hover:text-primary transition-colors">
                        {exam.name}
                      </h3>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {exam.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(exam.date), 'MMM d, yyyy')}
                        </div>
                        <span
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold',
                            status.bg,
                            status.color
                          )}
                        >
                          {isUrgent && <Zap className="w-3.5 h-3.5" />}
                          {status.label}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
