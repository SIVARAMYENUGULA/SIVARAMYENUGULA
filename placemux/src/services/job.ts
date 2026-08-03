import apiClient from '@/lib/api'
import type { Job } from '@/types'

interface BackendResponse<T> {
  success: boolean
  data: T
}

interface BackendJob {
  _id: string
  title: string
  companyId?: { _id: string; companyName: string; industry: string; logoUrl: string; location: string }
  companyName?: string
  location: string
  type: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency: string
  skillsRequired: string[]
  description: string
  applicantsCount: number
  status: string
  postedAt: string
  deadline?: string
}

function mapJob(j: BackendJob): Job {
  return {
    id: j._id,
    title: j.title,
    company: j.companyId?.companyName || j.companyName || '',
    companyLogo: j.companyId?.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(j.companyId?.companyName || j.companyName || '').toLowerCase().replace(/\s/g, '')}`,
    location: j.location || '',
    type: j.type as Job['type'],
    salary: j.salaryMin && j.salaryMax 
      ? `₹${(j.salaryMin / 100000).toFixed(0)}L - ₹${(j.salaryMax / 100000).toFixed(0)}L`
      : j.salaryMin 
        ? `₹${(j.salaryMin / 100000).toFixed(0)}L+`
        : 'Negotiable',
    skills: j.skillsRequired || [],
    description: j.description || '',
    postedAt: j.postedAt ? new Date(j.postedAt).toISOString().split('T')[0] : '',
    deadline: j.deadline ? new Date(j.deadline).toISOString().split('T')[0] : '',
    applicants: j.applicantsCount || 0,
    status: j.status as Job['status'],
  }
}

export const jobService = {
  getAll: async (params?: { status?: string; type?: string; search?: string }): Promise<Job[]> => {
    const res = await apiClient.get<BackendResponse<BackendJob[]>>('/jobs', { params })
    return (res.data.data || []).map(mapJob)
  },
  getById: async (id: string): Promise<Job> => {
    const res = await apiClient.get<BackendResponse<BackendJob>>(`/jobs/${id}`)
    return mapJob(res.data.data)
  },
  create: async (data: any): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/jobs', data)
    return res.data.data
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/jobs/${id}`, data)
    return res.data.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`)
  },
  getRecommended: async (): Promise<Job[]> => {
    const res = await apiClient.get<BackendResponse<BackendJob[]>>('/jobs/recommended')
    return (res.data.data || []).map(mapJob)
  },
}
