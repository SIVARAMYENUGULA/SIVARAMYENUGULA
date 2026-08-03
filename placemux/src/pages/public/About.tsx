import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GraduationCap, ArrowRight, Menu, X, Target, Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export function AboutPage() {
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
            <Link to="/about" className="text-sm text-foreground font-medium" aria-current="page">About</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
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
            <Badge variant="default" className="mb-4">About Us</Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">We're on a mission to <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">transform placements</span></h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">PlaceMux was founded in 2025 with a simple vision: make the placement process seamless, fair, and data-driven for everyone.</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto mb-20">
            {[
              { icon: Target, title: 'Our Mission', desc: 'Democratize access to opportunities by connecting the right talent with the right employers through intelligent matching.' },
              { icon: Eye, title: 'Our Vision', desc: 'A world where every student finds their dream career, every company finds their ideal talent, and every college maximizes placements.' },
              { icon: Heart, title: 'Our Values', desc: 'Transparency, innovation, and inclusivity drive everything we do. We believe in data-driven decisions and equal opportunities.' },
            ].map((item) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-2xl font-bold mb-4">Join us in shaping the future of placements</h2>
            <Link to="/signup"><Button size="xl" className="bg-gradient-to-r from-primary to-purple-500 text-white shadow-xl shadow-primary/25">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12" aria-label="Site footer">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center text-sm text-muted-foreground">© 2026 PlaceMux. All rights reserved.</div>
      </footer>
    </div>
  )
}
