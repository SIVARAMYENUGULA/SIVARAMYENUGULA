import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Bell,
  LogOut, CheckCheck,
  ChevronDown, Menu,
  Sun, Moon, User, Settings,
  MessageSquare, LayoutDashboard,
  Briefcase, ClipboardCheck,
  UserCircle, Sparkles, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommandDialog, Command, CommandGroup, CommandItem } from '@/components/ui/command'
import apiClient from '@/lib/api'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/lib/auth-context'

interface TopNavProps {
  onMenuClick?: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const { theme, toggleTheme } = useTheme()

  // Fetch real notifications from API when dropdown opens
  useEffect(() => {
    if (!notifOpen) return
    apiClient.get('/notifications')
      .then(res => {
        const data = res.data?.data
        if (data?.notifications) {
          setNotifications(data.notifications.map((n: any) => ({
            id: n._id,
            title: n.title || n.message?.substring(0, 50) || 'Notification',
            message: n.message || '',
            type: n.type || 'info',
            read: n.isRead || false,
            createdAt: n.createdAt || new Date().toISOString(),
          })))
        }
      })
      .catch(() => { /* silently handle - notifications are non-critical */ })
  }, [notifOpen])

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
  const firstName = user?.name?.split(' ')[0] || 'User'

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    apiClient.put('/notifications/read-all').catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    apiClient.put(`/notifications/${id}/read`).catch(() => {})
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:px-8">
        {/* Mobile menu */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <Button
          variant="outline"
          className="hidden sm:flex h-9 w-full max-w-sm items-center justify-start gap-2 rounded-lg border-border/50 bg-muted/30 text-sm text-muted-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span>Search anything...</span>
          <kbd className="ml-auto hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline-block">
            ⌘K
          </kbd>
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="p-0 text-base">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className={cn('flex flex-col items-start gap-1 rounded-none px-3 py-3 cursor-pointer', !notif.read && 'bg-primary/5')}
                      onClick={() => markRead(notif.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn('h-2 w-2 rounded-full shrink-0', notif.read ? 'bg-transparent' : 'bg-primary')} />
                        <span className="text-sm font-medium flex-1">{notif.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4">{notif.message}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative h-9 w-9 rounded-lg hover:bg-accent transition-colors flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name?.toLowerCase().replace(/\s/g, '') || 'user'}`} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-sm font-medium">{firstName}</span>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name || 'User'}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email || ''}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/${user?.role}/profile`)}>
                <User className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/${user?.role}/settings`)}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/${user?.role}/support`)}>
                <MessageSquare className="h-4 w-4 mr-2" /> Help & Support
              </DropdownMenuItem>                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/${user?.role}/notifications`)}>
                    <Bell className="h-4 w-4 mr-2" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => { logout(); navigate('/login') }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <Command
          placeholder="Type a command or search..."
          onSearch={(val) => console.log('Search:', val)}
        >
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setSearchOpen(false); navigate('/student/dashboard') }}>
              <LayoutDashboard className="h-4 w-4 mr-2" /> Go to Dashboard
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); navigate('/student/jobs') }}>
              <Briefcase className="h-4 w-4 mr-2" /> Browse Jobs
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); navigate('/student/assessments') }}>
              <ClipboardCheck className="h-4 w-4 mr-2" /> Take Assessment
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); navigate('/student/profile') }}>
              <UserCircle className="h-4 w-4 mr-2" /> Edit Profile
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => { setSearchOpen(false); navigate('/features') }}>
              <Sparkles className="h-4 w-4 mr-2" /> Features
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); navigate('/pricing') }}>
              <DollarSign className="h-4 w-4 mr-2" /> Pricing
            </CommandItem>
          </CommandGroup>
        </Command>
      </CommandDialog>
    </>
  )
}
