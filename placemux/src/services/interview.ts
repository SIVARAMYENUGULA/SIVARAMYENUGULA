import apiClient from '@/lib/api'
import type { Interview } from '@/types'

interface BackendResponse<T> {
  success: boolean
  data: T
}

interface BackendInterview {
  _id: string
  companyId: { _id: string; companyName: string; location?: string }
  studentId: { _id: string; name: string; email: string; avatar?: string }
  jobId?: { _id: string; title: string }
  candidateName: string
  candidateEmail: string
  candidateAvatar?: string
  jobTitle: string
  date: string
  time: string
  duration: number
  type: string
  status: string
  notes?: string
  feedback?: string
  rating?: number
}

function mapInterview(i: BackendInterview): Interview {
  return {
    id: i._id,
    candidate: i.candidateName || i.studentId?.name || '',
    candidateAvatar: i.candidateAvatar || i.studentId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(i.candidateName || '').toLowerCase().replace(/\s/g, '')}`,
    jobTitle: i.jobTitle || i.jobId?.title || '',
    date: i.date ? new Date(i.date).toISOString().split('T')[0] : '',
    time: i.time || '',
    duration: i.duration || 60,
    type: i.type as Interview['type'],
    status: i.status as Interview['status'],
    feedback: i.feedback,
    rating: i.rating,
    meetingLink: (i as any).meetingLink || '',
    notes: (i as any).notes || '',
  }
}

export interface ScheduleInterviewData {
  candidateId: string
  jobId: string
  date: string
  time: string
  duration: number
  type: 'Technical' | 'HR' | 'Cultural' | 'Final'
  notes?: string
}

export const interviewService = {
  getAll: async (): Promise<Interview[]> => {
    const res = await apiClient.get<BackendResponse<BackendInterview[]>>('/interviews')
    return (res.data.data || []).map(mapInterview)
  },
  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/interviews/${id}`)
    return res.data.data
  },
  schedule: async (data: any): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/interviews', data)
    return res.data.data
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/interviews/${id}`, data)
    return res.data.data
  },
  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/interviews/${id}`)
  },
  getUpcoming: async (): Promise<Interview[]> => {
    const res = await apiClient.get<BackendResponse<BackendInterview[]>>('/interviews/upcoming')
    return (res.data.data || []).map(mapInterview)
  },
}
