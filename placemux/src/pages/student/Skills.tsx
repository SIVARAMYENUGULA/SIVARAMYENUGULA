import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BarChartWidget, PieChartWidget } from '@/components/ui/chart'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/components/shared/confirm-dialog'
import apiClient from '@/lib/api'
import { Plus, Award, TrendingUp, BookOpen, Star, Pencil, Trash2, Loader2 } from 'lucide-react'

import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

interface Skill {
  _id: string
  name: string
  category: string
  level: string
  endorsements: number
}

interface SkillPassport {
  skills: Skill[]
  overallScore: number
  lastUpdated: string
}

export function StudentSkills() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [passport, setPassport] = useState<SkillPassport | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Frontend', level: 'Intermediate' })
  const { addToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchSkills = async () => {
    try {
      const res = await apiClient.get('/skills')
      setPassport(res.data.data)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load skills')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { fetchSkills() }, [])

  // Data derived from passport (safe before early returns — not hooks)
  const skills = passport?.skills || []
  const overallScore = passport?.overallScore || 0

  const skillLevels = skills.map(s => ({
    name: s.name,
    level: s.level === 'Expert' ? 90 : s.level === 'Advanced' ? 75 : s.level === 'Intermediate' ? 50 : 25,
    endorsements: s.endorsements || 0,
    category: s.category,
  }))

  // useMemo must be BEFORE early returns to keep hook count consistent across renders
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    skills.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1 })
    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value,
      color: ['#6c5ce7', '#a29bfe', '#fd79a8', '#00cec9', '#fdcb6e'][i % 5],
    }))
  }, [skills])

  const totalEndorsements = skills.reduce((a, s) => a + (s.endorsements || 0), 0)
  const expertCount = skills.filter(s => s.level === 'Expert' || s.level === 'Advanced').length

  // Early returns — all hooks above this line
  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const resetForm = () => {
    setForm({ name: '', category: 'Frontend', level: 'Intermediate' })
    setEditingSkill(null)
  }

  const handleAdd = async () => {
    if (!form.name.trim()) {
      addToast({ title: 'Validation', description: 'Skill name is required', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      if (editingSkill) {
        const res = await apiClient.put(`/skills/${editingSkill._id}`, form)
        setPassport(res.data.data)
        addToast({ title: 'Skill Updated', description: `${form.name} has been updated`, variant: 'success' })
      } else {
        const res = await apiClient.post('/skills', form)
        setPassport(res.data.data)
        addToast({ title: 'Skill Added', description: `${form.name} has been added`, variant: 'success' })
      }
      setShowAddDialog(false)
      resetForm()
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save skill', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setForm({ name: skill.name, category: skill.category, level: skill.level })
    setShowAddDialog(true)
  }

  const handleDelete = async (skill: Skill) => {
    const confirmed = await confirm('Delete Skill', `Are you sure you want to delete "${skill.name}"?`)
    if (confirmed) {
      try {
        const res = await apiClient.delete(`/skills/${skill._id}`)
        setPassport(res.data.data)
        addToast({ title: 'Skill Deleted', description: `${skill.name} has been removed`, variant: 'success' })
      } catch (err: any) {
        addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to delete skill', variant: 'error' })
      }
    }
  }

  return (
    <main className="space-y-8" aria-label="Skill passport">
      <ConfirmDialog />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Skill Passport</h1>
          <p className="text-muted-foreground mt-1">Showcase your verified skills and get endorsed by peers and mentors</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true) }} aria-label="Add new skill">
          <Plus className="h-4 w-4 mr-2" /> Add Skill
        </Button>
      </div>

      <section aria-label="Skill statistics">
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{skills.length}</p>
              <p className="text-xs text-muted-foreground">Total Skills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{expertCount}</p>
              <p className="text-xs text-muted-foreground">Expert Level</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalEndorsements}</p>
              <p className="text-xs text-muted-foreground">Endorsements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-8 w-8 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">{categoryData.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Skill proficiency" className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle id="proficiency-title">Skill Proficiency (Overall: {overallScore}%)</CardTitle></CardHeader>
            <CardContent aria-labelledby="proficiency-title" className="space-y-4">
              {skills.length === 0 ? (
                <EmptyState icon={Star} title="No skills added" description="Add your skills to showcase your expertise" action={{ label: 'Add Skill', onClick: () => { resetForm(); setShowAddDialog(true) } }} />
              ) : (
                skills.map((skill) => {
                  const pct = skill.level === 'Expert' ? 90 : skill.level === 'Advanced' ? 75 : skill.level === 'Intermediate' ? 50 : 25
                  return (
                    <div key={skill._id} className="space-y-1.5 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{skill.category}</Badge>
                          <Badge variant={skill.level === 'Expert' ? 'success' : skill.level === 'Advanced' ? 'info' : 'secondary'} className="text-[10px]">{skill.level}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{skill.endorsements || 0} endorsements</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(skill)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(skill)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={pct} aria-label={`${skill.name}: proficiency`} />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </section>
        <aside aria-label="Skill categories" className="space-y-6">
          <Card>
            <CardHeader><CardTitle id="categories-title">Skill Categories</CardTitle></CardHeader>
            <CardContent aria-labelledby="categories-title">
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No skills added yet</p>
              ) : (
                <PieChartWidget data={categoryData} height={200} innerRadius={50} />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {skills.length > 0 && (
        <Card>
          <CardHeader><CardTitle id="learning-title">Learning Progress</CardTitle></CardHeader>
          <CardContent aria-labelledby="learning-title">
            <BarChartWidget data={skillLevels} bars={[{ dataKey: 'level', name: 'Proficiency', color: '#6c5ce7' }]} xKey="name" height={250} />
          </CardContent>
        </Card>
      )}

      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { resetForm() }; setShowAddDialog(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skillName">Skill Name</Label>
              <Input id="skillName" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. React, Python, Docker" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillCategory">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger id="skillCategory"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Frontend', 'Backend', 'AI/ML', 'Database', 'DevOps', 'Other'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillLevel">Proficiency Level</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger id="skillLevel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false) }}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingSkill ? 'Update' : 'Add'} Skill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
