'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'

const featuredServices = [
  { name: 'Electrical Repair', eta: '45 mins avg arrival', rating: '4.8' },
  { name: 'Plumbing Services', eta: '50 mins avg arrival', rating: '4.7' },
  { name: 'Home Deep Cleaning', eta: 'Scheduled slots', rating: '4.9' },
  { name: 'Appliance Setup', eta: 'Same day available', rating: '4.6' },
]

const stats = [
  { value: '2,500+', label: 'Verified Providers' },
  { value: '120K+', label: 'Requests Completed' },
  { value: '4.8/5', label: 'Average Rating' },
  { value: '35+', label: 'Cities Covered' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#010B2A] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#010B2A]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold tracking-tight">
            SERVI<span className="text-primary-light">CHAYA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-sm text-slate-300">
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#why-us" className="hover:text-white transition">Why us</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold hover:bg-white/10 transition">Sign in</Link>
            <Link href="/customer/jobs/create" className="hidden sm:inline-flex rounded-full bg-primary-main px-5 py-2 text-sm font-semibold hover:bg-primary-light transition">Book a service</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-16 md:py-20" id="services">
          <div className="absolute -top-20 left-1/4 w-72 h-72 rounded-full bg-primary-main/30 blur-3xl" />
          <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full border border-white/20 bg-white/5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-orange" /> Customer-first home service platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Premium Home
                <br />
                Services, <span className="text-primary-light">Delivered</span>
                <br />
                <span className="text-primary-light">Reliably.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-slate-300 text-lg leading-relaxed">
                Discover trusted local professionals without creating an account first.
                Browse services, compare trust signals, and log in only when you are ready to place a booking.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-slate-100">
                  Explore services <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">
                  Continue with account
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-slate-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white text-slate-900 p-7 border border-slate-200 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-main">Live category snapshot</p>
              <h2 className="text-4xl font-bold mt-2">What customers book most</h2>
              <div className="mt-6 space-y-3">
                {featuredServices.map((service) => (
                  <div key={service.name} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-lg">{service.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{service.eta}</p>
                      </div>
                      <p className="inline-flex items-center gap-1 text-amber-600 font-semibold"><Star className="w-4 h-4 fill-current" /> {service.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/services" className="mt-5 inline-flex items-center gap-2 text-primary-main font-semibold">
                Browse all categories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white text-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-xs uppercase tracking-wide text-primary-main font-semibold">How it works</p>
            <h2 className="text-5xl font-bold mt-2">Zero-friction journey for customers</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                { title: 'Share location & need', desc: 'Add requirement, preferred time and address details.', icon: MapPin },
                { title: 'Get matched fast', desc: 'Our matching engine routes verified nearby professionals.', icon: Users },
                { title: 'Track, pay and review', desc: 'Get updates, close payment, and rate service quality.', icon: BadgeCheck },
              ].map((step, idx) => (
                <article key={step.title} className="rounded-2xl border border-slate-200 p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-4"><step.icon className="w-5 h-5" /></div>
                  <p className="text-xs text-slate-500">Step {idx + 1}</p>
                  <h3 className="text-2xl font-bold mt-1">{step.title}</h3>
                  <p className="text-base text-slate-600 mt-2">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="py-14 bg-[#010B2A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-5">
            <article className="rounded-2xl border border-white/15 bg-white/5 p-7">
              <h3 className="text-4xl font-bold">Why customers prefer ServiChaya</h3>
              <ul className="mt-5 space-y-3 text-lg text-slate-300">
                <li className="inline-flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" /> Identity and profile checks for providers.</li>
                <li className="inline-flex items-center gap-2"><Clock3 className="w-5 h-5 text-emerald-400" /> Reliable slots and emergency request handling.</li>
                <li className="inline-flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-emerald-400" /> Transparent status updates and post-service reviews.</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-primary-main/30 bg-primary-main/15 p-7">
              <p className="text-slate-200">Ready to experience it?</p>
              <h3 className="text-4xl font-bold mt-2">Book your first request in under 2 minutes.</h3>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/customer/jobs/create" className="rounded-xl bg-white text-primary-dark px-6 py-3 font-semibold">Start booking</Link>
                <Link href="/login" className="rounded-xl border border-white/30 px-6 py-3 font-semibold">Sign in / Register</Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
