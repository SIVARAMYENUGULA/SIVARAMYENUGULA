import apiClient from '@/lib/api'

interface BackendResponse<T> {
  success: boolean
  data: T
}

interface ProfileData {
  user: {
    _id: string
    name: string
    email: string
    role: string
    avatar: string
    isVerified: boolean
  }
  profile?: {
    _id: string
    collegeId?: any
    course?: string
    year?: number
    phone?: string
    linkedinUrl?: string
    portfolioUrl?: string
    resumeUrl?: string
    bio?: string
    profileCompleted?: number
  }
}

export const profileService = {
  getProfile: async (): Promise<ProfileData> => {
    const res = await apiClient.get<BackendResponse<ProfileData>>('/auth/profile')
    return res.data.data
  },
  updateProfile: async (data: any): Promise<any> => {
    const res = await apiClient.put<BackendResponse<any>>('/auth/profile', data)
    return res.data.data
  },
  uploadResume: async (file: File): Promise<{ resumeUrl: string }> => {
    const formData = new FormData()
    formData.append('resume', file)
    const res = await apiClient.post<BackendResponse<{ resumeUrl: string }>>('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await apiClient.post<BackendResponse<{ avatarUrl: string }>>('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
}
