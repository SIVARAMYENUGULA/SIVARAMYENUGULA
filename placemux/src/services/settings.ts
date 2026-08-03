import apiClient from '@/lib/api'

interface BackendResponse<T> {
  success: boolean
  data: T
}

export interface StudentSettings {
  _id: string
  studentId: string
  userId: string
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
    applicationUpdates: boolean
    interviewReminders: boolean
    assessmentReminders: boolean
    jobAlerts: boolean
    marketingEmails: boolean
  }
  privacy: {
    showProfileToCompanies: boolean
    showEmailToCompanies: boolean
    showPhoneToCompanies: boolean
    showResumePublicly: boolean
    showSkillsPublicly: boolean
  }
  preferences: {
    language: string
    timezone: string
    theme: string
  }
}

export const settingsService = {
  getSettings: async (): Promise<StudentSettings> => {
    const res = await apiClient.get<BackendResponse<StudentSettings>>('/settings')
    return res.data.data
  },
  updateSettings: async (data: Partial<{
    notifications: Partial<StudentSettings['notifications']>
    privacy: Partial<StudentSettings['privacy']>
    preferences: Partial<StudentSettings['preferences']>
  }>): Promise<StudentSettings> => {
    const res = await apiClient.put<BackendResponse<StudentSettings>>('/settings', data)
    return res.data.data
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/settings/change-password', { currentPassword, newPassword })
  },
}
