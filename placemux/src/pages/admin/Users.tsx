import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/table'
import { useConfirm } from '@/components/shared/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { Users as UsersIcon, Trash2, Ban, CheckCircle, KeyRound, ShieldAlert } from 'lucide-react'

import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function AdminUsers() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [resetUser, setResetUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const { addToast } = useToast()
  const { confirm, ConfirmDialog: DeleteConfirm } = useConfirm()

  const fetchData = async () => {
    try {
      const result = await adminService.getUsers({ limit: 100 })
      setUsers(result.data || [])
      setTotal(result.pagination?.total || 0)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load users')
    }
  }

  useEffect(() => { fetchData() }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleToggleActive = async (id: string, name: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Deactivate' : 'Activate'
    const confirmed = await confirm(action + ' User', `Are you sure you want to ${action.toLowerCase()} "${name}"?`)
    if (confirmed) {
      try {
        await adminService.updateUser(id, { isActive: !currentStatus })
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u))
        addToast({ title: 'User Updated', description: `"${name}" ${action.toLowerCase()}d`, variant: 'success' })
      } catch (err: any) {
        addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to update user', variant: 'error' })
      }
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm('Delete User', `Are you sure you want to delete "${name}"? This cannot be undone.`)
    if (confirmed) {
      try {
        await adminService.deleteUser(id)
        setUsers(prev => prev.filter(u => u._id !== id))
        setTotal(prev => prev - 1)
        addToast({ title: 'User Deleted', description: `"${name}" has been removed`, variant: 'success' })
      } catch (err: any) {
        addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to delete user', variant: 'error' })
      }
    }
  }

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword || newPassword.length < 8) {
      addToast({ title: 'Validation Error', description: 'Password must be at least 8 characters', variant: 'error' })
      return
    }
    setResetting(true)
    try {
      const res = await adminService.resetUserPassword(resetUser._id, newPassword)
      addToast({ title: 'Password Reset', description: res.message || 'Password has been reset', variant: 'success' })
      setResetUser(null)
      setNewPassword('')
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to reset password', variant: 'error' })
    } finally {
      setResetting(false)
    }
  }

  const roles = [
    { label: 'Students', count: users.filter(u => u.role === 'student').length },
    { label: 'Companies', count: users.filter(u => u.role === 'company').length },
    { label: 'Colleges', count: users.filter(u => u.role === 'college').length },
    { label: 'Admins', count: users.filter(u => u.role === 'admin').length },
  ]

  return (
    <main className="space-y-8" aria-label="User management">
      <DeleteConfirm />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">User Management</h1><p className="text-muted-foreground mt-1">Manage all platform users</p></div>
      </div>

      <section aria-label="User statistics">
        <div className="grid gap-4 md:grid-cols-4">
          {roles.map((r) => (
            <Card key={r.label}><CardContent className="pt-6 flex items-center gap-3"><UsersIcon className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{r.count}</p><p className="text-xs text-muted-foreground">{r.label}</p></div></CardContent></Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="users-title">All Users ({total})</CardTitle></CardHeader>
        <CardContent aria-labelledby="users-title">
          {users.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No users found" description="Users will appear here once they register" />
          ) : (
            <DataTable data={users} columns={[
              {key:'name',header:'Name',sortable:true,render:(u: any)=><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">{(u.name||'?').split(' ').map((n:string)=>n[0]).join('')}</div><span className="font-medium">{u.name}</span></div>},
              {key:'email',header:'Email'},
              {key:'role',header:'Role',render:(u: any)=><Badge variant={u.role==='admin'?'destructive':u.role==='company'?'info':'secondary'} className="text-[10px]">{u.role}</Badge>},
              {key:'isActive',header:'Status',render:(u: any)=><Badge variant={u.isActive?'success':'secondary'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>},
              {key:'lastLoginAt',header:'Last Login',render:(u: any)=><span className="text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</span>},
              {key:'actions',header:'',render:(u: any)=><div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setResetUser(u)} title="Reset Password">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(u._id, u.name, u.isActive)} aria-label={u.isActive ? 'Deactivate' : 'Activate'}>
                  {u.isActive ? <Ban className="h-3.5 w-3.5 text-warning" /> : <CheckCircle className="h-3.5 w-3.5 text-success" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u._id, u.name)} aria-label={`Delete ${u.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>},
            ]} searchable searchPlaceholder="Search users..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetUser} onOpenChange={(open) => { if (!open) { setResetUser(null); setNewPassword('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for <strong>{resetUser?.name}</strong> ({resetUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/10 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">This will reset the user's password. They will be logged out and need to use the new password to log in.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">New Password *</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setResetUser(null); setNewPassword('') }}>Cancel</Button>
              <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 8}>
                {resetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
