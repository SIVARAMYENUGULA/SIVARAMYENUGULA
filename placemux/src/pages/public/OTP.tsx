import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowRight, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'

export function OTPPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.every(d => d !== '') && !isLoading && !isVerified) {
      handleVerify()
    }
  }, [otp]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    setErrorMsg(null)
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code')
      return
    }
    if (!email) {
      setErrorMsg('Email is missing. Please sign up again.')
      return
    }
    setIsLoading(true)
    setErrorMsg(null)
    try {
      await apiClient.post('/otp/verify', { email, otp: code, type: 'email_verification' })
      setIsVerified(true)
      addToast({ title: 'Email Verified!', description: 'Your account has been verified successfully', variant: 'success' })

      // Attempt auto-login — signup already returned a token stored by auth-context
      try {
        const token = localStorage.getItem('placemux_token')
        if (token) {
          const res = await apiClient.get('/auth/profile')
          const userData = res.data.data.user
          const roleDashboard: Record<string, string> = {
            student: '/student/dashboard',
            company: '/company/dashboard',
            college: '/college/dashboard',
            admin: '/admin/dashboard',
          }
          const dashboard = roleDashboard[userData.role] || '/student/dashboard'
          navigate(dashboard, { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      } catch {
        navigate('/login', { replace: true })
      }
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || 'Invalid or expired code. Please try again.'
      setErrorMsg(message)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    setErrorMsg(null)
    setCountdown(30)
    try {
      await apiClient.post('/otp/resend', { email, type: 'email_verification' })
      addToast({ title: 'Code Resent', description: 'A new verification code has been sent to your email', variant: 'info' })
    } catch {
      addToast({ title: 'Error', description: 'Failed to resend code. Please try again.', variant: 'error' })
      setCountdown(0)
    }
  }

  if (isVerified) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" aria-label="Verified">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm space-y-6">
          <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Email Verified!</h1>
          <p className="text-muted-foreground">Your account has been verified. Redirecting to your dashboard...</p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex" aria-label="OTP verification">
      <aside className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 items-center justify-center p-12" aria-label="Verification info">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Verify your identity</h2>
          <p className="text-muted-foreground">We've sent a 6-digit code to your email. Enter it below to verify your account.</p>
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
            <h1 className="text-2xl font-bold">Verify OTP</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {email ? `Enter the code sent to ${email}` : 'Enter the verification code'}
            </p>
          </div>

          <div className="flex justify-center gap-3" role="group" aria-label="One-time password input">
            {otp.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-14 text-center text-xl font-bold"
                aria-label={`Digit ${i + 1}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center">
              {errorMsg}
            </div>
          )}

          <Button className="w-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 group" onClick={handleVerify} disabled={isLoading || otp.some(d => !d)} aria-label="Verify email">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
            ) : (
              <>Verify Email <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
            )}
          </Button>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isLoading}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg px-3 py-1.5"
              aria-label="Resend verification code"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
