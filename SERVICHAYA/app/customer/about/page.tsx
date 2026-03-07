import Link from 'next/link'
import { ArrowRight, HeartHandshake, Lightbulb, ShieldCheck, Target, Zap } from 'lucide-react'

const valuePillars = [
  {
    icon: ShieldCheck,
    title: 'Trust & quality governance',
    detail: 'Provider onboarding, profile checks, review signals and quality tracking create safer customer choices.',
  },
  {
    icon: Zap,
    title: 'Fast matching engine',
    detail: 'Location, service-type and availability-aware matching minimizes wait-time and boosts conversion.',
  },
  {
    icon: HeartHandshake,
    title: 'Support-led operations',
    detail: 'Customer journey support from booking to completion ensures reliable outcomes and repeat confidence.',
  },
]

const roadmap = [
  'Personalized service recommendations from booking history',
  'Provider comparison view with trust score and response SLA',
  'In-app chat + proactive ETA notifications for active jobs',
  'Retention engine with rebooking nudges and loyalty rewards',
]

export default function CustomerAboutPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white border border-slate-800 p-8">
        <p className="text-xs uppercase tracking-wide text-slate-300">About ServiChaya</p>
        <h1 className="text-3xl font-bold mt-2">Built for customer trust, speed and repeat satisfaction</h1>
        <p className="text-sm text-slate-300 mt-3 max-w-3xl">
          ServiChaya is a customer-first home services marketplace where users can discover, evaluate and book professionals with confidence.
          We are product-led on quality, conversion and retention.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {valuePillars.map((pillar) => (
          <article key={pillar.title} className="rounded-2xl border border-neutral-border bg-white p-5">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3">
              <pillar.icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold">{pillar.title}</h2>
            <p className="text-sm text-neutral-textSecondary mt-2">{pillar.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-border bg-white p-6">
        <h2 className="text-xl font-bold inline-flex items-center gap-2"><Target className="w-5 h-5 text-primary-main" /> Customer journey we optimize</h2>
        <div className="mt-4 grid md:grid-cols-4 gap-3 text-sm">
          {[
            'Discover service category and trust signals',
            'Create job only when ready to convert',
            'Track progress and updates in real-time',
            'Pay and review for quality loop closure',
          ].map((stage, index) => (
            <div key={stage} className="rounded-xl border border-neutral-border p-4">
              <p className="text-xs text-neutral-textSecondary">Stage {index + 1}</p>
              <p className="mt-1 font-medium">{stage}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-neutral-border bg-white p-6">
          <h3 className="text-lg font-bold inline-flex items-center gap-2"><Lightbulb className="w-5 h-5 text-accent-orange" /> Next growth roadmap</h3>
          <ul className="mt-4 text-sm text-neutral-textSecondary space-y-2 list-disc list-inside">
            {roadmap.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="rounded-2xl border border-primary-main/20 bg-primary-main/[0.06] p-6">
          <h3 className="text-lg font-bold">Ready to move ahead?</h3>
          <p className="text-sm text-neutral-textSecondary mt-2">Create a real request and we can then design the next conversion and retention layer for your customer funnel.</p>
          <Link href="/customer/jobs/create" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-main text-white px-4 py-2.5 font-semibold">
            Start a booking <ArrowRight className="w-4 h-4" />
          </Link>
        </article>
      </section>
    </div>
  )
}
