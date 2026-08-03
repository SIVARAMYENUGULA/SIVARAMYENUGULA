import apiClient from '@/lib/api'

interface BackendResponse<T> {
  success: boolean
  data: T
}

export interface AssignmentRecord {
  _id: string
  assessmentId: { _id: string; title: string; type: string; duration: number; passingScore: number }
  studentId: { _id: string; userId: { _id: string; name: string; email: string }; course: string }
  companyId: string
  assignedAt: string
  deadline: string | null
  status: 'assigned' | 'in_progress' | 'completed' | 'expired'
  notified: boolean
}

export interface AssignmentAnalytics {
  summary: {
    totalAssignments: number
    assigned: number
    inProgress: number
    completed: number
    expired: number
    completionRate: number
    avgScore: number
    highestScore: number
    lowestScore: number
    passedCount: number
  }
  topPerformers: {
    studentName: string
    studentEmail: string
    score: number
    maxScore: number
    percentage: number
    passed: boolean
    grade: string
    assessmentTitle: string
    completedAt: string
    course: string
  }[]
  departmentBreakdown: {
    course: string
    total: number
    passed: number
    avgScore: number
    passRate: number
  }[]
  assessmentBreakdown: {
    assessmentId: string
    assessmentTitle: string
    assessmentType: string
    total: number
    completed: number
    inProgress: number
    expired: number
  }[]
}

export interface CandidateAssessment {
  assignmentId: string
  assessmentId: string
  assessmentTitle: string
  assessmentType: string
  status: string
  deadline: string | null
  assignedAt: string
  score: number | null
  maxScore: number | null
  percentage: number | null
  percentile: number | null
  grade: string | null
  passed: boolean | null
  completedAt: string | null
}

export const assignmentService = {
  assign: async (assessmentId: string, studentIds: string[], deadline?: string): Promise<any> => {
    const res = await apiClient.post<BackendResponse<any>>('/assignments', { assessmentId, studentIds, deadline })
    return res.data
  },

  getCompanyAssignments: async (assessmentId?: string): Promise<AssignmentRecord[]> => {
    const params = assessmentId ? { assessmentId } : {}
    const res = await apiClient.get<BackendResponse<AssignmentRecord[]>>('/assignments/company', { params })
    return res.data.data || []
  },

  getAnalytics: async (): Promise<AssignmentAnalytics> => {
    const res = await apiClient.get<BackendResponse<AssignmentAnalytics>>('/assignments/analytics')
    return res.data.data
  },

  getCandidateAssessments: async (studentId: string): Promise<CandidateAssessment[]> => {
    const res = await apiClient.get<BackendResponse<CandidateAssessment[]>>(`/assignments/candidate/${studentId}`)
    return res.data.data || []
  },

  getStudentAssignments: async (): Promise<any[]> => {
    const res = await apiClient.get<BackendResponse<any[]>>('/assignments/my')
    return res.data.data || []
  },
}
