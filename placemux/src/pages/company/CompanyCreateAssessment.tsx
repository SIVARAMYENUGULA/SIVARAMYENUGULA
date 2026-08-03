import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageTransition } from '@/components/shared/page-transition'
import { useToast } from '@/hooks/use-toast'
import { assessmentService } from '@/services/assessment'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Plus, Trash2, Save, ArrowLeft,
  HelpCircle, CheckCircle, FileText, Target,
  Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react'

interface QuestionForm {
  id: string
  questionText: string
  options: string[]
  correctIndex: number
  points: number
}

const INITIAL_QUESTION: QuestionForm = {
  id: crypto.randomUUID(),
  questionText: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  points: 10,
}

const ASSESSMENT_TYPES = ['Technical', 'Aptitude', 'Soft Skills', 'Domain'] as const

export function CompanyCreateAssessment() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('')
  const [duration, setDuration] = useState<number>(30)
  const [passingScore, setPassingScore] = useState<number>(60)
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')

  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...INITIAL_QUESTION, id: crypto.randomUUID() }])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set([questions[0]?.id || '']))

  const addQuestion = () => {
    const newQ = { ...INITIAL_QUESTION, id: crypto.randomUUID() }
    setQuestions(prev => [...prev, newQ])
    setExpandedQuestions(prev => new Set(prev).add(newQ.id))
  }

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) {
      addToast({ title: 'Minimum one question', description: 'An assessment must have at least one question.', variant: 'warning' })
      return
    }
    setQuestions(prev => prev.filter(q => q.id !== id))
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const updateQuestion = (id: string, field: keyof QuestionForm, value: string | number) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q
      const newOptions = [...q.options]
      newOptions[optionIndex] = value
      return { ...q, options: newOptions }
    }))
  }

  const toggleExpand = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const validate = (): string | null => {
    if (!title.trim()) return 'Assessment title is required.'
    if (!type) return 'Assessment type is required.'
    if (!duration || duration < 1) return 'Duration must be at least 1 minute.'
    if (passingScore < 0 || passingScore > 100) return 'Passing score must be between 0 and 100.'
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText.trim()) return `Question ${i + 1}: Question text is required.`
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) return `Question ${i + 1}: Option ${String.fromCharCode(65 + j)} is required.`
      }
      if (q.points < 1) return `Question ${i + 1}: Points must be at least 1.`
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      addToast({ title: 'Validation Error', description: validationError, variant: 'error' })
      return
    }

    setSaving(true)
    try {
      const assessment = await assessmentService.create({
        title: title.trim(),
        type,
        duration,
        passingScore,
        maxScore: questions.reduce((sum, q) => sum + q.points, 0),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
      })

      if (questions.length > 0) {
        await assessmentService.addQuestions(
          assessment._id || assessment.id,
          questions.map((q, idx) => ({
            questionText: q.questionText.trim(),
            options: q.options.map(o => o.trim()),
            correctIndex: q.correctIndex,
            points: q.points,
            orderIndex: idx + 1,
          }))
        )
      }

      addToast({
        title: 'Assessment Created!',
        description: `"${assessment.title}" created with ${questions.length} question(s).`,
        variant: 'success',
      })

      navigate('/company/assessment-assignments')
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to create assessment'
      addToast({ title: 'Error', description: msg, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const completedCount = questions.filter(q => q.questionText.trim() && q.options.every(o => o.trim())).length

  return (
    <PageTransition>
      <main className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/company/assessment-assignments')} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Assessment</h1>
              <p className="text-muted-foreground mt-1">Design a new assessment for your candidates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {questions.length} Q
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 gap-1.5">
              <Target className="h-3.5 w-3.5" />
              {totalPoints} pts
            </Badge>
            {completedCount > 0 && (
              <Badge variant="info" className="px-3 py-1.5 gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                {completedCount}/{questions.length}
              </Badge>
            )}
          </div>
        </div>

        <Card className="border-border/30 shadow-sm">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Assessment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Full Stack Developer Assessment"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type" className="h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duration (minutes) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={480}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore" className="text-sm font-medium">
                  Passing Score (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="passingScore"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={e => setPassingScore(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what this assessment covers..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instructions" className="text-sm font-medium">Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Instructions shown to students before they start the assessment..."
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Questions
            </h2>
            <Badge variant="secondary" className="text-xs">{questions.length} total</Badge>
          </div>
          <Button onClick={addQuestion} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg font-medium">No questions yet</p>
              <p className="text-muted-foreground text-sm mt-1">Click "Add Question" to start building your assessment</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {questions.map((question, index) => {
            const isExpanded = expandedQuestions.has(question.id)
            const isComplete = question.questionText.trim() && question.options.every(o => o.trim())

            return (
              <Card
                key={question.id}
                className={`border-border/30 shadow-sm transition-all duration-200 ${
                  isComplete && !isExpanded ? 'border-l-green-500 border-l-4' : ''
                }`}
              >
                <CardHeader
                  className="flex flex-row items-center justify-between py-3 px-5 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleExpand(question.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${question.questionText ? '' : 'text-muted-foreground italic'}`}>
                        {question.questionText || 'Untitled Question'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {question.points} pts | {question.options.filter(o => o.trim()).length}/{question.options.length} options filled
                      </p>
                    </div>
                    {isComplete && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={e => { e.stopPropagation(); removeQuestion(question.id) }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5 space-y-4 border-t border-border/10">
                    <div className="pt-4 space-y-2">
                      <Label className="text-sm font-medium">
                        Question Text <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder="Enter the question..."
                        value={question.questionText}
                        onChange={e => updateQuestion(question.id, 'questionText', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Options <span className="text-destructive">*</span>
                      </Label>
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <Button
                            variant={question.correctIndex === optIdx ? 'default' : 'outline'}
                            size="icon"
                            className={`h-9 w-9 flex-shrink-0 text-sm font-semibold ${
                              question.correctIndex === optIdx
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'text-muted-foreground'
                            }`}
                            onClick={() => updateQuestion(question.id, 'correctIndex', optIdx)}
                            title={question.correctIndex === optIdx ? 'Correct answer' : 'Mark as correct'}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </Button>
                          <Input
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={option}
                            onChange={e => updateOption(question.id, optIdx, e.target.value)}
                            className={`h-9 flex-1 ${
                              question.correctIndex === optIdx ? 'border-green-500 ring-1 ring-green-500/30' : ''
                            }`}
                          />
                          {question.correctIndex === optIdx && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Points</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={question.points}
                        onChange={e => updateQuestion(question.id, 'points', Number(e.target.value))}
                        className="h-9 w-24"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          )}
        </div>

        <div className="flex items-center justify-between sticky bottom-0 bg-background py-4 border-t border-border/10 -mx-4 px-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              {questions.length} Question{questions.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              {totalPoints} Total Points
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {completedCount}/{questions.length} Filled
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/company/assessment-assignments')} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </PageTransition>
  )
}
