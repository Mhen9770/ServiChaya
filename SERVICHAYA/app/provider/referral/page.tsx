'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getOnboardingStatus, getReferralStats, type ProviderReferralStatsDto } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  Share2, Copy, QrCode, MessageSquare, Mail, 
  Users, TrendingUp, IndianRupee, Briefcase, 
  CheckCircle2, Link as LinkIcon
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProviderReferralPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProviderReferralStatsDto | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/referral')
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
      const data = await getReferralStats(status.providerId)
      setStats(data)
    } catch (e: any) {
      console.error('Failed to load referral stats', e)
      toast.error(e.response?.data?.message || 'Failed to load referral stats')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (stats?.shareableLink) {
      const fullLink = getFullShareableLink()
      navigator.clipboard.writeText(fullLink)
      setCopied(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getFullShareableLink = () => {
    if (!stats?.shareableLink) return ''
    // If it's already a full URL, return as is, otherwise make it absolute
    if (stats.shareableLink.startsWith('http')) {
      return stats.shareableLink
    }
    return `${window.location.origin}${stats.shareableLink}`
  }

  const handleShareWhatsApp = () => {
    if (stats?.shareableLink) {
      const fullLink = getFullShareableLink()
      const message = encodeURIComponent(
        `Join SERVICHAYA using my referral code: ${stats.referralCode}\n\n${fullLink}`
      )
      window.open(`https://wa.me/?text=${message}`, '_blank')
    }
  }

  const handleShareSMS = () => {
    if (stats?.shareableLink) {
      const fullLink = getFullShareableLink()
      const message = `Join SERVICHAYA using my referral code: ${stats.referralCode}\n\n${fullLink}`
      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
    }
  }

  const handleShareEmail = () => {
    if (stats?.shareableLink) {
      const fullLink = getFullShareableLink()
      const subject = encodeURIComponent('Join SERVICHAYA - Referral Invitation')
      const body = encodeURIComponent(
        `Hi,\n\nI'm inviting you to join SERVICHAYA, a platform for home services.\n\nUse my referral code: ${stats.referralCode}\n\nSign up here: ${fullLink}\n\nLooking forward to serving you!\n\nBest regards`
      )
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    }
  }

  // Generate QR code using a simple API (or use a library)
  const getQRCodeUrl = (text: string) => {
    const fullLink = text.startsWith('http') ? text : `${window.location.origin}${text}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullLink)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-300">Failed to load referral stats</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-full bg-primary-main/20 flex items-center justify-center border-2 border-primary-main/50">
            <Share2 className="w-6 h-6 text-primary-light" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Referral & Marketing</h1>
            <p className="text-sm text-slate-400">Bring customers to SERVICHAYA and grow your business</p>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-dark border-2 border-white/10 p-6 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Your Referral Code</p>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">{stats.referralCode}</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Share this code with your customers. When they sign up using your code, they'll be linked to you for priority matching.
              </p>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareSMS}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareEmail}
                  className="px-4 py-2 rounded-xl glass border border-white/20 hover:bg-white/10 text-white text-sm font-semibold flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="px-4 py-2 rounded-xl glass border border-white/20 hover:bg-white/10 text-white text-sm font-semibold flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </motion.button>
              </div>
            </div>
            {showQRCode && stats.shareableLink && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
              >
                <img
                  src={getQRCodeUrl(stats.shareableLink)}
                  alt="QR Code"
                  className="w-48 h-48"
                />
                <p className="text-xs text-center text-slate-300 mt-2">Scan to share</p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl glass-dark border-2 border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary-light" />
              <p className="text-sm text-slate-400">Total Referred</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalReferred}</p>
            <p className="text-xs text-slate-400 mt-1">Customers joined with your code</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl glass-dark border-2 border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <p className="text-sm text-slate-400">Active Customers</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeCustomers}</p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.conversionRate.toFixed(1)}% conversion rate
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl glass-dark border-2 border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <IndianRupee className="w-5 h-5 text-yellow-400" />
              <p className="text-sm text-slate-400">Earnings from Referrals</p>
            </div>
            <p className="text-3xl font-bold text-white">
              ₹{Math.round(stats.totalEarningsFromReferrals).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total from referred customers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl glass-dark border-2 border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-slate-400">Jobs from Referrals</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalJobsFromReferrals}</p>
            <p className="text-xs text-slate-400 mt-1">Completed jobs with referrals</p>
          </motion.div>
        </div>

        {/* Shareable Link Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl glass-dark border-2 border-white/10 p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary-light" />
            Shareable Link
          </h3>
          <div className="flex items-center gap-3 p-4 rounded-xl glass border border-white/10">
            <input
              type="text"
              value={getFullShareableLink()}
              readOnly
              className="flex-1 bg-transparent text-white text-sm focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light hover:from-primary-light hover:to-primary-main text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary-main/20"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </motion.button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Share this link with your customers. When they click and sign up, they'll automatically be linked to you.
          </p>
        </motion.section>

        {/* Tips Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl glass-dark border-2 border-primary-main/30 p-6 bg-primary-main/10"
        >
          <h3 className="text-lg font-bold text-white mb-4">💡 Tips to Grow Your Referrals</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-primary-light mt-1">•</span>
              <span>Share your referral code with existing customers after completing a job</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light mt-1">•</span>
              <span>Print QR codes on your business cards and vehicle stickers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light mt-1">•</span>
              <span>Share on social media (WhatsApp status, Facebook, Instagram)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light mt-1">•</span>
              <span>Offer a small discount or benefit to customers who refer others</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light mt-1">•</span>
              <span>Follow up with referred customers to ensure they complete their first job</span>
            </li>
          </ul>
        </motion.section>
    </div>
  )
}
