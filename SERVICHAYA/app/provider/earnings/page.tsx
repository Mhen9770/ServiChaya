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
          toast.info('Your profile is pending verification')
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
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Earnings</h1>
        <p className="text-sm text-neutral-textSecondary mt-1">Track your earnings and payouts</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-main" />
            </div>
            <div>
              <div className="text-xs text-neutral-textSecondary">Total Earnings</div>
              <div className="text-2xl font-bold text-primary-main">₹{summary.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-xs text-neutral-textSecondary">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">₹{summary.pendingEarnings.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <div className="text-xs text-neutral-textSecondary">Available for Withdrawal</div>
              <div className="text-2xl font-bold text-accent-green">₹{summary.paidEarnings.toLocaleString()}</div>
            </div>
          </div>
          {payoutLimits && summary.paidEarnings >= payoutLimits.minWithdrawal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPayoutModal(true)}
              className="w-full mt-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              <Wallet className="w-4 h-4" />
              Request Payout
            </motion.button>
          )}
          {payoutLimits && summary.paidEarnings < payoutLimits.minWithdrawal && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-yellow-800">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Minimum withdrawal: ₹{payoutLimits.minWithdrawal}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Payout Request Modal */}
      {showPayoutModal && payoutLimits && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4">Request Payout</h2>
            
            <div className="space-y-4">
              <div className="p-3 bg-neutral-background rounded-xl">
                <div className="text-xs text-neutral-textSecondary mb-1">Available Balance</div>
                <div className="text-2xl font-bold text-accent-green">₹{payoutLimits.availableBalance.toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
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
                  className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
                />
                <div className="text-xs text-neutral-textSecondary mt-1">
                  Min: ₹{payoutLimits.minWithdrawal} • Max: ₹{Math.min(payoutLimits.maxWithdrawal, payoutLimits.availableBalance)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-border rounded-xl text-sm font-semibold hover:bg-neutral-background transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayoutRequest}
                  disabled={payoutLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {payoutLoading ? 'Processing...' : 'Submit Request'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border"
      >
        <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display">Earnings History</h2>
        
        {earnings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-background rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-8 h-8 text-neutral-textSecondary" />
            </div>
            <p className="text-sm font-semibold text-neutral-textPrimary mb-1">No earnings yet</p>
            <p className="text-xs text-neutral-textSecondary">Your earnings will appear here after completing jobs</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {earnings.map((earning, index) => (
                <motion.div
                  key={earning.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-5 bg-gradient-to-r from-white to-neutral-background rounded-xl border border-neutral-border hover:border-primary-main/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-neutral-textPrimary">Job #{earning.jobId}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          earning.payoutStatus === 'PAID' 
                            ? 'bg-accent-green/20 text-accent-green' 
                            : earning.payoutStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-neutral-background text-neutral-textSecondary'
                        }`}>
                          {earning.payoutStatus === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {earning.payoutStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                          {earning.payoutStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                        <div className="p-3 bg-white rounded-xl border border-neutral-border">
                          <div className="text-neutral-textSecondary mb-1">Job Amount</div>
                          <div className="font-bold text-lg text-neutral-textPrimary">₹{earning.jobAmount.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-neutral-border">
                          <div className="text-neutral-textSecondary mb-1">Platform Commission ({earning.commissionPercentage}%)</div>
                          <div className="font-bold text-lg text-neutral-textPrimary">₹{earning.commissionAmount.toLocaleString()}</div>
                          <div className="text-xs text-neutral-textSecondary mt-1">
                            {((earning.commissionAmount / earning.jobAmount) * 100).toFixed(1)}% of job amount
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-accent-green/10 to-green-50 rounded-xl border border-accent-green/20">
                          <div className="text-neutral-textSecondary mb-1">Net Earnings</div>
                          <div className="font-bold text-lg text-accent-green">₹{earning.netEarnings.toLocaleString()}</div>
                        </div>
                      </div>
                      {earning.payoutDate && (
                        <div className="flex items-center gap-2 text-xs text-neutral-textSecondary">
                          <CheckCircle2 className="w-3 h-3 text-accent-green" />
                          <span>Paid on {new Date(earning.payoutDate).toLocaleDateString()}</span>
                          {earning.payoutTransactionId && (
                            <span className="ml-2">• Transaction: {earning.payoutTransactionId}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
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
      </motion.div>
    </div>
  )
}
