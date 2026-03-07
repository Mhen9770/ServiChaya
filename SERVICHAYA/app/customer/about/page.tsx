import Link from 'next/link'
import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles, TimerReset, Users2 } from 'lucide-react'

const values = [
  {
    icon: ShieldCheck,
    title: 'Verified & trusted providers',
    description: 'Every provider goes through onboarding, profile verification and skill mapping before being listed.',
  },
  {
    icon: TimerReset,
    title: 'Fast matching engine',
    description: 'Jobs are matched using location, skill and availability for quicker response times.',
  },
  {
    icon: HeartHandshake,
    title: 'Customer-first support',
    description: 'From booking to completion, we provide transparent updates and responsive issue handling.',
  },
]

export default function CustomerAboutPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl p-8 text-white bg-gradient-to-r from-primary-dark via-primary-main to-primary-light">
        <p className="text-xs uppercase tracking-wide text-blue-100 mb-2">About ServiChaya</p>
        <h1 className="text-3xl font-bold mb-3">A reliable home services marketplace built for Indian cities</h1>
        <p className="max-w-3xl text-sm text-blue-100">
          ServiChaya connects customers with skilled local professionals across essential categories like electrical,
          plumbing, cleaning, appliance repair and more.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {values.map((value) => (
          <article key={value.title} className="bg-white border border-neutral-border rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3">
              <value.icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold mb-2">{value.title}</h2>
            <p className="text-sm text-neutral-textSecondary">{value.description}</p>
          </article>
        ))}
      </section>

      <section className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-3">How the customer journey works</h2>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          {[
            'Create a job request with time, budget and location',
            'Get matched with service providers nearby',
            'Track live updates and communicate clearly',
            'Pay securely and leave a review after completion',
          ].map((step, index) => (
            <div key={step} className="rounded-xl border border-neutral-border p-4">
              <p className="text-xs text-neutral-textSecondary mb-1">Step {index + 1}</p>
              <p className="font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-3 inline-flex items-center gap-2"><Users2 className="w-5 h-5 text-primary-main" />Who we serve</h3>
          <ul className="space-y-2 text-sm text-neutral-textSecondary list-disc list-inside">
            <li>Households needing trusted local professionals</li>
            <li>Busy working families who need reliable scheduling</li>
            <li>Recurring service users who value transparent records</li>
          </ul>
        </div>

        <div className="bg-white border border-neutral-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-3 inline-flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent-orange" />Move ahead with us</h3>
          <p className="text-sm text-neutral-textSecondary mb-4">
            Next, we can enhance personalized recommendations, richer provider profiles and in-app communication to make your customer funnel even stronger.
          </p>
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 text-primary-main font-semibold">
            Start by creating a service request <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
