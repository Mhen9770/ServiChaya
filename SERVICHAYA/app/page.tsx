'use client'

import Link from 'next/link'
import { ArrowRight, BadgeCheck, Clock3, MapPin, ShieldCheck, Sparkles, Star, Users } from 'lucide-react'

const categories = [
  { name: 'Electrical Repair', wait: '45 mins avg arrival', rating: '4.8' },
  { name: 'Plumbing Services', wait: '50 mins avg arrival', rating: '4.7' },
  { name: 'Home Deep Cleaning', wait: 'Scheduled slots', rating: '4.9' },
  { name: 'Appliance Setup', wait: 'Same day available', rating: '4.6' },
]

const metrics = [
  { label: 'Verified Providers', value: '2,500+' },
  { label: 'Requests Completed', value: '120K+' },
  { label: 'Average Rating', value: '4.8/5' },
  { label: 'Cities Covered', value: '35+' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SERVI<span className="text-primary-light">CHAYA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#trust" className="hover:text-white">Why us</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5">Sign in</Link>
            <Link href="/customer/jobs/create" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-lg bg-primary-main hover:bg-primary-light transition">Book a service</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -top-20 left-1/4 w-72 h-72 bg-primary-main/30 blur-3xl rounded-full" />
          <div className="absolute top-20 -right-20 w-72 h-72 bg-fuchsia-500/20 blur-3xl rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-orange" /> Customer-first home service platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Premium Home Services,
                <span className="text-primary-light"> Delivered Reliably.</span>
              </h1>
              <p className="mt-5 text-slate-300 max-w-xl">
                Discover trusted local professionals without creating an account first. Browse services,
                compare trust signals, and log in only when you are ready to place a booking.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/services" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100">
                  Explore services <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/25 hover:bg-white/10">
                  Continue with account
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-lg font-bold">{metric.value}</p>
                    <p className="text-[11px] text-slate-300">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <p className="text-xs font-semibold text-primary-main uppercase tracking-wide">Live category snapshot</p>
              <h2 className="text-2xl font-bold mt-2">What customers book most</h2>
              <div className="mt-6 space-y-3">
                {categories.map((category) => (
                  <div key={category.name} className="rounded-xl border border-slate-200 p-4 hover:border-primary-main/40 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{category.wait}</p>
                      </div>
                      <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star className="w-4 h-4 fill-current" /> {category.rating}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/services" className="mt-5 inline-flex items-center gap-2 text-sm text-primary-main font-semibold">
                Browse all categories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="how" className="bg-white text-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-wide text-primary-main font-semibold">How it works</p>
              <h2 className="text-3xl font-bold mt-2">Zero-friction journey for customers</h2>
            </div>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                { icon: MapPin, title: 'Share location & need', desc: 'Add requirement, preferred time and address details.' },
                { icon: Users, title: 'Get matched fast', desc: 'Our matching engine routes verified nearby professionals.' },
                { icon: BadgeCheck, title: 'Track, pay and review', desc: 'Get updates, close payment, and rate service quality.' },
              ].map((item, i) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-4"><item.icon className="w-5 h-5" /></div>
                  <p className="text-xs text-slate-500">Step {i + 1}</p>
                  <h3 className="font-bold mt-1">{item.title}</h3>
                  <p className="text-sm text-slate-600 mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
              <h3 className="text-2xl font-bold">Why customers prefer ServiChaya</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="inline-flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5" />Identity and profile checks for providers.</li>
                <li className="inline-flex gap-2"><Clock3 className="w-4 h-4 text-emerald-400 mt-0.5" />Reliable slots and emergency request handling.</li>
                <li className="inline-flex gap-2"><BadgeCheck className="w-4 h-4 text-emerald-400 mt-0.5" />Transparent status updates and post-service reviews.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-primary-light/30 bg-gradient-to-br from-primary-main/25 to-primary-dark/20 p-6">
              <p className="text-sm text-blue-100">Ready to experience it?</p>
              <h3 className="text-2xl font-bold mt-2">Book your first request in under 2 minutes.</h3>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/customer/jobs/create" className="px-5 py-3 rounded-xl bg-white text-primary-dark font-semibold">Start booking</Link>
                <Link href="/login" className="px-5 py-3 rounded-xl border border-white/30">Sign in / Register</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
