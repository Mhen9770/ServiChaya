'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Star,
  User,
  X,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react'
import Loader from '@/components/ui/Loader'
import { getCurrentUser } from '@/lib/auth'
import { getJobById, type JobDto } from '@/lib/services/job'
import { cancelJob } from '@/lib/services/jobStatus'
import { createReview, getJobReview, type ReviewDto } from '@/lib/services/review'
import { getPaymentSchedule, processPayment, type PaymentScheduleDto } from '@/lib/services/payment'
import { getProviderProfile, type ProviderProfileDto } from '@/lib/services/provider'
import { getSubCategoryById, type ServiceSubCategory } from '@/lib/services/service'
import { getCategoryById, type ServiceCategory } from '@/lib/services/service'

const statusOrder = ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED']

export default function CustomerJobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [job, setJob] = useState<JobDto | null>(null)
  const [payment, setPayment] = useState<PaymentScheduleDto | null>(null)
  const [review, setReview] = useState<ReviewDto | null>(null)
  const [provider, setProvider] = useState<ProviderProfileDto | null>(null)
  const [category, setCategory] = useState<ServiceCategory | null>(null)
  const [subCategory, setSubCategory] = useState<ServiceSubCategory | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5,
    qualityRating: 5,
    punctualityRating: 5,
    communicationRating: 5,
    valueRating: 5,
    reviewText: '',
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push(`/login?redirect=/customer/jobs/${jobId}`)
      return
    }
    if (Number.isNaN(jobId)) return
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const jobData = await getJobById(jobId)
      setJob(jobData)

      // Fetch category and subcategory
      if (jobData.serviceCategoryId) {
        const categoryData = await getCategoryById(jobData.serviceCategoryId).catch(() => null)
        setCategory(categoryData)
      }
      if (jobData.serviceSubCategoryId) {
        const subCategoryData = await getSubCategoryById(jobData.serviceSubCategoryId).catch(() => null)
        setSubCategory(subCategoryData)
      }

      if (jobData.providerId) {
        const providerData = await getProviderProfile(jobData.providerId).catch(() => null)
        setProvider(providerData)
      }

      if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(jobData.status)) {
        const paymentData = await getPaymentSchedule(jobData.id).catch(() => null)
        setPayment(paymentData)
      }

      if (jobData.status === 'COMPLETED') {
        const reviewData = await getJobReview(jobData.id).catch(() => null)
        setReview(reviewData)
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Job not found')
      } else {
        toast.error('Failed to load job details')
      }
    } finally {
      setLoading(false)
    }
  }

  const cancelCurrentJob = async () => {
    const user = getCurrentUser()
    if (!user || !job) return
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      setActionLoading(true)
      await cancelJob(job.id, user.userId, 'Customer cancelled', false)
      toast.success('Request cancelled successfully')
      await fetchData()
    } catch {
      toast.error('Unable to cancel request')
    } finally {
      setActionLoading(false)
    }
  }

  const submitReview = async () => {
    const user = getCurrentUser()
    if (!user || !job) return

    if (!reviewData.reviewText || reviewData.reviewText.trim().length < 10) {
      toast.error('Please add a detailed review (min 10 chars)')
      return
    }

    try {
      setActionLoading(true)
      await createReview(user.userId, { jobId: job.id, ...reviewData })
      toast.success('Review submitted')
      setShowReviewModal(false)
      setReviewData({ rating: 5, qualityRating: 5, punctualityRating: 5, communicationRating: 5, valueRating: 5, reviewText: '' })
      await fetchData()
    } catch {
      toast.error('Could not submit review')
    } finally {
      setActionLoading(false)
    }
  }

  const submitPayment = async () => {
    if (!job || !payment) return
    try {
      setActionLoading(true)
      await processPayment({ jobId: job.id, amount: payment.finalAmount, paymentMethod: 'UPI' })
      toast.success('Payment processed successfully')
      setShowPaymentModal(false)
      await fetchData()
    } catch {
      toast.error('Payment failed')
    } finally {
      setActionLoading(false)
    }
  }

  const progressPercentage = useMemo(() => {
    if (!job) return 0
    const idx = statusOrder.indexOf(job.status)
    if (idx < 0) return 0
    return Math.round((idx / (statusOrder.length - 1)) * 100)
  }, [job])

  if (loading) return <Loader fullScreen text="Loading request details..." />
  if (!job) {
    return <div className="px-6 py-6 text-white">Request not found. <Link href="/customer/jobs" className="text-primary-light hover:underline">Back to requests</Link></div>
  }

  const canCancel = ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status)
  const canPay = job.status === 'COMPLETED' && payment && !payment.finalPaid
  const canReview = job.status === 'COMPLETED' && !review

  return (
    <div className="px-6 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-primary-light transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to requests
        </Link>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white border border-slate-800 p-7"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-xs text-slate-300 uppercase tracking-wide">Request Detail</p>
            <h1 className="text-3xl font-bold mt-2">{job.title}</h1>
            <p className="text-sm text-slate-300 mt-2">{job.description}</p>
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">Code: {job.jobCode}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">Status: {job.status}</span>
              {job.isEmergency && (
                <span className="px-2.5 py-1 rounded-full bg-red-400/20 border border-red-300/30 text-red-100 inline-flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Emergency
                </span>
              )}
            </div>
          </div>
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="rounded-xl bg-white/10 border border-white/20 p-4 min-w-[220px]"
          >
            <p className="text-xs text-slate-300">Workflow progress</p>
            <p className="text-2xl font-bold mt-1">{progressPercentage}%</p>
            <div className="h-2 rounded-full bg-white/20 mt-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <h2 className="font-bold text-lg mb-4 text-white">Core details</h2>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <p className="inline-flex items-center gap-2 text-slate-300">
                <List className="w-4 h-4 text-primary-light" /> 
                Service: {category?.name || 'N/A'}
                {subCategory && ` - ${subCategory.name}`}
              </p>
              <p className="inline-flex items-center gap-2 text-slate-300"><CalendarClock className="w-4 h-4 text-primary-light" /> Preferred: {new Date(job.preferredTime).toLocaleString()}</p>
              <p className="inline-flex items-center gap-2 text-slate-300"><MapPin className="w-4 h-4 text-primary-light" /> {job.addressLine1}{job.addressLine2 ? `, ${job.addressLine2}` : ''}</p>
              <p className="inline-flex items-center gap-2 text-slate-300"><CircleDollarSign className="w-4 h-4 text-primary-light" /> Budget: ₹{(job.estimatedBudget || 0).toLocaleString()}</p>
              <p className="inline-flex items-center gap-2 text-slate-300"><CheckCircle2 className="w-4 h-4 text-accent-green" /> Current status: {job.status}</p>
            </div>
            {job.specialInstructions && (
              <div className="mt-4 rounded-xl glass border border-white/10 p-3 text-sm text-slate-300">
                <p className="font-semibold text-white mb-1">Special instructions</p>
                {job.specialInstructions}
              </div>
            )}
          </motion.article>

          {provider && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass-dark border border-white/10 p-6 hover:border-primary-main/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">Assigned provider</h2>
                <Link 
                  href={`/provider/${provider.id}`}
                  className="text-xs text-primary-light hover:text-primary-main inline-flex items-center gap-1"
                >
                  View profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <p className="inline-flex items-center gap-2 text-white font-medium">
                  <User className="w-4 h-4 text-primary-light" /> {provider.businessName || provider.providerType}
                </p>
                <p className="inline-flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-accent-green" /> Verification: {provider.verificationStatus}
                </p>
                <p className="inline-flex items-center gap-2 text-slate-300">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Rating: {provider.rating || 0} ({provider.ratingCount || 0} reviews)
                </p>
                <p className="inline-flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" /> Jobs done: {provider.totalJobsCompleted || 0}
                </p>
              </div>
              {provider.mobileNumber && (
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                  <a 
                    href={`tel:${provider.mobileNumber}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-primary-main/30 text-primary-light px-3 py-2 text-sm font-semibold hover:bg-primary-main/20 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  {provider.email && (
                    <a 
                      href={`mailto:${provider.email}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 text-white px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                </div>
              )}
            </motion.article>
          )}

          {review && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass-dark border border-white/10 p-6"
            >
              <h2 className="font-bold text-lg mb-3 text-white">Your review</h2>
              <p className="text-sm text-slate-300">Rating: {review.rating}/5</p>
              {review.reviewText && <p className="text-sm text-slate-300 mt-2">{review.reviewText}</p>}
            </motion.article>
          )}
        </div>

        <aside className="space-y-5">
          {payment && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass-dark border border-white/10 p-6"
            >
              <h2 className="font-bold text-lg mb-3 text-white">Payment summary</h2>
              <p className="text-sm text-slate-300">Type: {payment.paymentType}</p>
              <p className="text-sm text-slate-300">Total: ₹{payment.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-300">Final due: ₹{payment.finalAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-300">Status: {payment.paymentStatus}</p>
            </motion.article>
          )}

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <h2 className="font-bold text-lg mb-3 text-white">Actions</h2>
            <div className="space-y-2">
              {canCancel && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelCurrentJob} 
                  disabled={actionLoading} 
                  className="w-full rounded-xl border border-red-400/30 bg-red-500/20 text-red-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-red-500/30 transition-colors"
                >
                  Cancel request
                </motion.button>
              )}
              {canPay && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentModal(true)} 
                  className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                >
                  <CreditCard className="w-4 h-4" /> Pay now
                </motion.button>
              )}
              {canReview && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowReviewModal(true)} 
                  className="w-full rounded-xl glass border border-white/20 text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:border-primary-main/50 hover:bg-primary-main/10 transition-all"
                >
                  <MessageSquareText className="w-4 h-4" /> Write review
                </motion.button>
              )}
              {!canCancel && !canPay && !canReview && (
                <p className="text-sm text-slate-300 text-center py-4">No actions available at this time</p>
              )}
            </div>
          </motion.article>
        </aside>
      </section>

      {showPaymentModal && payment && (
        <Modal title="Confirm payment" onClose={() => setShowPaymentModal(false)}>
          <p className="text-sm text-slate-300 mb-4">You are about to pay ₹{payment.finalAmount.toLocaleString()} for this completed job.</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submitPayment} 
            disabled={actionLoading} 
            className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
          >
            {actionLoading ? 'Processing...' : 'Confirm payment'}
          </motion.button>
        </Modal>
      )}

      {showReviewModal && (
        <Modal title="Submit review" onClose={() => setShowReviewModal(false)}>
          <label className="block text-sm font-semibold mb-1 text-white">Overall rating (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={reviewData.rating}
            onChange={(e) => setReviewData((prev) => ({ ...prev, rating: Number(e.target.value) }))}
            className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm mb-3 text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50"
          />
          <label className="block text-sm font-semibold mb-1 text-white">Feedback</label>
          <textarea
            rows={4}
            value={reviewData.reviewText}
            onChange={(e) => setReviewData((prev) => ({ ...prev, reviewText: e.target.value }))}
            className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm mb-4 text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50"
            placeholder="Write your experience with service quality, punctuality and communication"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submitReview} 
            disabled={actionLoading} 
            className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
          >
            {actionLoading ? 'Submitting...' : 'Submit review'}
          </motion.button>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl glass-dark border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-white" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
