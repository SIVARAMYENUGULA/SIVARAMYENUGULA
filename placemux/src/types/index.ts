export type UserRole = 'student' | 'company' | 'college' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  joinedAt: string
}

export interface Student extends User {
  role: 'student'
  college: string
  course: string
  year: number
  skills: Skill[]
  assessments: Assessment[]
  applications: Application[]
  profileCompleted: number
}

export interface Company extends User {
  role: 'company'
  industry: string
  size: string
  location: string
  website: string
  jobs: Job[]
}

export interface College extends User {
  role: 'college'
  students: number
  placementRate: number
  averagePackage: number
}

export interface Admin extends User {
  role: 'admin'
  permissions: string[]
}

export interface Skill {
  id: string
  name: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  endorsements: number
}

export interface Assessment {
  id: string
  title: string
  type: 'Technical' | 'Aptitude' | 'Soft Skills' | 'Domain'
  score: number
  maxScore: number
  completedAt: string
  duration: number
  status: 'completed' | 'pending' | 'in-progress'
}

export interface Job {
  id: string
  title: string
  company: string
  companyLogo: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract'
  salary: string
  skills: string[]
  description: string
  postedAt: string
  deadline: string
  applicants: number
  status: 'active' | 'closed' | 'draft'
}

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  company: string
  companyLogo: string
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected'
  appliedAt: string
  updatedAt: string
}

export interface Interview {
  id: string
  candidate: string
  candidateAvatar: string
  jobTitle: string
  date: string
  time: string
  duration: number
  type: 'Technical' | 'HR' | 'Cultural' | 'Final'
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled'
  feedback?: string
  rating?: number
  meetingLink?: string
  notes?: string
}

export interface Candidate {
  id: string
  name: string
  avatar: string
  email: string
  college: string
  skills: string[]
  experience: string
  matchScore: number
  status: 'Available' | 'Interviewing' | 'Placed' | 'Not Available'
}

export interface AuditLog {
  id: string
  action: string
  user: string
  userRole: UserRole
  details: string
  ip: string
  timestamp: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

export interface Metric {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
}

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  filterable?: boolean
  render?: (item: T) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string
  count?: number
}
