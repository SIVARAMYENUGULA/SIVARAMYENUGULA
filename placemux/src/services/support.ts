import apiClient from '@/lib/api'

interface BackendResponse<T> {
  success: boolean
  data: T
}

export interface SupportTicket {
  _id: string
  studentId: { _id: string; course: string; year: number }
  userId: { _id: string; name: string; email: string }
  subject: string
  message: string
  category: string
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  adminReply: string
  repliedBy: string | null
  repliedAt: string | null
  closedBy: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
}

export const supportService = {
  getAll: async (params?: { status?: string; category?: string }): Promise<SupportTicket[]> => {
    const res = await apiClient.get<BackendResponse<SupportTicket[]>>('/support', { params })
    return res.data.data || []
  },
  getById: async (id: string): Promise<SupportTicket> => {
    const res = await apiClient.get<BackendResponse<SupportTicket>>(`/support/${id}`)
    return res.data.data
  },
  create: async (data: { subject: string; message: string; category?: string; priority?: string }): Promise<SupportTicket> => {
    const res = await apiClient.post<BackendResponse<SupportTicket>>('/support', data)
    return res.data.data
  },
  reply: async (id: string, message: string): Promise<SupportTicket> => {
    const res = await apiClient.put<BackendResponse<SupportTicket>>(`/support/${id}/reply`, { message })
    return res.data.data
  },
  updateStatus: async (id: string, status: string): Promise<SupportTicket> => {
    const res = await apiClient.put<BackendResponse<SupportTicket>>(`/support/${id}/status`, { status })
    return res.data.data
  },
  getStats: async (): Promise<TicketStats> => {
    const res = await apiClient.get<BackendResponse<TicketStats>>('/support/stats')
    return res.data.data
  },
}
