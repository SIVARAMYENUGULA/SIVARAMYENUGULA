import apiClient from '@/lib/api'
import type { Application } from '@/types'

interface BackendResponse<T> {
  success: boolean
  data: T
}

interface BackendApplication {
  _id: string
  jobId: {
    _id: string
    title: string
    companyId?: { _id: string; companyName: string; industry: string; logoUrl: string; location: string }
    companyName?: string
  }
  studentId: { _id: string; name: string; email: string }
  status: string
  resumeUrl?: string
  coverLetter?: string
  appliedAt: string
  createdAt: string
  updatedAt: string
}

function mapApplication(a: BackendApplication): Application & { candidateName?: string; candidateEmail?: string; studentId?: string } {
  const companyName = a.jobId?.companyId?.companyName || a.jobId?.companyName || ''
  return {
    id: a._id,
    jobId: a.jobId?._id || '',
    jobTitle: a.jobId?.title || '',
    company: companyName,
    companyLogo: a.jobId?.companyId?.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${companyName.toLowerCase().replace(/\s/g, '')}`,
    status: a.status as Application['status'],
    appliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString().split('T')[0] : '',
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString().split('T')[0] : '',
    candidateName: a.studentId?.name || '',
    candidateEmail: a.studentId?.email || '',
    studentId: a.studentId?._id || '',
  }
}

export interface SubmitApplicationData {
  jobId: string
  resumeUrl?: string
  coverLetter?: string
  additionalInfo?: Record<string, string>
}

export const applicationService = {
  getAll: async (): Promise<Application[]> => {
    const res = await apiClient.get<BackendResponse<BackendApplication[]>>('/applications')
    return (res.data.data || []).map(mapApplication)
  },
  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/applications/${id}`)
    return res.data.data
  },
  submit: async (data: SubmitApplicationData): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/applications', data)
    return res.data.data
  },
  withdraw: async (id: string): Promise<void> => {
    await apiClient.delete(`/applications/${id}`)
  },
  getStatus: async (jobId: string): Promise<Application | null> => {
    const res = await apiClient.get<BackendResponse<BackendApplication | null>>(`/applications/status/${jobId}`)
    const data = res.data.data
    return data ? mapApplication(data) : null
  },
  updateStatus: async (id: string, status: string): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/applications/${id}/status`, { status })
    return res.data.data
  },
}
