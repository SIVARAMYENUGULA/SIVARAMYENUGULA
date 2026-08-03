import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { Save, Bell, Shield, Globe, Lock, Palette, Database } from 'lucide-react'

import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function AdminSettings() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const { addToast } = useToast()
  const [form, setForm] = useState({
    platformName: 'PlaceMux',
    supportEmail: 'support@placemux.com',
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    smtpHost: '',
    smtpPort: '587',
    fromEmail: 'noreply@placemux.com',
    fromName: 'PlaceMux',
    defaultLanguage: 'en',
    timezone: 'ist',
    twoFARequired: 'disabled',
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminService.getSettings()
        if (data) {
          setForm({
            platformName: data.platformName || 'PlaceMux',
            supportEmail: data.supportEmail || 'support@placemux.com',
            sessionTimeout: String(data.sessionTimeout || '60'),
            maxLoginAttempts: String(data.maxLoginAttempts || '5'),
            passwordMinLength: String(data.passwordMinLength || '8'),
            smtpHost: data.smtpHost || '',
            smtpPort: String(data.smtpPort || '587'),
            fromEmail: data.fromEmail || 'noreply@placemux.com',
            fromName: data.fromName || 'PlaceMux',
            defaultLanguage: data.defaultLanguage || 'en',
            timezone: data.timezone || 'ist',
            twoFARequired: data.twoFARequired || 'disabled',
          })
        }
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load settings')
      } finally {
        setPageLoading(false)
      }
    }
    fetchSettings()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleSave = async () => {
    try {
      await adminService.updateSettings({
        platformName: form.platformName,
        supportEmail: form.supportEmail,
        sessionTimeout: Number(form.sessionTimeout),
        maxLoginAttempts: Number(form.maxLoginAttempts),
        passwordMinLength: Number(form.passwordMinLength),
        smtpHost: form.smtpHost,
        smtpPort: Number(form.smtpPort),
        fromEmail: form.fromEmail,
        fromName: form.fromName,
        defaultLanguage: form.defaultLanguage,
        timezone: form.timezone,
        twoFARequired: form.twoFARequired,
      })
      addToast({ title: 'Settings Saved', description: 'Platform settings have been updated successfully', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save settings', variant: 'error' })
    }
  }

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const settingsNav = [
    { label: 'General', icon: Globe },
    { label: 'Security', icon: Shield },
    { label: 'Notifications', icon: Bell },
    { label: 'Appearance', icon: Palette },
    { label: 'Integrations', icon: Database },
    { label: 'API', icon: Lock },
  ]

  return (
    <main className="space-y-8" aria-label="Settings">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage platform configuration</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-purple-500 text-white" onClick={handleSave} aria-label="Save changes">
          <Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <nav aria-label="Settings categories" className="space-y-1 lg:col-span-1">
          <div className="space-y-1 sticky top-24">
            {settingsNav.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary/30" tabIndex={0} role="button" aria-label={item.label}>
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </div>
            ))}
          </div>
        </nav>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle id="general-title">General Settings</CardTitle></CardHeader>
            <CardContent aria-labelledby="general-title" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" value={form.platformName} onChange={e => updateField('platformName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" value={form.supportEmail} onChange={e => updateField('supportEmail', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLang">Default Language</Label>
                  <Select value={form.defaultLanguage} onValueChange={v => updateField('defaultLanguage', v)}>
                    <SelectTrigger id="defaultLang"><SelectValue placeholder="English" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={form.timezone} onValueChange={v => updateField('timezone', v)}>
                    <SelectTrigger id="timezone"><SelectValue placeholder="IST (UTC+5:30)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle id="security-title">Security Settings</CardTitle></CardHeader>
            <CardContent aria-labelledby="security-title" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input id="sessionTimeout" type="number" value={form.sessionTimeout} onChange={e => updateField('sessionTimeout', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input id="maxLoginAttempts" type="number" value={form.maxLoginAttempts} onChange={e => updateField('maxLoginAttempts', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Password Min Length</Label>
                  <Input id="passwordMinLength" type="number" value={form.passwordMinLength} onChange={e => updateField('passwordMinLength', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twoFA">2FA Required</Label>
                  <Select value={form.twoFARequired} onValueChange={v => updateField('twoFARequired', v)}>
                    <SelectTrigger id="twoFA"><SelectValue placeholder="Disabled" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle id="email-title">Email & Notifications</CardTitle></CardHeader>
            <CardContent aria-labelledby="email-title" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" value={form.smtpHost} onChange={e => updateField('smtpHost', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" type="number" value={form.smtpPort} onChange={e => updateField('smtpPort', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input id="fromEmail" value={form.fromEmail} onChange={e => updateField('fromEmail', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input id="fromName" value={form.fromName} onChange={e => updateField('fromName', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
