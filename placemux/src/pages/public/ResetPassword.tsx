import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { addToast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new password reset link.')
      return
    }
    if (!password) {
      setErrorMsg('Please enter a new password')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.post('/auth/reset-password', { token, password })
      setIsSuccess(true)
      addToast({ title: 'Password Reset!', description: 'Your password has been updated successfully', variant: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || 'Failed to reset password. The link may have expired.'
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" aria-label="Password reset success">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm space-y-6">
          <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Password Reset!</h1>
          <p className="text-muted-foreground">Your password has been updated successfully.</p>
          <Link to="/login">
            <Button className="bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25">
              Sign in with new password <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" aria-label="Reset password">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8" aria-label="Go to home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
              <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PlaceMux</span>
          </Link>
          <h1 className="text-2xl font-bold">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your new password below.</p>
        </div>

        <form className="space-y-4" aria-label="Reset password form" onSubmit={handleReset} noValidate>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                disabled={isLoading}
              />
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-required="true"
                disabled={isLoading}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 group" disabled={isLoading || !token} aria-label="Reset password">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting password...</>
            ) : (
              <>Reset Password <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
