import apiClient from '@/lib/api'

interface BackendResponse<T> {
  success: boolean
  data: T
  pagination?: { page: number; limit: number; total: number; pages: number }
}

export const collegeService = {
  getDashboard: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/college/dashboard')
    return res.data.data
  },
  getStudents: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/college/students', { params })
    return res.data
  },
  getStudentDetail: async (studentId: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/college/students/${studentId}`)
    return res.data.data
  },
  getCompanies: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/college/companies')
    return res.data.data
  },
  getCompanyDetail: async (companyId: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/college/companies/${companyId}`)
    return res.data.data
  },
  getAnalytics: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/college/analytics')
    return res.data.data
  },
  getAssessmentReports: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/college/assessment-reports')
    return res.data.data
  },
  getSalaryAnalytics: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/college/salary-analytics')
    return res.data.data
  },
}

export const driveService = {
  getAll: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/drives')
    return res.data.data
  },
  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/drives/${id}`)
    return res.data.data
  },
  create: async (data: any): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/drives', data)
    return res.data
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/drives/${id}`, data)
    return res.data
  },
  publish: async (id: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/drives/${id}/publish`)
    return res.data
  },
  advanceStage: async (id: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/drives/${id}/advance-stage`)
    return res.data
  },
  getEligibleStudents: async (id: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/drives/${id}/eligible-students`)
    return res.data.data
  },
  registerStudents: async (id: string, studentIds: string[]): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/drives/${id}/register-students`, { studentIds })
    return res.data
  },
}

export const offerService = {
  getAll: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/offers')
    return res.data.data
  },
  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>(`/offers/${id}`)
    return res.data.data
  },
  create: async (data: any): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/offers', data)
    return res.data
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/offers/${id}`, data)
    return res.data
  },
  send: async (id: string, expiryDate?: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/offers/${id}/send`, { expiryDate })
    return res.data
  },
  accept: async (id: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/offers/${id}/accept`)
    return res.data
  },
  reject: async (id: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/offers/${id}/reject`)
    return res.data
  },
  delete: async (id: string): Promise<any> => {
    const res = await apiClient.delete<BackendResponse<any>>(`/offers/${id}`)
    return res.data
  },
}
