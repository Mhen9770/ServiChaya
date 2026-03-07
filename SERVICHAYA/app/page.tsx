'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageSquareQuote,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'

const quickCategories = [
  { name: 'Electrician', price: 'From ₹299', eta: '45 min', rating: '4.8' },
  { name: 'Plumber', price: 'From ₹349', eta: '50 min', rating: '4.7' },
  { name: 'Deep Cleaning', price: 'From ₹1,499', eta: 'Same day', rating: '4.9' },
  { name: 'AC Service', price: 'From ₹599', eta: '90 min', rating: '4.8' },
]

const trustStats = [
  { value: '2,500+', label: 'Verified Providers' },
  { value: '120K+', label: 'Completed Bookings' },
  { value: '4.8/5', label: 'Average Rating' },
  { value: '35+', label: 'Cities' },
]

const testimonials = [
  {
    name: 'Ritika Sharma',
    city: 'Indore',
    quote: 'I posted a request in under 2 minutes and got a great electrician quickly. Super smooth experience.',
  },
  {
    name: 'Amit Jain',
    city: 'Bhopal',
    quote: 'Clear pricing, verified providers, and timely service. This is exactly what local services needed.',
  },
  {
    name: 'Sneha Verma',
    city: 'Gwalior',
    quote: 'I liked that I could browse everything first and only logged in when I was ready to book.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <header className="sticky top-0 z-50 bg-[#070B14]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SERVI<span className="text-primary-light">CHAYA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            <a href="#categories" className="hover:text-white transition">Categories</a>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
            <a href="#testimonials" className="hover:text-white transition">Customer Stories</a>
            <a href="#trust" className="hover:text-white transition">Trust</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5">Sign in</Link>
            <Link href="/customer/jobs/create" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-lg bg-primary-main hover:bg-primary-light transition">Book Now</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary-main/30 blur-3xl" />
          <div className="absolute top-14 right-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid lg:grid-cols-[1.2fr_1fr] gap-10 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-orange" /> Browse first, login only when you book
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                India’s Trusted
                <span className="text-primary-light"> Home Service Marketplace</span>
              </h1>
              <p className="mt-5 max-w-2xl text-slate-300 text-base sm:text-lg">
                Explore verified local service professionals, compare trust signals, and place bookings with confidence.
                Designed for speed, transparency and repeat customer delight.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#categories" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100">
                  Explore Categories <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/30 hover:bg-white/10">
                  Start a Booking
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {trustStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[11px] text-slate-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100" id="categories">
              <p className="text-xs uppercase font-semibold text-primary-main tracking-wide">Top booked services</p>
              <h2 className="text-2xl font-bold mt-2">Popular right now</h2>
              <div className="mt-6 space-y-3">
                {quickCategories.map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 p-4 hover:border-primary-main/30 transition">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.price}</p>
                      </div>
                      <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star className="w-4 h-4 fill-current" /> {item.rating}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> ETA: {item.eta}</div>
                  </div>
                ))}
              </div>
              <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm text-primary-main font-semibold">
                Sign in to personalize recommendations <ArrowRight className="w-4 h-4" />
              </Link>
            </aside>
          </div>
        </section>

        <section id="how-it-works" className="bg-white text-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-wide text-primary-main font-semibold">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2">A customer journey designed for conversion</h2>
              <p className="text-sm text-slate-600 mt-3">Friction is removed from discovery to booking so more visitors become happy repeat customers.</p>
            </div>

            <div className="mt-8 grid md:grid-cols-4 gap-4">
              {[
                { icon: MapPin, title: 'Discover', desc: 'Browse categories and city availability.' },
                { icon: Shield, title: 'Evaluate', desc: 'Check provider trust and quality signals.' },
                { icon: Users, title: 'Book', desc: 'Create request with time, location and details.' },
                { icon: BadgeCheck, title: 'Complete', desc: 'Track progress, pay and review service.' },
              ].map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3"><step.icon className="w-5 h-5" /></div>
                  <p className="text-xs text-slate-500">Step {i + 1}</p>
                  <h3 className="font-bold mt-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 mt-2">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-16 bg-gradient-to-b from-[#070B14] to-[#0B1220]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold">What customers say</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {testimonials.map((item) => (
                <article key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <MessageSquareQuote className="w-5 h-5 text-primary-light mb-3" />
                  <p className="text-sm text-slate-200">“{item.quote}”</p>
                  <p className="mt-4 text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.city}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-2xl font-bold">Why customers choose ServiChaya</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>• Verified provider profiles with quality checks</li>
                <li>• Transparent status updates and service journey</li>
                <li>• Better repeat experience with stored customer context</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-primary-main/30 bg-primary-main/15 p-6">
              <p className="text-sm text-blue-100">Ready to convert this visitor into a customer?</p>
              <h3 className="text-2xl font-bold mt-2">Create a booking request now.</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/customer/jobs/create" className="px-5 py-3 rounded-xl bg-white text-primary-dark font-semibold">Start Booking</Link>
                <Link href="/login" className="px-5 py-3 rounded-xl border border-white/30">Sign in / Register</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
