'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
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
} from 'lucide-react'
import Loader from '@/components/ui/Loader'
import { getCurrentUser } from '@/lib/auth'
import { getJobById, type JobDto } from '@/lib/services/job'
import { cancelJob } from '@/lib/services/jobStatus'
import { createReview, getJobReview, type ReviewDto } from '@/lib/services/review'
import { getPaymentSchedule, processPayment, type PaymentScheduleDto } from '@/lib/services/payment'
import { getProviderProfile, type ProviderProfileDto } from '@/lib/services/provider'

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
    return <div className="px-6 py-6">Request not found. <Link href="/customer/jobs" className="text-primary-main">Back to requests</Link></div>
  }

  const canCancel = ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status)
  const canPay = job.status === 'COMPLETED' && payment && !payment.finalPaid
  const canReview = job.status === 'COMPLETED' && !review

  return (
    <div className="px-6 py-6 space-y-6">
      <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main">
        <ArrowLeft className="w-4 h-4" /> Back to requests
      </Link>

      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white border border-slate-800 p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-slate-300 uppercase tracking-wide">Request Detail</p>
            <h1 className="text-3xl font-bold mt-2">{job.title}</h1>
            <p className="text-sm text-slate-300 mt-2">{job.description}</p>
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">Code: {job.jobCode}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">Status: {job.status}</span>
              {job.isEmergency && <span className="px-2.5 py-1 rounded-full bg-red-400/20 border border-red-300/30 text-red-100 inline-flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Emergency</span>}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4 min-w-[220px]">
            <p className="text-xs text-slate-300">Workflow progress</p>
            <p className="text-2xl font-bold mt-1">{progressPercentage}%</p>
            <div className="h-2 rounded-full bg-white/20 mt-3 overflow-hidden"><div className="h-full bg-white" style={{ width: `${progressPercentage}%` }} /></div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <article className="rounded-2xl border border-neutral-border bg-white p-6">
            <h2 className="font-bold text-lg mb-4">Core details</h2>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <p className="inline-flex items-center gap-2 text-neutral-textSecondary"><CalendarClock className="w-4 h-4" /> Preferred: {new Date(job.preferredTime).toLocaleString()}</p>
              <p className="inline-flex items-center gap-2 text-neutral-textSecondary"><MapPin className="w-4 h-4" /> {job.addressLine1}{job.addressLine2 ? `, ${job.addressLine2}` : ''}</p>
              <p className="inline-flex items-center gap-2 text-neutral-textSecondary"><CircleDollarSign className="w-4 h-4" /> Budget: ₹{(job.estimatedBudget || 0).toLocaleString()}</p>
              <p className="inline-flex items-center gap-2 text-neutral-textSecondary"><CheckCircle2 className="w-4 h-4" /> Current status: {job.status}</p>
            </div>
            {job.specialInstructions && (
              <div className="mt-4 rounded-xl bg-neutral-background border border-neutral-border p-3 text-sm text-neutral-textSecondary">
                <p className="font-semibold text-neutral-textPrimary mb-1">Special instructions</p>
                {job.specialInstructions}
              </div>
            )}
          </article>

          {provider && (
            <article className="rounded-2xl border border-neutral-border bg-white p-6">
              <h2 className="font-bold text-lg mb-4">Assigned provider</h2>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-neutral-textSecondary">
                <p className="inline-flex items-center gap-2"><User className="w-4 h-4" /> {provider.businessName || provider.providerType}</p>
                <p className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verification: {provider.verificationStatus}</p>
                <p className="inline-flex items-center gap-2"><Star className="w-4 h-4" /> Rating: {provider.rating || 0} ({provider.ratingCount || 0})</p>
                <p className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Jobs done: {provider.totalJobsCompleted || 0}</p>
              </div>
            </article>
          )}

          {review && (
            <article className="rounded-2xl border border-neutral-border bg-white p-6">
              <h2 className="font-bold text-lg mb-3">Your review</h2>
              <p className="text-sm text-neutral-textSecondary">Rating: {review.rating}/5</p>
              {review.reviewText && <p className="text-sm text-neutral-textSecondary mt-2">{review.reviewText}</p>}
            </article>
          )}
        </div>

        <aside className="space-y-5">
          {payment && (
            <article className="rounded-2xl border border-neutral-border bg-white p-6">
              <h2 className="font-bold text-lg mb-3">Payment summary</h2>
              <p className="text-sm text-neutral-textSecondary">Type: {payment.paymentType}</p>
              <p className="text-sm text-neutral-textSecondary">Total: ₹{payment.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-neutral-textSecondary">Final due: ₹{payment.finalAmount.toLocaleString()}</p>
              <p className="text-sm text-neutral-textSecondary">Status: {payment.paymentStatus}</p>
            </article>
          )}

          <article className="rounded-2xl border border-neutral-border bg-white p-6">
            <h2 className="font-bold text-lg mb-3">Actions</h2>
            <div className="space-y-2">
              {canCancel && (
                <button onClick={cancelCurrentJob} disabled={actionLoading} className="w-full rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
                  Cancel request
                </button>
              )}
              {canPay && (
                <button onClick={() => setShowPaymentModal(true)} className="w-full rounded-xl bg-primary-main text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Pay now
                </button>
              )}
              {canReview && (
                <button onClick={() => setShowReviewModal(true)} className="w-full rounded-xl bg-neutral-background text-neutral-textPrimary px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 border border-neutral-border">
                  <MessageSquareText className="w-4 h-4" /> Write review
                </button>
              )}
            </div>
          </article>
        </aside>
      </section>

      {showPaymentModal && payment && (
        <Modal title="Confirm payment" onClose={() => setShowPaymentModal(false)}>
          <p className="text-sm text-neutral-textSecondary mb-4">You are about to pay ₹{payment.finalAmount.toLocaleString()} for this completed job.</p>
          <button onClick={submitPayment} disabled={actionLoading} className="w-full rounded-xl bg-primary-main text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {actionLoading ? 'Processing...' : 'Confirm payment'}
          </button>
        </Modal>
      )}

      {showReviewModal && (
        <Modal title="Submit review" onClose={() => setShowReviewModal(false)}>
          <label className="block text-sm font-semibold mb-1">Overall rating (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={reviewData.rating}
            onChange={(e) => setReviewData((prev) => ({ ...prev, rating: Number(e.target.value) }))}
            className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm mb-3"
          />
          <label className="block text-sm font-semibold mb-1">Feedback</label>
          <textarea
            rows={4}
            value={reviewData.reviewText}
            onChange={(e) => setReviewData((prev) => ({ ...prev, reviewText: e.target.value }))}
            className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm mb-4"
            placeholder="Write your experience with service quality, punctuality and communication"
          />
          <button onClick={submitReview} disabled={actionLoading} className="w-full rounded-xl bg-primary-main text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {actionLoading ? 'Submitting...' : 'Submit review'}
          </button>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-background"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
