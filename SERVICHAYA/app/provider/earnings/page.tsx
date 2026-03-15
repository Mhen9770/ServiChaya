'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getEarningsSummary, getEarningsHistory, getPayoutLimits, requestPayout, type EarningsDto, type EarningsSummaryDto, type PayoutLimitsDto } from '@/lib/services/payment'
import { getOnboardingStatus } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import { DollarSign, TrendingUp, Clock, CheckCircle2, ArrowRight, Wallet, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProviderEarningsPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<EarningsSummaryDto>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    totalJobs: 0,
    completedJobs: 0
  })
  const [earnings, setEarnings] = useState<EarningsDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [payoutLimits, setPayoutLimits] = useState<PayoutLimitsDto | null>(null)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER')
  const [payoutLoading, setPayoutLoading] = useState(false)

  const PAGE_SIZE = 10 // Max chunk 10 items

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/earnings')
      return
    }
    checkProviderStatus(currentUser.userId)
  }, [router])

  const checkProviderStatus = async (userId: number) => {
    try {
      setLoading(true)
      const status = await getOnboardingStatus(userId)
      if (!status.onboardingCompleted || status.profileStatus !== 'ACTIVE') {
        if (status.profileStatus === 'PENDING_VERIFICATION') {
          toast('Your profile is pending verification')
        } else {
          router.push('/provider/onboarding')
        }
        return
      }
      if (status.providerId) {
        fetchEarnings(status.providerId)
        fetchPayoutLimits(status.providerId)
      } else {
        toast.error('Provider ID not found')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Failed to check provider status:', error)
      const errorMsg = error.response?.data?.message || 'Failed to verify provider status'
      toast.error(errorMsg)
      router.push('/provider/onboarding')
    }
  }

  const fetchEarnings = async (providerId: number) => {
    try {
      setLoading(true)
      const [summaryData, earningsData] = await Promise.all([
        getEarningsSummary(providerId).catch((err) => {
          console.error('Failed to fetch earnings summary:', err)
          return { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalJobs: 0, completedJobs: 0 }
        }),
        getEarningsHistory(providerId, currentPage, PAGE_SIZE).catch((err) => {
          console.error('Failed to fetch earnings history:', err)
          return { content: [], totalElements: 0, totalPages: 0 }
        })
      ])
      setSummary(summaryData)
      setEarnings(earningsData.content || [])
      setTotalPages(earningsData.totalPages || 0)
      setTotalElements(earningsData.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch earnings:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load earnings'
      toast.error(errorMsg)
      setSummary({ totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalJobs: 0, completedJobs: 0 })
      setEarnings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPayoutLimits = async (providerId: number) => {
    try {
      const limits = await getPayoutLimits(providerId)
      setPayoutLimits(limits)
    } catch (error: any) {
      console.error('Failed to fetch payout limits:', error)
      // Set defaults if API fails
      setPayoutLimits({ minWithdrawal: 500, maxWithdrawal: 50000, availableBalance: summary.paidEarnings })
    }
  }

  const handlePayoutRequest = async () => {
    const user = getCurrentUser()
    if (!user || !payoutLimits) return

    const amount = parseFloat(payoutAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount < payoutLimits.minWithdrawal) {
      toast.error(`Minimum withdrawal amount is ₹${payoutLimits.minWithdrawal}`)
      return
    }

    if (amount > payoutLimits.maxWithdrawal) {
      toast.error(`Maximum withdrawal amount is ₹${payoutLimits.maxWithdrawal}`)
      return
    }

    if (amount > payoutLimits.availableBalance) {
      toast.error(`Insufficient balance. Available: ₹${payoutLimits.availableBalance}`)
      return
    }

    try {
      setPayoutLoading(true)
      const status = await getOnboardingStatus(user.userId)
      if (!status.providerId) {
        toast.error('Provider ID not found')
        return
      }

      await requestPayout(status.providerId, {
        amount,
        payoutMethod,
        bankAccountId: payoutMethod === 'BANK_TRANSFER' ? undefined : undefined, // TODO: Add bank account selection
        upiId: payoutMethod === 'UPI' ? undefined : undefined // TODO: Add UPI ID input
      })

      toast.success('Payout request submitted successfully')
      setShowPayoutModal(false)
      setPayoutAmount('')
      // Refresh earnings
      fetchEarnings(status.providerId)
      fetchPayoutLimits(status.providerId)
    } catch (error: any) {
      console.error('Payout request failed:', error)
      const errorMsg = error.response?.data?.message || 'Failed to submit payout request'
      toast.error(errorMsg)
    } finally {
      setPayoutLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const currentUser = getCurrentUser()
    if (currentUser) {
      getOnboardingStatus(currentUser.userId).then(status => {
        if (status.providerId) {
          fetchEarnings(status.providerId)
        }
      }).catch(() => {
        toast.error('Failed to verify provider status')
      })
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading earnings..." />
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-5 sm:p-6 lg:p-7 border-2 border-slate-700/50 shadow-xl shadow-slate-950/50"
      >
        <p className="text-xs uppercase tracking-wide text-slate-300">Financial Overview</p>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 sm:mt-3 leading-tight">Earnings & Payouts</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 sm:mt-3 leading-relaxed">Track your earnings, pending amounts, and request payouts</p>
      </motion.section>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-blue-400/30 p-4 sm:p-5 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/20 transition-all backdrop-blur-md"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-slate-300">Total Earnings</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">₹{summary.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-amber-400/30 p-4 sm:p-5 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/20 transition-all backdrop-blur-md"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-slate-300">Pending</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-300">₹{summary.pendingEarnings.toLocaleString()}</div>
            </div>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-accent-green/30 p-4 sm:p-5 hover:border-accent-green/60 hover:shadow-xl hover:shadow-accent-green/20 transition-all backdrop-blur-md"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-accent-green to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-accent-green/30">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-slate-300">Available for Withdrawal</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-accent-green">₹{summary.paidEarnings.toLocaleString()}</div>
            </div>
          </div>
          {payoutLimits && summary.paidEarnings >= payoutLimits.minWithdrawal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPayoutModal(true)}
              className="w-full mt-2 sm:mt-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent-green/50 transition-all"
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Request Payout</span>
              <span className="sm:hidden">Payout</span>
            </motion.button>
          )}
          {payoutLimits && summary.paidEarnings < payoutLimits.minWithdrawal && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-2.5 bg-amber-500/10 border border-amber-400/30 rounded-lg">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-amber-300">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span>Min: ₹{payoutLimits.minWithdrawal}</span>
              </div>
            </div>
          )}
        </motion.article>
      </section>

      {/* Payout Request Modal */}
      {showPayoutModal && payoutLimits && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/30 p-4 sm:p-6 max-w-md w-full backdrop-blur-md shadow-2xl shadow-black/50"
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Request Payout</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border-2 border-accent-green/30">
                <div className="text-[10px] sm:text-xs text-slate-300 mb-1">Available Balance</div>
                <div className="text-xl sm:text-2xl font-bold text-accent-green">₹{payoutLimits.availableBalance.toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  min={payoutLimits.minWithdrawal}
                  max={Math.min(payoutLimits.maxWithdrawal, payoutLimits.availableBalance)}
                  step="1"
                  placeholder={`Min: ₹${payoutLimits.minWithdrawal}, Max: ₹${Math.min(payoutLimits.maxWithdrawal, payoutLimits.availableBalance)}`}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl glass border-2 border-white/20 text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-primary-main/50 text-sm sm:text-base"
                />
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  Min: ₹{payoutLimits.minWithdrawal} • Max: ₹{Math.min(payoutLimits.maxWithdrawal, payoutLimits.availableBalance)}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl glass border-2 border-white/20 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-primary-main/50 text-sm sm:text-base"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 border-white/30 text-white text-xs sm:text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayoutRequest}
                  disabled={payoutLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-accent-green/50 transition-all"
                >
                  {payoutLoading ? 'Processing...' : 'Submit Request'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 lg:p-6 backdrop-blur-md shadow-lg shadow-black/20"
      >
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 font-display">Earnings History</h2>
        
        {earnings.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white mb-1">No earnings yet</p>
            <p className="text-[10px] sm:text-xs text-slate-300 px-4">Your earnings will appear here after completing jobs</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
              {earnings.map((earning, index) => {
                const statusColors = {
                  'PAID': { border: 'border-accent-green/40', bg: 'bg-accent-green/5' },
                  'PENDING': { border: 'border-amber-400/40', bg: 'bg-amber-500/5' },
                }
                const colors = statusColors[earning.payoutStatus as keyof typeof statusColors] || { border: 'border-slate-400/40', bg: 'bg-slate-500/5' }
                return (
                <motion.div
                  key={earning.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`p-4 sm:p-5 bg-slate-800/50 rounded-lg sm:rounded-xl border-2 ${colors.border} hover:${colors.bg} hover:shadow-lg transition-all backdrop-blur-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white">Job #{earning.jobId}</span>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold flex items-center gap-1 border ${
                          earning.payoutStatus === 'PAID' 
                            ? 'bg-accent-green/20 text-accent-green border-accent-green/50' 
                            : earning.payoutStatus === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                            : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                        }`}>
                          {earning.payoutStatus === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {earning.payoutStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                          {earning.payoutStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 sm:gap-4 text-[10px] sm:text-xs mb-2 sm:mb-3">
                        <div className="p-2 sm:p-3 bg-slate-900/50 rounded-lg sm:rounded-xl border border-white/5">
                          <div className="text-slate-400 mb-1">Job Amount</div>
                          <div className="font-bold text-base sm:text-lg text-white">₹{earning.jobAmount.toLocaleString()}</div>
                        </div>
                        <div className="p-2 sm:p-3 bg-slate-900/50 rounded-lg sm:rounded-xl border border-white/5">
                          <div className="text-slate-400 mb-1">Commission ({earning.commissionPercentage}%)</div>
                          <div className="font-bold text-base sm:text-lg text-white">₹{earning.commissionAmount.toLocaleString()}</div>
                          <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                            {((earning.commissionAmount / earning.jobAmount) * 100).toFixed(1)}% of job
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-accent-green/20 to-green-600/20 rounded-lg sm:rounded-xl border border-accent-green/30">
                          <div className="text-slate-300 mb-1">Net Earnings</div>
                          <div className="font-bold text-base sm:text-lg text-accent-green">₹{earning.netEarnings.toLocaleString()}</div>
                        </div>
                      </div>
                      {earning.payoutDate && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400 flex-wrap">
                          <CheckCircle2 className="w-3 h-3 text-accent-green flex-shrink-0" />
                          <span>Paid on {new Date(earning.payoutDate).toLocaleDateString()}</span>
                          {earning.payoutTransactionId && (
                            <span className="ml-1 sm:ml-2">• Txn: {earning.payoutTransactionId}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </motion.section>
    </div>
  )
}
