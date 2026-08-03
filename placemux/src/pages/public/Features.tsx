import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Brain, Target, Globe, Shield, Zap, Briefcase,
  BarChart3, Users, Sparkles,
  Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

const features = [
  { icon: Brain, title: 'AI Skill Assessment', description: 'Advanced ML-powered assessments that evaluate technical, aptitude, and soft skills with high accuracy.', color: 'from-purple-500 to-pink-500' },
  { icon: Target, title: 'Smart Job Matching', description: 'Our algorithm matches candidates to roles based on skills, experience, preferences, and cultural fit.', color: 'from-blue-500 to-cyan-500' },
  { icon: Globe, title: 'Global Placement Network', description: 'Connect with 10,000+ companies across the globe. Expand your reach beyond local opportunities.', color: 'from-green-500 to-emerald-500' },
  { icon: Shield, title: 'Verified Credentials', description: 'Blockchain-verified academic records and skill endorsements ensure trust and authenticity.', color: 'from-orange-500 to-red-500' },
  { icon: Zap, title: 'Real-time Analytics', description: 'Live dashboards with predictive analytics help colleges and companies make data-driven decisions.', color: 'from-yellow-500 to-orange-500' },
  { icon: Briefcase, title: 'End-to-end Management', description: 'Complete placement lifecycle management - from job posting to offer acceptance and onboarding.', color: 'from-indigo-500 to-purple-500' },
  { icon: BarChart3, title: 'Advanced Reporting', description: 'Comprehensive reports on placement trends, skill gaps, salary analysis, and industry demand.', color: 'from-pink-500 to-rose-500' },
  { icon: Users, title: 'Collaborative Hiring', description: 'Seamless collaboration between recruiters, hiring managers, and placement coordinators.', color: 'from-teal-500 to-cyan-500' },
]

export function FeaturesPage() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Go to home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
              <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PlaceMux</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-sm text-foreground font-medium" aria-current="page">Features</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
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

      <section className="pt-32 pb-20" aria-label="Features overview">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge variant="default" className="mb-4"><Sparkles className="h-3.5 w-3.5 mr-1" /> Features</Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Everything you need for <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">placement success</span></h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Powerful tools for students, companies, and colleges to streamline the entire placement process.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-0.5`}>
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12" aria-label="Site footer">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center text-sm text-muted-foreground">
          © 2026 PlaceMux. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
