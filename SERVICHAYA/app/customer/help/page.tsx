import { CheckCircle2, CircleHelp, ClipboardList, CreditCard, LifeBuoy, MapPinned, MessageSquare, ShieldCheck, Star, UserCircle2 } from 'lucide-react'

const customerCapabilities = [
  {
    title: 'Discovery & trust',
    icon: ShieldCheck,
    points: [
      'Service categories with transparent starting prices',
      'Provider trust signals (ratings, verification, response speed)',
      'City/zone availability and ETA visibility',
    ],
  },
  {
    title: 'Booking & workflow',
    icon: ClipboardList,
    points: [
      'Guided request creation with clear required fields',
      'Dynamic status pipeline: pending → matched → in progress → completed',
      'Job detail pages with payment/review actions at right stages',
    ],
  },
  {
    title: 'Communication & support',
    icon: MessageSquare,
    points: [
      'Notification center with unread/read controls',
      'Structured support and escalation flow',
      'Post-service review loop to improve quality',
    ],
  },
]

const recommendedNext = [
  'In-app chat between customer and provider with moderation controls',
  'Smart rebooking for recurring services (weekly/monthly plans)',
  'Saved payment methods + invoice download + GST fields',
  'Loyalty & referral program for repeat customer retention',
  'NPS and quality analytics dashboard for customer success',
]

export default function CustomerHelpPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark border border-slate-800 text-white p-8">
        <p className="text-xs uppercase tracking-wide text-slate-300">Customer Success Hub</p>
        <h1 className="text-3xl font-bold mt-2">What we provide to customers</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
          This page captures current customer features and the next business-ready capabilities to build a strong end-to-end service experience.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {customerCapabilities.map((capability) => (
          <article key={capability.title} className="rounded-2xl border border-neutral-border bg-white p-5">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3">
              <capability.icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold">{capability.title}</h2>
            <ul className="mt-3 text-sm text-neutral-textSecondary space-y-2 list-disc list-inside">
              {capability.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-border bg-white p-6">
        <h2 className="text-xl font-bold inline-flex items-center gap-2"><CircleHelp className="w-5 h-5 text-primary-main" /> Workflow checklist for business operations</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
          {[
            ['Customer onboarding', 'Email/mobile verification, profile completion nudges'],
            ['Request intake quality', 'Mandatory scope + location + preferred schedule fields'],
            ['Matching & dispatch', 'Priority rules by emergency, distance and provider rating'],
            ['Execution tracking', 'Milestone updates with timestamp and audit trail'],
            ['Payment closure', 'Upfront/final payment status + receipt generation'],
            ['Quality loop', 'Ratings, issue flagging, support resolution SLA'],
          ].map(([label, detail]) => (
            <div key={label} className="rounded-xl border border-neutral-border p-4">
              <p className="font-semibold text-neutral-textPrimary">{label}</p>
              <p className="text-neutral-textSecondary mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary-main/20 bg-primary-main/[0.06] p-6">
        <h3 className="text-lg font-bold inline-flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-primary-main" /> Recommended next features to ship</h3>
        <ul className="mt-4 space-y-2 text-sm text-neutral-textSecondary list-disc list-inside">
          {recommendedNext.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: UserCircle2, text: 'Profile & trust' },
          { icon: MapPinned, text: 'Service area clarity' },
          { icon: CreditCard, text: 'Payments & invoices' },
          { icon: Star, text: 'Ratings & reviews' },
          { icon: CheckCircle2, text: 'Operational transparency' },
        ].map((item) => (
          <div key={item.text} className="rounded-xl border border-neutral-border bg-white p-4 text-center">
            <item.icon className="w-5 h-5 mx-auto text-primary-main mb-2" />
            <p className="text-xs font-semibold text-neutral-textSecondary">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
