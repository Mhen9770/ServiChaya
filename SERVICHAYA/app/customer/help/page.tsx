'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, CircleHelp, ClipboardList, CreditCard, LifeBuoy, MapPinned, MessageSquare, ShieldCheck, Star, UserCircle2, ArrowRight } from 'lucide-react'

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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark border border-slate-800 text-white p-8"
      >
        <p className="text-xs uppercase tracking-wide text-slate-300">Customer Success Hub</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">What we provide to customers</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
          This page captures current customer features and the next business-ready capabilities to build a strong end-to-end service experience.
        </p>
      </motion.section>

      <section className="grid md:grid-cols-3 gap-4">
        {customerCapabilities.map((capability, index) => (
          <motion.article
            key={capability.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="rounded-2xl glass-dark border border-white/10 p-5 hover:border-primary-main/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-main/20 text-primary-light flex items-center justify-center mb-3">
              <capability.icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-white">{capability.title}</h2>
            <ul className="mt-3 text-sm text-slate-300 space-y-2 list-disc list-inside">
              {capability.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </motion.article>
        ))}
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-dark border border-white/10 p-6"
      >
        <h2 className="text-xl font-bold inline-flex items-center gap-2 text-white"><CircleHelp className="w-5 h-5 text-primary-light" /> Workflow checklist for business operations</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
          {[
            ['Customer onboarding', 'Email/mobile verification, profile completion nudges'],
            ['Request intake quality', 'Mandatory scope + location + preferred schedule fields'],
            ['Matching & dispatch', 'Priority rules by emergency, distance and provider rating'],
            ['Execution tracking', 'Milestone updates with timestamp and audit trail'],
            ['Payment closure', 'Upfront/final payment status + receipt generation'],
            ['Quality loop', 'Ratings, issue flagging, support resolution SLA'],
          ].map(([label, detail]) => (
            <div key={label} className="rounded-xl glass border border-white/10 p-4">
              <p className="font-semibold text-white">{label}</p>
              <p className="text-slate-300 mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-primary-main/30 bg-primary-main/20 p-6"
      >
        <h3 className="text-lg font-bold inline-flex items-center gap-2 text-primary-light"><LifeBuoy className="w-5 h-5" /> Recommended next features to ship</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-300 list-disc list-inside">
          {recommendedNext.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </motion.section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: UserCircle2, text: 'Profile & trust' },
          { icon: MapPinned, text: 'Service area clarity' },
          { icon: CreditCard, text: 'Payments & invoices' },
          { icon: Star, text: 'Ratings & reviews' },
          { icon: CheckCircle2, text: 'Operational transparency' },
        ].map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="rounded-xl glass-dark border border-white/10 p-4 text-center"
          >
            <item.icon className="w-5 h-5 mx-auto text-primary-light mb-2" />
            <p className="text-xs font-semibold text-slate-300">{item.text}</p>
          </motion.div>
        ))}
      </section>
    </div>
  )
}
