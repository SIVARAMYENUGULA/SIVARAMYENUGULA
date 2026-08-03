import apiClient from '@/lib/api'

interface BackendResponse<T> {
  success: boolean
  data: T
}

export const adminService = {
  getStats: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/admin/stats')
    return res.data.data
  },
  getAnalytics: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/admin/analytics')
    return res.data.data
  },
  getUsers: async (params?: { page?: number; role?: string; search?: string; limit?: number }): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/admin/users', { params })
    return res.data
  },
  updateUser: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/admin/users/${id}`, data)
    return res.data.data
  },
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`)
  },
  resetUserPassword: async (id: string, newPassword: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>(`/admin/users/${id}/reset-password`, { newPassword })
    return res.data
  },
  verifyCompany: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/admin/companies/${id}/verify`, data)
    return res.data.data
  },
  verifyCollege: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>(`/admin/colleges/${id}/verify`, data)
    return res.data.data
  },
  createCollege: async (data: any): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/admin/colleges', data)
    return res.data
  },
  createCompany: async (data: any): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/admin/companies', data)
    return res.data
  },
  getColleges: async (params?: { search?: string; verified?: string }): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/admin/colleges', { params })
    return res.data
  },
  getCompanies: async (params?: { search?: string; verified?: string }): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/admin/companies', { params })
    return res.data
  },
  getSettings: async (): Promise<any> => {
    const res = await apiClient.get<BackendResponse<any>>('/admin/settings')
    return res.data.data
  },
  updateSettings: async (data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>('/admin/settings', data)
    return res.data.data
  },
}
