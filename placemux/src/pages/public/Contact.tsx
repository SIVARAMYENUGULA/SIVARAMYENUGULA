import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin, Phone, Send, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export function ContactPage() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Go to home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
              <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PlaceMux</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/contact" className="text-sm text-foreground font-medium" aria-current="page">Contact</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm">Get Started</Button></Link>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <section className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge variant="default" className="mb-4">Contact</Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Get in <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">touch</span></h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Have questions? We'd love to hear from you. Send us a message and we'll respond shortly.</p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-2 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-sm text-muted-foreground">hello@placemux.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Office</h3>
                    <p className="text-sm text-muted-foreground">123 Innovation Drive, San Francisco, CA 94105</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <textarea className="flex min-h-[120px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Tell us about your inquiry..." />
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25">
                  <Send className="h-4 w-4 mr-2" /> Send Message
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12" aria-label="Site footer">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center text-sm text-muted-foreground">© 2026 PlaceMux. All rights reserved.</div>
      </footer>
    </div>
  )
}
