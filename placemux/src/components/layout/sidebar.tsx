import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, UserCircle, ScrollText, ClipboardCheck,
  History, Briefcase, FileText, Search, Users,
  Building2, GraduationCap, BarChart3, FileBarChart,
  Shield, Settings, ChevronLeft, LogOut,
  HandshakeIcon, LifeBuoy, Award, PlusCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import { jobService } from '@/services/job'
import { useState, useEffect } from 'react'

interface SidebarProps {
  open: boolean
  onToggle: () => void
  role: 'student' | 'company' | 'college' | 'admin'
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

const studentLinks: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Profile Builder', href: '/student/profile', icon: UserCircle },
  { label: 'Skill Passport', href: '/student/skills', icon: ScrollText },
  { label: 'Assessments', href: '/student/assessments', icon: ClipboardCheck },
  { label: 'Assessment History', href: '/student/assessment-history', icon: History },
  { label: 'Job Recommendations', href: '/student/jobs', icon: Briefcase },
  { label: 'Applications', href: '/student/applications', icon: FileText },
  { label: 'My Interviews', href: '/student/interviews', icon: HandshakeIcon },
  { label: 'My Offers', href: '/student/offers', icon: Award },
  { label: 'Settings', href: '/student/settings', icon: Settings },
  { label: 'Help & Support', href: '/student/support', icon: LifeBuoy },
]

const companyLinks: NavItem[] = [
  { label: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
  { label: 'Job Management', href: '/company/jobs', icon: Briefcase },
  { label: 'Candidate Search', href: '/company/candidates', icon: Search },
  { label: 'Hiring Pipeline', href: '/company/pipeline', icon: Users },
  { label: 'Create Assessment', href: '/company/assessment-create', icon: PlusCircle },
  { label: 'Assessment Assignments', href: '/company/assessment-assignments', icon: ClipboardCheck },
  { label: 'Assessment Tracking', href: '/company/assessment-tracking', icon: BarChart3 },
  { label: 'Assessment Analytics', href: '/company/assessment-analytics', icon: Award },
  { label: 'Assessment Results', href: '/company/assessment-results', icon: FileText },
  { label: 'Interview Management', href: '/company/interviews', icon: HandshakeIcon },
  { label: 'Offer Management', href: '/company/offers', icon: FileText },
]

const collegeLinks: NavItem[] = [
  { label: 'Dashboard', href: '/college/dashboard', icon: LayoutDashboard },
  { label: 'Student Tracking', href: '/college/students', icon: GraduationCap },
  { label: 'Drive Management', href: '/college/drives', icon: Briefcase },
  { label: 'Company Management', href: '/college/companies', icon: Building2 },
  { label: 'Analytics', href: '/college/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/college/reports', icon: FileBarChart },
]

const adminLinks: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', href: '/admin/users', icon: Users },
  { label: 'Company Management', href: '/admin/companies', icon: Building2 },
  { label: 'College Management', href: '/admin/colleges', icon: GraduationCap },
  { label: 'Audit Logs', href: '/admin/audit', icon: Shield },
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: LifeBuoy },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

// Student has settings/support in main nav; other roles keep bottom links
const bottomLinks: NavItem[] = []

const roleIcons: Record<string, React.ElementType> = {
  student: GraduationCap,
  company: Building2,
  college: GraduationCap,
  admin: Shield,
}

export function Sidebar({ open, onToggle, role }: SidebarProps) {
  const { user, logout } = useAuth()
  const [jobCount, setJobCount] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (role === 'student') {
      jobService.getRecommended().then(jobs => {
        setJobCount(String(jobs.length))
      }).catch(() => setJobCount(undefined))
    }
  }, [role])

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const links = {
    student: studentLinks.map(l => l.label === 'Job Recommendations' && jobCount ? { ...l, badge: jobCount } : l),
    company: companyLinks,
    college: collegeLinks,
    admin: adminLinks,
  }[role]

  const RoleIcon = roleIcons[role]

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={false}
        animate={{ width: open ? 260 : 72 }}
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/50 bg-sidebar'
        )}
      >
        {/* Logo */}
        <div className={cn('flex h-16 items-center gap-3 px-4', !open && 'justify-center')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
            <RoleIcon className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent whitespace-nowrap"
              >
                PlaceMux
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('absolute -right-3 top-16 h-6 w-6 rounded-full border border-border/50 bg-sidebar shadow-md', !open && 'hidden')}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    'hover:bg-sidebar-accent hover:text-foreground',
                    isActive
                      ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary'
                      : 'text-muted-foreground',
                    !open && 'justify-center px-2'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <link.icon className={cn('relative z-10 h-5 w-5 shrink-0', isActive && 'text-primary')} />
                    {open && (
                      <span className="relative z-10">{link.label}</span>
                    )}
                    {open && link.badge && (
                      <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-[10px] font-medium text-primary">
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {bottomLinks.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1">
                {bottomLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        'hover:bg-sidebar-accent hover:text-foreground',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                        !open && 'justify-center px-2'
                      )
                    }
                  >
                    <link.icon className="h-5 w-5 shrink-0" />
                    {open && <span>{link.label}</span>}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User area */}
        <div className={cn('border-t border-border/50 p-3', !open && 'flex justify-center')}>
          <div className={cn('flex items-center gap-3', !open && 'flex-col')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name?.toLowerCase().replace(/\s/g, '') || 'user'}`} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary to-purple-500 text-white">{initials}</AvatarFallback>
            </Avatar>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
              </div>
            )}
            {open && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { logout(); window.location.href = '/login' }}>
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
