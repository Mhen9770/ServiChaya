import Link from 'next/link'
import { ArrowRight, Compass, HeartHandshake, ShieldCheck, Target, Users2 } from 'lucide-react'

export default function CustomerAboutPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-primary-dark to-primary-main text-white">
        <p className="text-xs uppercase tracking-wider text-blue-100 mb-2">About ServiChaya</p>
        <h1 className="text-3xl font-bold mb-3">We’re building trusted, transparent home services for every neighborhood.</h1>
        <p className="text-sm text-blue-100 max-w-3xl">Our platform connects customers to verified professionals with better matching, clear status updates and accountable service outcomes.</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, title: 'Trust & verification', desc: 'Provider onboarding includes profile checks and service capability mapping.' },
          { icon: Compass, title: 'Smart matching', desc: 'Location, skill and availability based matching for better response speed.' },
          { icon: HeartHandshake, title: 'Service accountability', desc: 'Track every stage, payment and review for clear service transparency.' },
        ].map((item) => (
          <article key={item.title} className="bg-white border border-neutral-border rounded-2xl p-5 shadow-sm">
            <item.icon className="w-6 h-6 text-primary-main mb-3" />
            <h2 className="font-bold mb-2">{item.title}</h2>
            <p className="text-sm text-neutral-textSecondary">{item.desc}</p>
          </article>
        ))}
      </section>

      <section className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Our mission for customers</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: Users2, title: 'Access', text: 'Reliable local services for every household.' },
            { icon: Target, title: 'Quality', text: 'Consistent service standards across categories.' },
            { icon: Compass, title: 'Control', text: 'Customers stay informed at every stage.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-neutral-border p-4 bg-slate-50">
              <item.icon className="w-5 h-5 text-primary-main mb-2" />
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-neutral-textSecondary mt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-2">What’s next</h3>
        <p className="text-sm text-neutral-textSecondary mb-4">Next we can implement deeper personalization: recommendations, richer provider cards, and better pre-booking quotes.</p>
        <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 font-semibold text-primary-main">
          Create your next request <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
