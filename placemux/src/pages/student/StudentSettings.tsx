import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { settingsService } from '@/services/settings'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { Save, Bell, Shield, User, Lock, Mail, Smartphone } from 'lucide-react'
import type { StudentSettings } from '@/services/settings'

export function StudentSettingsPage() {
  const { addToast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<StudentSettings | null>(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings()
        setSettings(data)
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

  const handleSaveNotifications = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await settingsService.updateSettings({ notifications: settings.notifications })
      setSettings(updated)
      addToast({ title: 'Settings Saved', description: 'Notification preferences updated', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await settingsService.updateSettings({ privacy: settings.privacy })
      setSettings(updated)
      addToast({ title: 'Settings Saved', description: 'Privacy settings updated', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await settingsService.updateSettings({ preferences: settings.preferences })
      setSettings(updated)
      addToast({ title: 'Settings Saved', description: 'Preferences updated', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({ title: 'Error', description: 'New passwords do not match', variant: 'error' })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      addToast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'error' })
      return
    }
    setChangingPassword(true)
    try {
      await settingsService.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      addToast({ title: 'Password Changed', description: 'Your password has been updated successfully', variant: 'success' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to change password', variant: 'error' })
    } finally {
      setChangingPassword(false)
    }
  }

  const updateNotification = (key: string, value: boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
  }

  const updatePrivacy = (key: string, value: boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      privacy: { ...settings.privacy, [key]: value },
    })
  }

  return (
    <main className="space-y-8" aria-label="Student settings">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="privacy"><Shield className="h-4 w-4 mr-2" /> Privacy</TabsTrigger>
          <TabsTrigger value="preferences"><User className="h-4 w-4 mr-2" /> Preferences</TabsTrigger>
          <TabsTrigger value="password"><Lock className="h-4 w-4 mr-2" /> Password</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch checked={settings?.notifications.emailNotifications} onCheckedChange={(v) => updateNotification('emailNotifications', v)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                  </div>
                  <Switch checked={settings?.notifications.pushNotifications} onCheckedChange={(v) => updateNotification('pushNotifications', v)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                  </div>
                  <Switch checked={settings?.notifications.smsNotifications} onCheckedChange={(v) => updateNotification('smsNotifications', v)} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-3">Alert Preferences</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Application Updates</span>
                    <Switch checked={settings?.notifications.applicationUpdates} onCheckedChange={(v) => updateNotification('applicationUpdates', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Interview Reminders</span>
                    <Switch checked={settings?.notifications.interviewReminders} onCheckedChange={(v) => updateNotification('interviewReminders', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assessment Reminders</span>
                    <Switch checked={settings?.notifications.assessmentReminders} onCheckedChange={(v) => updateNotification('assessmentReminders', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Job Alerts</span>
                    <Switch checked={settings?.notifications.jobAlerts} onCheckedChange={(v) => updateNotification('jobAlerts', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Marketing Emails</span>
                    <Switch checked={settings?.notifications.marketingEmails} onCheckedChange={(v) => updateNotification('marketingEmails', v)} />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Profile to Companies</p>
                  <p className="text-sm text-muted-foreground">Allow companies to view your profile</p>
                </div>
                <Switch checked={settings?.privacy.showProfileToCompanies} onCheckedChange={(v) => updatePrivacy('showProfileToCompanies', v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Email to Companies</p>
                  <p className="text-sm text-muted-foreground">Allow companies to see your email address</p>
                </div>
                <Switch checked={settings?.privacy.showEmailToCompanies} onCheckedChange={(v) => updatePrivacy('showEmailToCompanies', v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Phone to Companies</p>
                  <p className="text-sm text-muted-foreground">Allow companies to see your phone number</p>
                </div>
                <Switch checked={settings?.privacy.showPhoneToCompanies} onCheckedChange={(v) => updatePrivacy('showPhoneToCompanies', v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Resume Publicly</p>
                  <p className="text-sm text-muted-foreground">Make your resume visible to all companies</p>
                </div>
                <Switch checked={settings?.privacy.showResumePublicly} onCheckedChange={(v) => updatePrivacy('showResumePublicly', v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Skills Publicly</p>
                  <p className="text-sm text-muted-foreground">Make your skills visible on your profile</p>
                </div>
                <Switch checked={settings?.privacy.showSkillsPublicly} onCheckedChange={(v) => updatePrivacy('showSkillsPublicly', v)} />
              </div>
              <Button onClick={handleSavePrivacy} disabled={saving} className="gap-2 mt-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Account Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings?.preferences.language || 'en'}
                  onValueChange={(v) => setSettings(prev => prev ? { ...prev, preferences: { ...prev.preferences, language: v } } : prev)}
                >
                  <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="bn">Bengali</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings?.preferences.timezone || 'Asia/Kolkata'}
                  onValueChange={(v) => setSettings(prev => prev ? { ...prev, preferences: { ...prev.preferences, timezone: v } } : prev)}
                >
                  <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">India (IST, UTC+5:30)</SelectItem>
                    <SelectItem value="Asia/Dubai">UAE (GST, UTC+4)</SelectItem>
                    <SelectItem value="America/New_York">Eastern (EST, UTC-5)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT, UTC+0)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore (SGT, UTC+8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings?.preferences.theme || 'dark'}
                  onValueChange={(v) => setSettings(prev => prev ? { ...prev, preferences: { ...prev.preferences, theme: v } } : prev)}
                >
                  <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSavePreferences} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 8 chars)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword} className="gap-2">
                <Lock className="h-4 w-4" /> {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
