import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { addToast } = useToast()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!email) {
      setErrorMsg('Please enter your email address')
      return
    }
    setIsLoading(true)
    try {
      await apiClient.post('/auth/forgot-password', { email })
      setIsSent(true)
      addToast({ title: 'Reset Link Sent!', description: 'Check your email for password reset instructions', variant: 'success' })
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || 'Something went wrong. Please try again.'
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" aria-label="Reset link sent">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm space-y-6">
          <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            If an account exists for <strong>{email}</strong>, we've sent password reset instructions.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex" aria-label="Forgot password">
      <aside className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 items-center justify-center p-12" aria-label="Reset info">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Reset your password</h2>
          <p className="text-muted-foreground">Enter your email and we'll send you instructions to reset your password.</p>
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
            <h1 className="text-2xl font-bold">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mt-2">No worries, we'll send you reset instructions.</p>
          </div>

          <form className="space-y-4" aria-label="Reset password form" onSubmit={handleReset} noValidate>
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="resetEmail" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" disabled={isLoading} />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 group" disabled={isLoading} aria-label="Send reset link">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <>Send Reset Link <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group" aria-label="Back to sign in">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
