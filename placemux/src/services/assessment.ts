import apiClient from '@/lib/api'
import type { Assessment } from '@/types'

interface BackendResponse<T> {
  success: boolean
  data: T
}

export interface ScoreRecord {
  _id: string
  sessionId: string
  studentId: string
  assessmentId: string
  assessmentTitle: string
  assessmentType: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  grade: string
  correctCount: number
  totalQuestions: number
  timeTakenSec: number
  completedAt: string
}

function mapAssessment(a: any): Assessment {
  return {
    id: a._id || a.id,
    title: a.title,
    type: a.type as Assessment['type'],
    score: a.score ?? 0,
    maxScore: a.maxScore ?? 100,
    completedAt: a.completedAt || '',
    duration: a.duration ?? 0,
    status: a.status === 'completed' ? 'completed' : a.status === 'in_progress' ? 'in-progress' : 'pending',
  }
}

export const assessmentService = {
  getAll: async (): Promise<Assessment[]> => {
    const res = await apiClient.get<BackendResponse<any[]>>('/assessments')
    return (res.data.data || []).map(mapAssessment)
  },
  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/assessments/${id}`)
    return res.data.data
  },
  start: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/assessments/${id}/start`)
    return res.data.data
  },
  submit: async (id: string, answers: any[]): Promise<any> => {
    const res = await apiClient.post(`/assessments/${id}/submit`, { answers })
    return res.data.data
  },
  getResults: async (id: string): Promise<any> => {
    const res = await apiClient.get(`/assessments/${id}/results`)
    return res.data.data
  },
  getHistory: async (): Promise<ScoreRecord[]> => {
    const res = await apiClient.get<BackendResponse<ScoreRecord[]>>('/assessments/history')
    return res.data.data || []
  },
  getCompanyResults: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/assessments/company/results')
    return res.data.data
  },
  assignToStudents: async (id: string, studentIds: string[], applicationIds?: string[]): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/assessments/${id}/assign`, { studentIds, applicationIds })
    return res.data
  },

  create: async (data: {
    title: string
    type: string
    duration: number
    passingScore?: number
    maxScore?: number
    description?: string
    instructions?: string
  }): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/assessments', data)
    return res.data.data
  },

  addQuestions: async (assessmentId: string, questions: {
    questionText: string
    options: string[]
    correctIndex: number
    points?: number
    orderIndex?: number
  }[]): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/assessments/${assessmentId}/questions`, { questions })
    return res.data.data
  },
}
