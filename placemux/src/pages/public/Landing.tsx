import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight, GraduationCap, Briefcase,
  Sparkles, Shield, Zap, CheckCircle,
  Menu, X, Brain, Target, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
}

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 },
}

export function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              PlaceMux
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-gradient-to-r from-primary to-purple-500 text-white">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

        <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
          {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>

        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-border/50 bg-background px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              <Link to="/features" className="text-sm py-2">Features</Link>
              <Link to="/pricing" className="text-sm py-2">Pricing</Link>
              <Link to="/about" className="text-sm py-2">About</Link>
              <Link to="/contact" className="text-sm py-2">Contact</Link>
              <div className="flex gap-3 pt-2">
                <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
                <Link to="/signup"><Button size="sm">Get Started</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="default" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              #1 Campus Placement Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Bridge the Gap Between
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Talent & Opportunity
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              PlaceMux connects students, colleges, and companies in one seamless platform.
              AI-powered skill assessments, smart job matching, and real-time placement analytics.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="xl" className="bg-gradient-to-r from-primary to-purple-500 text-white shadow-xl shadow-primary/25">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="xl">
                  Watch Demo <Play className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> 500+ Colleges
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> 10,000+ Companies
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> 50,000+ Placements
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="border-y border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by leading institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-30">
            {['IIT Bombay', 'IIT Delhi', 'BITS Pilani', 'NIT Trichy', 'IIM Ahmedabad', 'DTU'].map((name) => (
              <span key={name} className="text-lg font-bold text-foreground/60">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <Badge variant="default" className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Everything you need for placements</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From skill assessment to final placement, we provide tools for every stakeholder
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brain, title: 'AI Skill Assessment', description: 'Advanced analytics and skill assessment tools powered by AI to evaluate candidates objectively.' },
              { icon: Target, title: 'Smart Job Matching', description: 'Our algorithm matches the right talent with the right opportunities based on skills and preferences.' },
              { icon: Globe, title: 'Global Reach', description: 'Connect with companies and talent from across the globe on one unified platform.' },
              { icon: Shield, title: 'Verified Profiles', description: 'Blockchain-verified academic credentials and skill endorsements for complete trust.' },
              { icon: Zap, title: 'Real-time Analytics', description: 'Live placement dashboards and predictive analytics for data-driven decisions.' },
              { icon: Briefcase, title: 'End-to-end Management', description: 'From job posting to offer letter, manage the entire placement lifecycle.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                }}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { value: '50K+', label: 'Placements Done' },
              { value: '95%', label: 'Success Rate' },
              { value: '500+', label: 'Colleges' },
              { value: '10K+', label: 'Companies' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to transform placements?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of institutions and companies already using PlaceMux
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="xl" className="bg-gradient-to-r from-primary to-purple-500 text-white shadow-xl shadow-primary/25">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="xl">Talk to Sales</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12" aria-label="Site footer">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-bold">PlaceMux</span>
              </div>
              <p className="text-sm text-muted-foreground">Bridging talent and opportunity worldwide.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'About', 'Contact'] },
              { title: 'For', links: ['Students', 'Companies', 'Colleges'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-3 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2026 PlaceMux. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  )
}
