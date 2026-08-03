import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, ArrowRight, Building2, GraduationCap as GradIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

const roles = [
  { id: 'student' as const, label: 'Student', icon: GradIcon },
  { id: 'company' as const, label: 'Company', icon: Building2 },
  { id: 'college' as const, label: 'College', icon: GraduationCap },
]

export function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'company' | 'college'>('student')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { signup } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!firstName || !lastName || !email || !password) {
      setErrorMsg('Please fill in all required fields')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters')
      return
    }
    setIsLoading(true)
    try {
      const fullName = `${firstName} ${lastName}`.trim()
      await signup(fullName, email, password, selectedRole)

      // Send OTP for email verification
      try {
        const { default: apiClient } = await import('@/lib/api')
        await apiClient.post('/otp/send', { email, type: 'email_verification' })
      } catch {
        // OTP send failure shouldn't block navigation
      }

      addToast({ title: 'Account Created!', description: 'Please verify your email to continue.', variant: 'success' })
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, { replace: true })
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Registration failed. Please try again.'
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex" aria-label="Sign up page">
      <aside className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 items-center justify-center p-12" aria-label="Benefits">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Start your placement journey</h2>
          <p className="text-muted-foreground mb-8">Join thousands of students and companies already on PlaceMux.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {['AI Assessments', 'Smart Matching', 'Real-time Analytics', 'Verified Profiles'].map((f) => (
              <div key={f} className="rounded-xl border border-border/50 bg-card/50 p-4 text-sm font-medium">{f}</div>
            ))}
          </div>
        </motion.div>
      </aside>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8" aria-label="Go to home">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
                <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PlaceMux</span>
            </Link>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-2">Choose your role to get started</p>
          </div>

          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Select your role">
            {roles.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  disabled={isLoading}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:bg-primary/5',
                    isSelected ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20' : 'border-border/50'
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Sign up as ${role.label}`}
                >
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span className="text-xs font-medium">{role.label}</span>
                </button>
              )
            })}
          </div>

          <form className="space-y-4" aria-label="Sign up form" onSubmit={handleSignUp} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required aria-required="true" disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required aria-required="true" disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type="password" placeholder="Create a strong password (min 8 chars)" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" disabled={isLoading} />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 group" disabled={isLoading} aria-label="Create account">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11" disabled={isLoading} aria-label="Sign up with Google">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>
            <Button variant="outline" className="h-11" disabled={isLoading} aria-label="Sign up with GitHub">
              <svg className="mr-2 h-4 w-4" fill="#000" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </main>
  )
}
