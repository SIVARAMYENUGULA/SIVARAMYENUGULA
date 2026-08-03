import type {
  Student, Company, College, Admin, Job, Assessment,
  Interview, Candidate, AuditLog, Notification, Metric
} from '@/types'

export const currentUser: Student = {
  id: 'usr_1',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@college.edu',
  role: 'student',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
  joinedAt: '2025-09-01',
  college: 'Indian Institute of Technology',
  course: 'B.Tech Computer Science',
  year: 3,
  skills: [
    { id: 'sk_1', name: 'React', category: 'Frontend', level: 'Advanced', endorsements: 24 },
    { id: 'sk_2', name: 'TypeScript', category: 'Frontend', level: 'Advanced', endorsements: 18 },
    { id: 'sk_3', name: 'Node.js', category: 'Backend', level: 'Intermediate', endorsements: 12 },
    { id: 'sk_4', name: 'Python', category: 'Backend', level: 'Advanced', endorsements: 20 },
    { id: 'sk_5', name: 'Machine Learning', category: 'AI/ML', level: 'Intermediate', endorsements: 8 },
    { id: 'sk_6', name: 'PostgreSQL', category: 'Database', level: 'Intermediate', endorsements: 10 },
    { id: 'sk_7', name: 'Docker', category: 'DevOps', level: 'Beginner', endorsements: 4 },
    { id: 'sk_8', name: 'GraphQL', category: 'Backend', level: 'Intermediate', endorsements: 6 },
  ],
  assessments: [
    { id: 'ass_1', title: 'Full Stack Development', type: 'Technical', score: 87, maxScore: 100, completedAt: '2025-12-15', duration: 120, status: 'completed' },
    { id: 'ass_2', title: 'Aptitude Test', type: 'Aptitude', score: 92, maxScore: 100, completedAt: '2025-11-20', duration: 60, status: 'completed' },
    { id: 'ass_3', title: 'Communication Skills', type: 'Soft Skills', score: 78, maxScore: 100, completedAt: '2025-10-10', duration: 45, status: 'completed' },
    { id: 'ass_4', title: 'Data Structures & Algorithms', type: 'Technical', score: 0, maxScore: 100, completedAt: '', duration: 90, status: 'pending' },
    { id: 'ass_5', title: 'System Design', type: 'Domain', score: 0, maxScore: 100, completedAt: '', duration: 120, status: 'pending' },
  ],
  applications: [
    { id: 'app_1', jobId: 'job_1', jobTitle: 'Senior Frontend Engineer', company: 'Google', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google', status: 'Interview', appliedAt: '2025-12-20', updatedAt: '2026-01-05' },
    { id: 'app_2', jobId: 'job_2', jobTitle: 'Full Stack Developer', company: 'Microsoft', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=microsoft', status: 'Shortlisted', appliedAt: '2025-12-18', updatedAt: '2026-01-02' },
    { id: 'app_3', jobId: 'job_3', jobTitle: 'Software Engineer', company: 'Amazon', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amazon', status: 'Applied', appliedAt: '2025-12-22', updatedAt: '2025-12-22' },
    { id: 'app_4', jobId: 'job_4', jobTitle: 'Backend Developer', company: 'Stripe', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stripe', status: 'Rejected', appliedAt: '2025-11-15', updatedAt: '2025-12-01' },
    { id: 'app_5', jobId: 'job_5', jobTitle: 'Frontend Intern', company: 'Vercel', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vercel', status: 'Accepted', appliedAt: '2025-10-01', updatedAt: '2025-11-15' },
  ],
  profileCompleted: 85,
}

export const mockCompany: Company = {
  id: 'comp_1',
  name: 'TechCorp India',
  email: 'hr@techcorp.com',
  role: 'company',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techcorp',
  joinedAt: '2024-06-01',
  industry: 'Technology',
  size: '1000-5000',
  location: 'Bangalore, India',
  website: 'https://techcorp.com',
  jobs: [
    { id: 'job_1', title: 'Senior Frontend Engineer', company: 'TechCorp India', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techcorp', location: 'Bangalore', type: 'Full-time', salary: '₹25,00,000/yr', skills: ['React', 'TypeScript', 'Next.js'], description: 'We are looking for a Senior Frontend Engineer...', postedAt: '2025-12-01', deadline: '2026-02-01', applicants: 45, status: 'active' },
    { id: 'job_2', title: 'Full Stack Developer', company: 'TechCorp India', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techcorp', location: 'Remote', type: 'Full-time', salary: '₹20,00,000/yr', skills: ['React', 'Node.js', 'MongoDB'], description: 'Join our platform team...', postedAt: '2025-12-15', deadline: '2026-02-15', applicants: 32, status: 'active' },
    { id: 'job_3', title: 'DevOps Engineer', company: 'TechCorp India', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techcorp', location: 'Hyderabad', type: 'Full-time', salary: '₹22,00,000/yr', skills: ['AWS', 'Docker', 'Kubernetes'], description: 'Looking for an experienced DevOps engineer...', postedAt: '2026-01-01', deadline: '2026-03-01', applicants: 18, status: 'active' },
  ],
}

export const mockCollege: College = {
  id: 'coll_1',
  name: 'Indian Institute of Technology, Bombay',
  email: 'placement@iitb.ac.in',
  role: 'college',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=iitb',
  joinedAt: '2023-01-01',
  students: 8500,
  placementRate: 92.5,
  averagePackage: 1850000,
}

export const mockAdmin: Admin = {
  id: 'adm_1',
  name: 'Admin User',
  email: 'admin@placemux.com',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  joinedAt: '2023-01-01',
  permissions: ['all'],
}

export const mockJobs: Job[] = [
  { id: 'job_1', title: 'Senior Frontend Engineer', company: 'Google', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google', location: 'Bangalore', type: 'Full-time', salary: '₹30,00,000/yr', skills: ['React', 'TypeScript', 'Next.js'], description: 'Build next-gen user interfaces for millions of users. We are looking for a senior engineer who can lead frontend initiatives and mentor junior developers.', postedAt: '2025-12-20', deadline: '2026-02-20', applicants: 120, status: 'active' },
  { id: 'job_2', title: 'Full Stack Developer', company: 'Microsoft', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=microsoft', location: 'Hyderabad', type: 'Full-time', salary: '₹28,00,000/yr', skills: ['React', 'C#', 'Azure', 'SQL'], description: 'Join Microsoft India to build enterprise cloud solutions. Work on cutting-edge technologies that power businesses worldwide.', postedAt: '2025-12-18', deadline: '2026-02-18', applicants: 95, status: 'active' },
  { id: 'job_3', title: 'Software Engineer', company: 'Amazon', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amazon', location: 'Bangalore', type: 'Full-time', salary: '₹25,00,000/yr', skills: ['Java', 'AWS', 'Microservices'], description: 'Build large-scale distributed systems that power Amazon\'s global e-commerce platform. Work with world-class engineers.', postedAt: '2025-12-22', deadline: '2026-02-22', applicants: 200, status: 'active' },
  { id: 'job_4', title: 'Backend Developer', company: 'Stripe', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stripe', location: 'Remote', type: 'Full-time', salary: '₹35,00,000/yr', skills: ['Go', 'Ruby', 'PostgreSQL', 'Kafka'], description: 'Build the economic infrastructure for the internet. Work on payment systems that handle billions in transactions.', postedAt: '2025-11-15', deadline: '2026-01-15', applicants: 150, status: 'closed' },
  { id: 'job_5', title: 'Frontend Intern', company: 'Vercel', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vercel', location: 'Remote', type: 'Internship', salary: '₹50,000/mo', skills: ['React', 'Next.js', 'Tailwind'], description: 'Join Vercel as a frontend intern. Work on the platform that powers the best frontend teams in the world.', postedAt: '2025-10-01', deadline: '2025-12-31', applicants: 500, status: 'closed' },
  { id: 'job_6', title: 'Data Scientist', company: 'Netflix', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=netflix', location: 'Mumbai', type: 'Full-time', salary: '₹32,00,000/yr', skills: ['Python', 'TensorFlow', 'SQL', 'Statistics'], description: 'Use data to drive content decisions. Build recommendation systems that serve hundreds of millions of members.', postedAt: '2026-01-05', deadline: '2026-03-05', applicants: 80, status: 'active' },
  { id: 'job_7', title: 'Product Manager', company: 'Flipkart', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=flipkart', location: 'Bangalore', type: 'Full-time', salary: '₹30,00,000/yr', skills: ['Product Strategy', 'Analytics', 'User Research'], description: 'Own product roadmap for India\'s largest e-commerce platform. Drive features that impact millions of shoppers.', postedAt: '2026-01-10', deadline: '2026-03-10', applicants: 60, status: 'active' },
  { id: 'job_8', title: 'ML Engineer', company: 'OpenAI', companyLogo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=openai', location: 'Remote', type: 'Full-time', salary: '₹40,00,000/yr', skills: ['Python', 'PyTorch', 'NLP', 'Transformers'], description: 'Work on cutting-edge AI models. Push the boundaries of what\'s possible with machine learning.', postedAt: '2026-01-01', deadline: '2026-03-01', applicants: 300, status: 'active' },
]

export const mockAssessments: Assessment[] = [
  { id: 'ass_1', title: 'Full Stack Development', type: 'Technical', score: 87, maxScore: 100, completedAt: '2025-12-15', duration: 120, status: 'completed' },
  { id: 'ass_2', title: 'Aptitude Test', type: 'Aptitude', score: 92, maxScore: 100, completedAt: '2025-11-20', duration: 60, status: 'completed' },
  { id: 'ass_3', title: 'Communication Skills', type: 'Soft Skills', score: 78, maxScore: 100, completedAt: '2025-10-10', duration: 45, status: 'completed' },
  { id: 'ass_4', title: 'Data Structures & Algorithms', type: 'Technical', score: 0, maxScore: 100, completedAt: '', duration: 90, status: 'pending' },
  { id: 'ass_5', title: 'System Design', type: 'Domain', score: 0, maxScore: 100, completedAt: '', duration: 120, status: 'pending' },
  { id: 'ass_6', title: 'Problem Solving', type: 'Aptitude', score: 85, maxScore: 100, completedAt: '2025-09-05', duration: 60, status: 'completed' },
  { id: 'ass_7', title: 'Leadership Assessment', type: 'Soft Skills', score: 0, maxScore: 100, completedAt: '', duration: 30, status: 'in-progress' },
]

export const mockInterviews: Interview[] = [
  { id: 'int_1', candidate: 'Priya Sharma', candidateAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', jobTitle: 'Senior Frontend Engineer', date: '2026-01-15', time: '10:00 AM', duration: 60, type: 'Technical', status: 'Scheduled' },
  { id: 'int_2', candidate: 'Rahul Verma', candidateAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul', jobTitle: 'Full Stack Developer', date: '2026-01-16', time: '2:00 PM', duration: 45, type: 'HR', status: 'Scheduled' },
  { id: 'int_3', candidate: 'Ananya Gupta', candidateAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya', jobTitle: 'Data Scientist', date: '2026-01-14', time: '11:30 AM', duration: 60, type: 'Technical', status: 'Completed', feedback: 'Strong technical skills, good communication', rating: 4 },
  { id: 'int_4', candidate: 'Vikram Patel', candidateAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram', jobTitle: 'DevOps Engineer', date: '2026-01-13', time: '3:00 PM', duration: 45, type: 'Cultural', status: 'Completed', feedback: 'Great culture fit, experienced with AWS', rating: 5 },
  { id: 'int_5', candidate: 'Neha Singh', candidateAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha', jobTitle: 'Product Manager', date: '2026-01-17', time: '9:00 AM', duration: 60, type: 'Final', status: 'Scheduled' },
]

export const mockCandidates: Candidate[] = [
  { id: 'can_1', name: 'Priya Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', email: 'priya@example.com', college: 'IIT Delhi', skills: ['React', 'TypeScript', 'Next.js', 'GraphQL'], experience: '3 years', matchScore: 94, status: 'Available' },
  { id: 'can_2', name: 'Rahul Verma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul', email: 'rahul@example.com', college: 'NIT Trichy', skills: ['Node.js', 'Python', 'MongoDB', 'AWS'], experience: '2 years', matchScore: 88, status: 'Interviewing' },
  { id: 'can_3', name: 'Ananya Gupta', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya', email: 'ananya@example.com', college: 'IIT Bombay', skills: ['Python', 'TensorFlow', 'SQL', 'Statistics'], experience: '4 years', matchScore: 92, status: 'Available' },
  { id: 'can_4', name: 'Vikram Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram', email: 'vikram@example.com', college: 'BITS Pilani', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], experience: '5 years', matchScore: 90, status: 'Available' },
  { id: 'can_5', name: 'Neha Singh', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha', email: 'neha@example.com', college: 'IIM Ahmedabad', skills: ['Product Strategy', 'Analytics', 'User Research', 'Agile'], experience: '6 years', matchScore: 86, status: 'Placed' },
  { id: 'can_6', name: 'Amit Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit', email: 'amit@example.com', college: 'IIT Kanpur', skills: ['Java', 'Spring', 'Microservices', 'Kafka'], experience: '3 years', matchScore: 84, status: 'Not Available' },
]

export const mockAuditLogs: AuditLog[] = [
  { id: 'log_1', action: 'User Created', user: 'admin@placemux.com', userRole: 'admin', details: 'Created new company account for TechCorp', ip: '192.168.1.1', timestamp: '2026-01-10T09:30:00' },
  { id: 'log_2', action: 'Job Posted', user: 'hr@techcorp.com', userRole: 'company', details: 'Posted "Senior Frontend Engineer" position', ip: '192.168.1.2', timestamp: '2026-01-10T10:15:00' },
  { id: 'log_3', action: 'Assessment Completed', user: 'arjun@college.edu', userRole: 'student', details: 'Completed Full Stack Assessment with score 87%', ip: '192.168.1.3', timestamp: '2026-01-09T14:00:00' },
  { id: 'log_4', action: 'College Verified', user: 'admin@placemux.com', userRole: 'admin', details: 'Verified IIT Bombay placement cell', ip: '192.168.1.1', timestamp: '2026-01-09T11:00:00' },
  { id: 'log_5', action: 'Application Submitted', user: 'arjun@college.edu', userRole: 'student', details: 'Applied to Google - Senior Frontend Engineer', ip: '192.168.1.3', timestamp: '2026-01-08T16:45:00' },
]

export const mockNotifications: Notification[] = [
  { id: 'not_1', title: 'Application Shortlisted', message: 'Your application for Senior Frontend Engineer at Google has been shortlisted!', type: 'success', read: false, createdAt: '2026-01-10T09:00:00' },
  { id: 'not_2', title: 'New Assessment Available', message: 'System Design assessment is now available. Complete it to boost your profile.', type: 'info', read: false, createdAt: '2026-01-09T14:00:00' },
  { id: 'not_3', title: 'Interview Scheduled', message: 'Interview with Microsoft scheduled for Jan 20, 2026 at 11:00 AM.', type: 'info', read: true, createdAt: '2026-01-08T10:00:00' },
  { id: 'not_4', title: 'Profile Completion', message: 'Your profile is 85% complete. Add more skills to reach 100%.', type: 'warning', read: true, createdAt: '2026-01-07T08:00:00' },
]

export const studentMetrics: Metric[] = [
  { label: 'Profile Score', value: '85%', change: 12, trend: 'up' },
  { label: 'Assessments Done', value: 8, change: 3, trend: 'up' },
  { label: 'Applications', value: 12, change: 5, trend: 'up' },
  { label: 'Interview Success', value: '67%', change: -2, trend: 'down' },
]

export const companyMetrics: Metric[] = [
  { label: 'Active Jobs', value: 12, change: 3, trend: 'up' },
  { label: 'Total Applicants', value: 847, change: 12, trend: 'up' },
  { label: 'Interviews Done', value: 48, change: 8, trend: 'up' },
  { label: 'Hires This Month', value: 6, change: -1, trend: 'down' },
]

export const collegeMetrics: Metric[] = [
  { label: 'Total Students', value: 8500, change: 5, trend: 'up' },
  { label: 'Placement Rate', value: '92.5%', change: 2.5, trend: 'up' },
  { label: 'Avg Package', value: '₹18.5L', change: 8, trend: 'up' },
  { label: 'Companies Visited', value: 245, change: 15, trend: 'up' },
]

export const adminMetrics: Metric[] = [
  { label: 'Total Users', value: '24,580', change: 8, trend: 'up' },
  { label: 'Active Companies', value: 345, change: 12, trend: 'up' },
  { label: 'Colleges', value: 128, change: 4, trend: 'up' },
  { label: 'Placements', value: '12,450', change: 15, trend: 'up' },
]

export const monthlyApplicationsData = [
  { month: 'Jan', applications: 45, shortlisted: 20, interviews: 12 },
  { month: 'Feb', applications: 52, shortlisted: 24, interviews: 15 },
  { month: 'Mar', applications: 48, shortlisted: 22, interviews: 14 },
  { month: 'Apr', applications: 70, shortlisted: 35, interviews: 20 },
  { month: 'May', applications: 85, shortlisted: 40, interviews: 25 },
  { month: 'Jun', applications: 65, shortlisted: 30, interviews: 18 },
  { month: 'Jul', applications: 90, shortlisted: 45, interviews: 28 },
  { month: 'Aug', applications: 78, shortlisted: 38, interviews: 22 },
  { month: 'Sep', applications: 95, shortlisted: 50, interviews: 30 },
  { month: 'Oct', applications: 88, shortlisted: 42, interviews: 26 },
  { month: 'Nov', applications: 72, shortlisted: 36, interviews: 21 },
  { month: 'Dec', applications: 60, shortlisted: 28, interviews: 16 },
]

export const skillDemandData = [
  { skill: 'React', demand: 95, supply: 72 },
  { skill: 'TypeScript', demand: 88, supply: 65 },
  { skill: 'Python', demand: 92, supply: 80 },
  { skill: 'Node.js', demand: 78, supply: 60 },
  { skill: 'AWS', demand: 85, supply: 55 },
  { skill: 'Docker', demand: 70, supply: 45 },
  { skill: 'Machine Learning', demand: 82, supply: 35 },
  { skill: 'Go', demand: 65, supply: 25 },
]
