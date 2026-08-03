import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/use-theme'
import { ToastContextProvider } from '@/hooks/use-toast'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RouteLoadingIndicator } from '@/components/shared/route-loading'

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

// Student Pages
import { StudentDashboard } from '@/pages/student/Dashboard'
import { StudentProfile } from '@/pages/student/Profile'
import { StudentSkills } from '@/pages/student/Skills'
import { StudentAssessments } from '@/pages/student/Assessments'
import { StudentAssessmentHistory } from '@/pages/student/AssessmentHistory'
import { StudentJobs } from '@/pages/student/Jobs'
import { StudentApplications } from '@/pages/student/Applications'

// Company Pages
import { CompanyDashboard } from '@/pages/company/Dashboard'
import { CompanyJobs } from '@/pages/company/Jobs'
import { CompanyCandidates } from '@/pages/company/Candidates'
import { CompanyPipeline } from '@/pages/company/Pipeline'
import { CompanyInterviews } from '@/pages/company/Interviews'

// College Pages
import { CollegeDashboard } from '@/pages/college/Dashboard'
import { CollegeStudents } from '@/pages/college/Students'
import { CollegeAnalytics } from '@/pages/college/Analytics'
import { CollegeReports } from '@/pages/college/Reports'

// Admin Pages
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminUsers } from '@/pages/admin/Users'
import { AdminCompanies } from '@/pages/admin/Companies'
import { AdminColleges } from '@/pages/admin/Colleges'
import { AdminAudit } from '@/pages/admin/Audit'
import { AdminSettings } from '@/pages/admin/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <ToastContextProvider>
        <ToastProvider>
          <BrowserRouter>
            <RouteLoadingIndicator />
            <ToastViewport />
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

              {/* Student Routes */}
              <Route element={<DashboardLayout role="student" />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/student/skills" element={<StudentSkills />} />
                <Route path="/student/assessments" element={<StudentAssessments />} />
                <Route path="/student/assessment-history" element={<StudentAssessmentHistory />} />
                <Route path="/student/jobs" element={<StudentJobs />} />
                <Route path="/student/applications" element={<StudentApplications />} />
              </Route>

              {/* Company Routes */}
              <Route element={<DashboardLayout role="company" />}>
                <Route path="/company/dashboard" element={<CompanyDashboard />} />
                <Route path="/company/jobs" element={<CompanyJobs />} />
                <Route path="/company/candidates" element={<CompanyCandidates />} />
                <Route path="/company/pipeline" element={<CompanyPipeline />} />
                <Route path="/company/interviews" element={<CompanyInterviews />} />
              </Route>

              {/* College Routes */}
              <Route element={<DashboardLayout role="college" />}>
                <Route path="/college/dashboard" element={<CollegeDashboard />} />
                <Route path="/college/students" element={<CollegeStudents />} />
                <Route path="/college/analytics" element={<CollegeAnalytics />} />
                <Route path="/college/reports" element={<CollegeReports />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<DashboardLayout role="admin" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/companies" element={<AdminCompanies />} />
                <Route path="/admin/colleges" element={<AdminColleges />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ToastContextProvider>
    </ThemeProvider>
  )
}
