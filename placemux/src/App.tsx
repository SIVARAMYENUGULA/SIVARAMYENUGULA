import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/use-theme'
import { AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ToastContextProvider } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/shared/toast-container'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedRoute } from '@/lib/protected-route'
import { RoleGuard } from '@/lib/role-guard'
import { ErrorBoundary } from '@/lib/error-boundary'

// Public Pages
import { LandingPage } from '@/pages/public/Landing'
import { FeaturesPage } from '@/pages/public/Features'
import { PricingPage } from '@/pages/public/Pricing'
import { AboutPage } from '@/pages/public/About'
import { ContactPage } from '@/pages/public/Contact'
import { LoginPage } from '@/pages/public/Login'
import { SignupPage } from '@/pages/public/Signup'
import { OTPPage } from '@/pages/public/OTP'
import { ForgotPasswordPage } from '@/pages/public/ForgotPassword'
import { ResetPasswordPage } from '@/pages/public/ResetPassword'

// Student Pages
import { StudentDashboard } from '@/pages/student/Dashboard'
import { StudentProfile } from '@/pages/student/Profile'
import { StudentSkills } from '@/pages/student/Skills'
import { StudentAssessments } from '@/pages/student/Assessments'
import { StudentAssessmentHistory } from '@/pages/student/AssessmentHistory'
import { StudentJobs } from '@/pages/student/Jobs'
import { StudentApplications } from '@/pages/student/Applications'
import { StudentOffers } from '@/pages/student/StudentOffers'
import { AssessmentDetail } from '@/pages/student/AssessmentDetail'
import { AssessmentRunner } from '@/pages/student/AssessmentRunner'
import { AssessmentResult } from '@/pages/student/AssessmentResult'
import { JobDetail } from '@/pages/student/JobDetail'
import { StudentMyInterviews } from '@/pages/student/MyInterviews'
import { StudentNotifications } from '@/pages/student/Notifications'
import { StudentSettingsPage } from '@/pages/student/StudentSettings'
import { StudentSupport } from '@/pages/student/Support'

// Company Pages
import { CompanyDashboard } from '@/pages/company/Dashboard'
import { CompanyJobs } from '@/pages/company/Jobs'
import { CompanyCandidates } from '@/pages/company/Candidates'
import { CompanyPipeline } from '@/pages/company/Pipeline'
import { CompanyInterviews } from '@/pages/company/Interviews'
import { CompanyOffers } from '@/pages/company/Offers'
import { AssessmentResults } from '@/pages/company/AssessmentResults'
import { AssessmentAssignments } from '@/pages/company/AssessmentAssignments'
import { AssessmentTracking } from '@/pages/company/AssessmentTracking'
import { AssessmentAnalyticsPage } from '@/pages/company/AssessmentAnalytics'
import { CompanyCreateAssessment } from '@/pages/company/CompanyCreateAssessment'

// College Pages
import { CollegeDashboard } from '@/pages/college/Dashboard'
import { CollegeStudents } from '@/pages/college/Students'
import { CollegeAnalytics } from '@/pages/college/Analytics'
import { CollegeReports } from '@/pages/college/Reports'
import { CollegeCompanies } from '@/pages/college/Companies'
import { CollegeDrives } from '@/pages/college/Drives'
import { DriveDetail } from '@/pages/college/DriveDetail'

// Admin Pages
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminUsers } from '@/pages/admin/Users'
import { AdminCompanies } from '@/pages/admin/Companies'
import { AdminColleges } from '@/pages/admin/Colleges'
import { AdminAudit } from '@/pages/admin/Audit'
import { AdminSettings } from '@/pages/admin/Settings'
import { AdminSupportTickets } from '@/pages/admin/SupportTickets'

function StudentRoutes() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <DashboardLayout role="student" />
    </RoleGuard>
  )
}

function CompanyRoutes() {
  return (
    <RoleGuard allowedRoles={['company']}>
      <DashboardLayout role="company" />
    </RoleGuard>
  )
}

function CollegeRoutes() {
  return (
    <RoleGuard allowedRoles={['college']}>
      <DashboardLayout role="college" />
    </RoleGuard>
  )
}

function AdminRoutes() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout role="admin" />
    </RoleGuard>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastContextProvider>
              <ToastContainer />
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/verify-otp" element={<OTPPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Student Routes */}
                  <Route element={<ProtectedRoute><StudentRoutes /></ProtectedRoute>}>
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/profile" element={<StudentProfile />} />
                    <Route path="/student/skills" element={<StudentSkills />} />
                    <Route path="/student/assessments" element={<StudentAssessments />} />
                    <Route path="/student/assessment-history" element={<StudentAssessmentHistory />} />
                    <Route path="/student/jobs" element={<StudentJobs />} />
                    <Route path="/student/applications" element={<StudentApplications />} />
                    <Route path="/student/assessments/:id" element={<AssessmentDetail />} />
                    <Route path="/student/assessments/:id/start" element={<AssessmentRunner />} />
                    <Route path="/student/assessments/:id/results" element={<AssessmentResult />} />
                    <Route path="/student/jobs/:id" element={<JobDetail />} />
                    <Route path="/student/notifications" element={<StudentNotifications />} />
                    <Route path="/student/interviews" element={<StudentMyInterviews />} />
                    <Route path="/student/offers" element={<StudentOffers />} />
                    <Route path="/student/settings" element={<StudentSettingsPage />} />
                    <Route path="/student/support" element={<StudentSupport />} />
                  </Route>

                  {/* Company Routes */}
                  <Route element={<ProtectedRoute><CompanyRoutes /></ProtectedRoute>}>
                    <Route path="/company/dashboard" element={<CompanyDashboard />} />
                    <Route path="/company/jobs" element={<CompanyJobs />} />
                    <Route path="/company/candidates" element={<CompanyCandidates />} />
                    <Route path="/company/pipeline" element={<CompanyPipeline />} />
                    <Route path="/company/interviews" element={<CompanyInterviews />} />
                    <Route path="/company/offers" element={<CompanyOffers />} />
                    <Route path="/company/assessment-results" element={<AssessmentResults />} />
                    <Route path="/company/assessment-assignments" element={<AssessmentAssignments />} />
                    <Route path="/company/assessment-create" element={<CompanyCreateAssessment />} />
                    <Route path="/company/assessment-tracking" element={<AssessmentTracking />} />
                    <Route path="/company/assessment-analytics" element={<AssessmentAnalyticsPage />} />
                  </Route>

                  {/* College Routes */}
                  <Route element={<ProtectedRoute><CollegeRoutes /></ProtectedRoute>}>
                    <Route path="/college/dashboard" element={<CollegeDashboard />} />
                    <Route path="/college/students" element={<CollegeStudents />} />
                    <Route path="/college/analytics" element={<CollegeAnalytics />} />
                    <Route path="/college/reports" element={<CollegeReports />} />
                    <Route path="/college/companies" element={<CollegeCompanies />} />
                    <Route path="/college/drives" element={<CollegeDrives />} />
                    <Route path="/college/drives/:id" element={<DriveDetail />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute><AdminRoutes /></ProtectedRoute>}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/companies" element={<AdminCompanies />} />
                    <Route path="/admin/colleges" element={<AdminColleges />} />
                    <Route path="/admin/audit" element={<AdminAudit />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/support-tickets" element={<AdminSupportTickets />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </ToastContextProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
