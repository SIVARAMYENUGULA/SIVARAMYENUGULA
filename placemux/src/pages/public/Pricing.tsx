import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  GraduationCap, CheckCircle, ArrowRight, Sparkles, Menu, X,
  Building2, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const plans = [
  {
    name: 'Starter', 
    price: 'Free',
    description: 'For students getting started with placements',
    icon: GraduationCap,
    features: ['AI skill assessments', 'Basic job matching', 'Profile builder', 'Up to 10 applications', 'Email support'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro', 
    price: '₹499',
    period: '/month',
    description: 'For serious job seekers and professionals',
    icon: Users,
    features: ['Everything in Starter', 'Unlimited applications', 'Advanced assessments', 'Priority matching', 'Interview preparation', 'Chat support', 'Skill endorsements'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise', 
    price: 'Custom',
    description: 'For colleges and companies',
    icon: Building2,
    features: ['Everything in Pro', 'Bulk student onboarding', 'Company branding', 'API access', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'Priority support'],
    cta: 'Contact Sales',
    popular: false,
  },
]

export function PricingPage() {
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
            <Link to="/pricing" className="text-sm text-foreground font-medium" aria-current="page">Pricing</Link>
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

      <section className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge variant="default" className="mb-4"><Sparkles className="h-3.5 w-3.5 mr-1" /> Pricing</Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Simple, transparent <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">pricing</span></h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Choose the plan that fits your needs. No hidden fees. No surprises.</p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const Icon = plan.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-8 transition-all',
                    plan.popular
                      ? 'border-primary/50 bg-gradient-to-b from-primary/[0.03] to-transparent shadow-xl shadow-primary/10 scale-105'
                      : 'border-border/50 bg-card hover:border-primary/30'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.popular ? '/signup' : plan.name === 'Enterprise' ? '/contact' : '/signup'}>
                    <Button
                      className={cn(
                        'w-full',
                        plan.popular ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25' : ''
                      )}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12" aria-label="Site footer">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center text-sm text-muted-foreground">
          © 2026 PlaceMux. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
