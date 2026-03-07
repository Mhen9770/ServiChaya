import Link from 'next/link'
import { ArrowRight, HeartHandshake, Shield, Target, Zap } from 'lucide-react'

const pillars = [
  {
    icon: Shield,
    title: 'Trust by design',
    points: ['Provider onboarding & verification', 'Transparent ratings and reviews', 'Clear status visibility from booking to completion'],
  },
  {
    icon: Zap,
    title: 'Speed with reliability',
    points: ['Fast location-based matching', 'Emergency request support', 'Structured workflows for predictable outcomes'],
  },
  {
    icon: HeartHandshake,
    title: 'Customer-first support',
    points: ['Simple request creation', 'Fair, clear cost communication', 'Responsive resolution assistance'],
  },
]

export default function CustomerAboutPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-8">
        <p className="text-xs uppercase tracking-wide text-slate-300">About ServiChaya</p>
        <h1 className="text-3xl font-bold mt-2">A modern service marketplace for everyday home needs</h1>
        <p className="text-sm text-slate-300 mt-3 max-w-3xl">
          ServiChaya is built to make local service discovery and booking dependable. We connect customers to verified professionals,
          improve matching quality, and provide transparent journey tracking from request to review.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="bg-white rounded-2xl border border-neutral-border p-5">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3">
              <pillar.icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold">{pillar.title}</h2>
            <ul className="mt-3 text-sm text-neutral-textSecondary space-y-1 list-disc list-inside">
              {pillar.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-neutral-border p-6">
        <h2 className="text-xl font-bold inline-flex items-center gap-2"><Target className="w-5 h-5 text-primary-main" /> Customer journey blueprint</h2>
        <div className="grid md:grid-cols-4 gap-3 mt-4 text-sm">
          {[
            'Discover relevant categories on the public site',
            'Create request only when needed (login at action stage)',
            'Track live status, timeline and updates',
            'Complete payment and provide quality feedback',
          ].map((step, index) => (
            <div key={step} className="rounded-xl border border-neutral-border p-4">
              <p className="text-xs text-neutral-textSecondary">Stage {index + 1}</p>
              <p className="mt-1 font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary-main/20 bg-primary-main/[0.06] p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Next step to move ahead</h3>
          <p className="text-sm text-neutral-textSecondary">We can now design advanced personalization, provider comparison and AI-assisted service recommendations.</p>
        </div>
        <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-main text-white font-semibold">
          Start with a booking <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
