import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

const roleDashboardMap: Record<string, string> = {
  student: '/student/dashboard',
  company: '/company/dashboard',
  college: '/college/dashboard',
  admin: '/admin/dashboard',
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!email || !password) {
      setErrorMsg('Please enter both email and password')
      return
    }
    setIsLoading(true)
    try {
      const user = await login(email, password)
      const dashboard = roleDashboardMap[user.role] || '/student/dashboard'
      addToast({ title: 'Welcome back!', description: 'You have been signed in successfully', variant: 'success' })
      navigate(dashboard, { replace: true })
    } catch (err: any) {
      // Network error (server unreachable)
      if (err?.isNetworkError || err?.code === 'ERR_NETWORK' || err?.message === 'network_error') {
        setErrorMsg('Cannot connect to server. Please make sure the backend is running (cd backend && npm start).')
      } else {
        // Backend returned a proper error
        const message = err?.response?.data?.error?.message || err?.message || 'Invalid email or password.'
        setErrorMsg(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex" aria-label="Login page">
      {/* Left - Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8" aria-label="Go to home">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
                <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PlaceMux</span>
            </Link>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          <form className="space-y-4" aria-label="Sign in form" onSubmit={handleSignIn} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" placeholder="you@college.edu" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline" aria-label="Forgot password">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" disabled={isLoading} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 group" disabled={isLoading} aria-label="Sign in to your account">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11" disabled={isLoading} aria-label="Sign in with Google">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>
            <Button variant="outline" className="h-11" disabled={isLoading} aria-label="Sign in with GitHub">
              <svg className="mr-2 h-4 w-4" fill="#000" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </motion.div>
      </div>

      {/* Right - Graphic */}
      <aside className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 items-center justify-center p-12" aria-label="Feature highlights">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-md text-center">
          <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 shadow-2xl shadow-primary/30">
            <GraduationCap className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your placement journey starts here</h2>
          <p className="text-muted-foreground">
            Access your personalized dashboard, track applications, take assessments, and land your dream job.
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-left" aria-label="Benefits">
            {['AI-powered skill assessments', 'Smart job recommendations', 'Real-time application tracking'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </aside>
    </main>
  )
}
