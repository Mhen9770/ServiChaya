'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Sparkles, Star, Users } from 'lucide-react'

const highlights = [
  { label: 'Active cities', value: '25+' },
  { label: 'Service professionals', value: '4,000+' },
  { label: 'Jobs completed', value: '120K+' },
  { label: 'Avg. rating', value: '4.8/5' },
]

const steps = [
  'Browse categories and compare options publicly.',
  'Login only when you want to request a service.',
  'Track job status, payment and review in one place.',
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-md backdrop-blur-xl' : 'bg-white/70 backdrop-blur-md'} border-b border-neutral-border/60`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
            ServiChaya
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold">
            <Link href="/services" className="hover:text-primary-main transition">Explore Services</Link>
            <a href="#how-it-works" className="hover:text-primary-main transition">How it works</a>
            <a href="#trust" className="hover:text-primary-main transition">Why trust us</a>
            <Link href="/login" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-main to-primary-dark text-white">Login</Link>
          </div>
          <Link href="/services" className="md:hidden text-sm px-3 py-2 rounded-lg bg-primary-main text-white">Services</Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-xs font-semibold border border-primary-main/15 mb-5">
              <Sparkles className="w-4 h-4 text-accent-orange" /> Home services marketplace for modern households
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5">
              Book trusted local services.
              <span className="block bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">Login only when needed.</span>
            </h1>
            <p className="text-lg text-neutral-textSecondary max-w-2xl mb-8">
              Discover providers, pricing direction and service categories on public pages. Create requests and manage jobs only when you decide to sign in.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-main text-white font-semibold">
                Explore Services <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login?redirect=/customer/jobs/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-neutral-border font-semibold text-primary-main">
                Request a Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-3 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {highlights.map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-neutral-border p-4 shadow-sm">
              <p className="text-2xl md:text-3xl font-bold text-primary-main">{item.value}</p>
              <p className="text-xs md:text-sm text-neutral-textSecondary mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-neutral-border p-7 md:p-10 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">How customer journey works</h2>
          <p className="text-sm text-neutral-textSecondary mb-6">Designed to keep browsing open and booking friction low.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((step, idx) => (
              <article key={step} className="rounded-2xl border border-neutral-border p-5 bg-slate-50">
                <p className="text-xs font-semibold text-primary-main mb-2">Step {idx + 1}</p>
                <p className="text-sm font-medium">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="container mx-auto px-4 pb-14">
        <div className="grid lg:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: 'Verified providers', text: 'Documented onboarding and quality checks before provider activation.' },
            { icon: Clock3, title: 'Live status updates', text: 'Track your request from pending to completion with clear status visibility.' },
            { icon: Users, title: 'Customer-first support', text: 'Support workflow built into the platform for rapid issue handling.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-neutral-border p-6 shadow-sm">
              <item.icon className="w-6 h-6 text-primary-main mb-3" />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-textSecondary">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-primary-dark via-primary-main to-primary-light text-white p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">Ready to experience better home service booking?</h3>
              <p className="text-blue-100 text-sm">Start public, login when required, and manage every job with confidence.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/services" className="px-5 py-2.5 rounded-xl bg-white text-primary-main font-semibold">Browse Services</Link>
              <Link href="/login" className="px-5 py-2.5 rounded-xl border border-white/40 font-semibold">Login / Register</Link>
            </div>
          </div>
          <div className="mt-5 text-xs text-blue-100 flex items-center gap-2"><Star className="w-4 h-4" /> Loved by thousands of families for reliability and transparency.</div>
        </div>
      </section>

      <footer className="border-t border-neutral-border bg-white">
        <div className="container mx-auto px-4 py-6 text-xs text-neutral-textSecondary flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} ServiChaya</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />Public browsing enabled • Login only on action flow</span>
        </div>
      </footer>
    </div>
  )
}
