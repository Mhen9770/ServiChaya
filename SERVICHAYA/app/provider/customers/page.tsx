'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getOnboardingStatus, getProviderCustomers, type ProviderCustomerSummary } from '@/lib/services/provider'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Phone, Mail, Briefcase, IndianRupee, Star } from 'lucide-react'
import Link from 'next/link'
import { PageLoader } from '@/components/ui/Loader'

export default function ProviderCustomersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<ProviderCustomerSummary[]>([])
  const [filter, setFilter] = useState<'all' | 'referred' | 'highValue' | 'dormant'>('all')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/customers')
      return
    }
    if (currentUser.role !== 'SERVICE_PROVIDER') {
      router.push('/dashboard')
      return
    }
    loadData(currentUser.userId)
  }, [router])

  const loadData = async (userId: number) => {
    try {
      setLoading(true)
      const status = await getOnboardingStatus(userId)
      if (!status.providerId) {
        router.push('/provider/onboarding')
        return
      }
      const data = await getProviderCustomers(status.providerId)
      setCustomers(data)
    } catch (e) {
      console.error('Failed to load provider customers', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading your customers..." />
  }

  const referredCustomers = customers.filter(c => c.source === 'REFERRAL_CODE')
  const highValueCustomers = customers.filter(c => (c.totalEarningsFromCustomer || 0) >= 10000)
  // For now, dormant = no completed jobs
  const dormantCustomers = customers.filter(c => (c.completedJobsTogether || 0) === 0)

  const filteredCustomers =
    filter === 'referred'
      ? referredCustomers
      : filter === 'highValue'
      ? highValueCustomers
      : filter === 'dormant'
      ? dormantCustomers
      : customers

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <button
          type="button"
          onClick={() => router.push('/provider/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 hover:text-primary-light transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </button>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <Users className="w-4 h-4" />
          <span>{customers.length} customers</span>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-5 sm:p-6 lg:p-7 border-2 border-slate-700/50 shadow-xl shadow-slate-950/50"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-300">My Customers</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 leading-tight">
              Your personal customer network on SERVICHAYA
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Customers who joined with your code and customers you’ve already served, all in one place.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-xs sm:text-sm">
            <p className="font-semibold mb-1">Why this matters?</p>
            <p className="text-slate-200">
              Focus on these customers for repeat jobs, better ratings and low-cost growth.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Filters + summary */}
      {customers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/60 border border-white/15 px-3 py-2 text-[10px] sm:text-xs text-slate-200">
            <Users className="w-3.5 h-3.5" />
            <span>Total: {customers.length}</span>
            <span className="hidden sm:inline">• Referred: {referredCustomers.length}</span>
            <span className="hidden sm:inline">• High value: {highValueCustomers.length}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-primary-main text-white border-primary-main'
                  : 'bg-slate-800/60 text-slate-200 border-white/15 hover:bg-slate-700/70'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('referred')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                filter === 'referred'
                  ? 'bg-primary-main text-white border-primary-main'
                  : 'bg-slate-800/60 text-slate-200 border-white/15 hover:bg-slate-700/70'
              }`}
            >
              Referred
            </button>
            <button
              type="button"
              onClick={() => setFilter('highValue')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                filter === 'highValue'
                  ? 'bg-primary-main text-white border-primary-main'
                  : 'bg-slate-800/60 text-slate-200 border-white/15 hover:bg-slate-700/70'
              }`}
            >
              High value
            </button>
            <button
              type="button"
              onClick={() => setFilter('dormant')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                filter === 'dormant'
                  ? 'bg-primary-main text-white border-primary-main'
                  : 'bg-slate-800/60 text-slate-200 border-white/15 hover:bg-slate-700/70'
              }`}
            >
              Dormant
            </button>
          </div>
        </motion.div>
      )}

      {customers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-6 text-center backdrop-blur-md shadow-lg shadow-black/20"
        >
          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-400 mb-3 opacity-70" />
          <p className="text-sm sm:text-base font-semibold text-white mb-1">No customers yet</p>
          <p className="text-xs sm:text-sm text-slate-300 mb-4">
            Share your referral link from the dashboard to onboard your existing customers into SERVICHAYA.
          </p>
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all"
          >
            Go to dashboard
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 lg:p-6 backdrop-blur-md shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">Customer list</h2>
          </div>
          <div className="space-y-2.5 sm:space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => (
              <motion.div
                key={c.customerId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-800/40 border border-white/15 hover:border-primary-main/60 hover:bg-slate-800/70 transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-sm font-semibold shadow-md flex-shrink-0">
                    {c.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm sm:text-base font-semibold text-white">{c.name}</p>
                      {c.primaryForThisProvider && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-main/20 border border-primary-main/60 text-[10px] text-primary-light font-semibold">
                          <Star className="w-3 h-3" />
                          Primary
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/40 text-[10px] text-slate-200">
                        {c.source === 'REFERRAL_CODE' ? 'Referred by you' : 'From jobs'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-slate-300">
                      {c.mobileNumber && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {c.mobileNumber}
                        </span>
                      )}
                      {c.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-end sm:items-center justify-start sm:justify-end gap-3 text-[10px] sm:text-xs text-slate-300">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    <span className="font-semibold">{c.completedJobsTogether}/{c.totalJobsTogether}</span>
                    <span>jobs</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <IndianRupee className="w-3 h-3" />
                    <span className="font-semibold">
                      {Math.round(c.totalEarningsFromCustomer || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

