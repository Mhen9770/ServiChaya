'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  Clock,
  List,
  MapPin,
  MessageSquareText,
  MessageSquare,
  ShieldCheck,
  Star,
  User,
  X,
  Phone,
  Mail,
  ExternalLink,
  Circle,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui/Loader'
import { getCurrentUser } from '@/lib/auth'
import { type JobDto } from '@/lib/services/job'
import {
  getCustomerJobDetails,
  cancelCustomerJob,
  getCustomerCancellationFee,
  completeCustomerCancellation,
  trackCustomerJob,
  type JobTrackingInfo,
} from '@/lib/services/customerJob'
import { createReview, getJobReview, type ReviewDto } from '@/lib/services/review'
import { getPaymentSchedule, processPayment, type PaymentScheduleDto } from '@/lib/services/payment'
import { getProviderProfile, type ProviderProfileDto } from '@/lib/services/provider'
import { getSubCategoryById, type ServiceSubCategory } from '@/lib/services/service'
import { getCategoryById, type ServiceCategory } from '@/lib/services/service'
import { getMatchedProviders } from '@/lib/services/providerSelection'
import { getMessagesWithProvider } from '@/lib/services/jobMessaging'

const statusOrder = ['PENDING', 'MATCHING', 'MATCHED', 'PENDING_FOR_PAYMENT', 'ACCEPTED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'COMPLETED']

export default function CustomerJobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
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
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellationFeeInfo, setCancellationFeeInfo] = useState<{
    cancellationFee: number
    refundAmount: number
    jobAmount: number
    canCancel: boolean
  } | null>(null)
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [trackingInfo, setTrackingInfo] = useState<JobTrackingInfo | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push(`/login?redirect=/customer/jobs/${jobId}`)
      return
    }
    if (Number.isNaN(jobId)) return
    fetchData()
    
    // Refresh data when returning from payment page or window gains focus
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [jobId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const jobData = await getCustomerJobDetails(jobId)
      setJob(jobData)

      // Fetch additional details in parallel
      setLoadingDetails(true)
      const promises: Promise<any>[] = []

      // Fetch category and subcategory
      if (jobData.serviceCategoryId) {
        promises.push(
          getCategoryById(jobData.serviceCategoryId)
            .then(setCategory)
            .catch(() => setCategory(null))
        )
      }
      if (jobData.serviceSubCategoryId) {
        promises.push(
          getSubCategoryById(jobData.serviceSubCategoryId)
            .then(setSubCategory)
            .catch(() => setSubCategory(null))
        )
      }

      if (jobData.providerId) {
        promises.push(
          getProviderProfile(jobData.providerId)
            .then((providerData) => {
              console.log('Provider profile loaded:', providerData)
              setProvider(providerData)
            })
            .catch((error) => {
              console.error('Failed to load provider profile:', error)
              toast.error('Failed to load provider details')
              setProvider(null)
            })
        )
      }

      // Fetch payment schedule for PENDING_FOR_PAYMENT, ACCEPTED, IN_PROGRESS, COMPLETED, or PAYMENT_PENDING jobs
      if (['PENDING_FOR_PAYMENT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING'].includes(jobData.status)) {
        promises.push(
          getPaymentSchedule(jobData.id)
            .then(setPayment)
            .catch(() => setPayment(null))
        )
      }

      if (jobData.status === 'COMPLETED') {
        promises.push(
          getJobReview(jobData.id)
            .then(setReview)
            .catch(() => setReview(null))
        )
      }

      await Promise.all(promises)
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Job not found')
      } else {
        toast.error('Failed to load job details')
      }
    } finally {
      setLoading(false)
      setLoadingDetails(false)
    }
  }

  const handleCancelClick = async () => {
    if (!job) return
    
    try {
      setActionLoading(true)
      const feeInfo = await getCustomerCancellationFee(job.id)
      setCancellationFeeInfo(feeInfo)
      setShowCancelModal(true)
    } catch (error: any) {
      toast.error('Failed to load cancellation details')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelCurrentJob = async () => {
    if (!job || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }
    
    try {
      setActionLoading(true)
      await cancelCustomerJob(job.id, cancelReason)
      
      const fee = cancellationFeeInfo?.cancellationFee || 0
      const refund = cancellationFeeInfo?.refundAmount || 0
      
      if (fee > 0) {
        toast.success(`Request cancelled. Cancellation fee: ₹${fee.toLocaleString()}. Refund: ₹${refund.toLocaleString()}`)
        // If cancellation fee required, show payment option
        if (job.status === 'CANCELLATION_PAYMENT_PENDING') {
          toast('Please complete cancellation fee payment to finalize cancellation', { icon: 'ℹ️' })
        }
      } else {
        toast.success('Request cancelled successfully. Full refund will be processed.')
      }
      
      setShowCancelModal(false)
      setCancelReason('')
      await fetchData()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Unable to cancel request'
      toast.error(errorMsg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteCancellation = async () => {
    if (!job) return
    
    try {
      setActionLoading(true)
      await completeCustomerCancellation(job.id)
      toast.success('Cancellation completed successfully')
      await fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete cancellation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleTrackJob = async () => {
    if (!job) return
    
    try {
      setActionLoading(true)
      const info = await trackCustomerJob(job.id)
      setTrackingInfo(info)
      setShowTrackModal(true)
    } catch (error: any) {
      toast.error('Failed to load tracking information')
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

  const statusSteps = [
    { key: 'PENDING', label: 'Request Created', icon: Circle, description: 'Your request is submitted' },
    { key: 'MATCHING', label: 'Finding Provider', icon: Loader2, description: 'Matching with professionals' },
    { key: 'MATCHED', label: 'Provider Matched', icon: User, description: 'Provider assigned' },
    { key: 'PENDING_FOR_PAYMENT', label: 'Payment Due', icon: CreditCard, description: 'Upfront payment required' },
    { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2, description: 'Provider accepted job' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: TrendingUp, description: 'Work is underway' },
    { key: 'PAYMENT_PENDING', label: 'Final Payment', icon: CreditCard, description: 'Complete payment' },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, description: 'Job finished' },
  ]

  const getStatusStepIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status)
  }

  const currentStepIndex = useMemo(() => getStatusStepIndex(job?.status || ''), [job?.status])

  const getStepDetails = (key: string): { label: string; value: string }[] => {
    if (!job) return []
    const details: { label: string; value: string }[] = []

    switch (key) {
      case 'PENDING':
        details.push(
          { label: 'Created at', value: new Date(job.createdAt).toLocaleString() },
          { label: 'Requested by', value: `Customer ID ${job.customerId}` },
          { label: 'Estimated budget', value: job.estimatedBudget ? `₹${job.estimatedBudget.toLocaleString()}` : 'Not specified' },
        )
        break
      case 'MATCHING':
        details.push({ label: 'Matching window', value: 'Searching nearest verified providers' })
        break
      case 'MATCHED':
        if (provider) {
          const providerName = provider.providerType === 'INDIVIDUAL' 
            ? `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || provider.providerType
            : provider.businessName || provider.providerType
          details.push(
            { label: 'Provider', value: providerName },
            { label: 'Jobs completed', value: `${provider.totalJobsCompleted || 0}` },
            { label: 'Rating', value: typeof provider.rating === 'number' ? `${provider.rating.toFixed(1)}/5` : 'N/A' },
          )
        }
        break
      case 'PENDING_FOR_PAYMENT':
        if (payment) {
          details.push(
            { label: 'Upfront amount', value: `₹${(payment.upfrontAmount || 0).toLocaleString()}` },
            { label: 'Total job amount', value: `₹${(payment.totalAmount || 0).toLocaleString()}` },
          )
        }
        break
      case 'ACCEPTED':
        if (job.acceptedAt) {
          details.push({ label: 'Accepted at', value: new Date(job.acceptedAt).toLocaleString() })
        }
        break
      case 'IN_PROGRESS':
        if (job.startedAt) {
          details.push({ label: 'Started at', value: new Date(job.startedAt).toLocaleString() })
        }
        break
      case 'PAYMENT_PENDING':
        if (payment) {
          details.push(
            { label: 'Final amount due', value: `₹${(payment.finalAmount || 0).toLocaleString()}` },
            { label: 'Payment status', value: payment.paymentStatus },
          )
        }
        break
      case 'COMPLETED':
        if (job.completedAt) {
          details.push({ label: 'Completed at', value: new Date(job.completedAt).toLocaleString() })
        }
        if (payment?.finalPaid) {
          details.push({ label: 'Final payment', value: 'Received' })
        }
        details.push({ label: 'Review', value: review ? 'Submitted' : 'Pending' })
        break
      default:
        break
    }

    return details
  }

  if (loading) return <PageLoader text="Loading request details..." />
  if (!job) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 text-white">
        Request not found.{' '}
        <Link href="/customer/jobs" className="text-primary-light hover:underline">
          Back to requests
        </Link>
      </div>
    )
  }

  const canCancel = ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_FOR_PAYMENT'].includes(job.status)
  // Can pay upfront if: job is PENDING_FOR_PAYMENT (after acceptance), payment type is PARTIAL/FULL, and upfront not paid
  const canPayUpfront = job.status === 'PENDING_FOR_PAYMENT' && payment && 
    (payment.paymentType === 'PARTIAL' || payment.paymentType === 'FULL') && 
    !payment.upfrontPaid && payment.upfrontAmount > 0
  // Can pay final if: job is PAYMENT_PENDING, there's a final amount due, and final not paid
  const canPayFinal =
    job.status === 'PAYMENT_PENDING' &&
    payment !== null &&
    !!payment.finalAmount &&
    !payment.finalPaid
  const canPay = canPayUpfront || canPayFinal
  const canReview = job.status === 'COMPLETED' && !review
  // Show provider selection when PENDING or MATCHED (even if providerId is set, customer might want to see/confirm)
  const canSelectProvider = ['PENDING', 'MATCHED'].includes(job.status)
  // Check if provider has accepted and needs customer confirmation
  const providerNeedsConfirmation = job.status === 'MATCHED' && job.subStatus === 'PROVIDER_ACCEPTED' && job.providerId
  // Can chat with provider when provider is assigned (ACCEPTED, IN_PROGRESS, PAYMENT_PENDING, COMPLETED)
  const canChatWithProvider = job.providerId && ['ACCEPTED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'COMPLETED'].includes(job.status)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

      {/* Status Timeline */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-dark border border-white/10 p-6"
      >
        <h2 className="font-bold text-lg mb-5 text-white">Job Status Timeline</h2>

        {/* Horizontal layout for larger screens */}
        <div className="hidden md:block">
          <div className="relative pb-8">
            {/* Progress line */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-white/10" />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute left-4 top-4 h-0.5 bg-gradient-to-r from-primary-main to-primary-light origin-left"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />

            <div className="grid md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
              {statusSteps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const details = getStepDetails(step.key)

                return (
                  <div key={step.key} className="flex flex-col items-center text-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? 'bg-primary-main border-primary-light shadow-lg shadow-primary-main/50'
                          : isActive
                          ? 'bg-primary-main/20 border-primary-main'
                          : 'bg-white/5 border-white/20'
                      }`}
                    >
                      <StepIcon
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-white' : isActive ? 'text-primary-light' : 'text-slate-400'
                        }`}
                      />
                    </motion.div>
                    <p
                      className={`text-[11px] font-semibold ${
                        isCurrent ? 'text-primary-light' : isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-400">{step.description}</p>
                    {details.length > 0 && (
                      <div className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                        {details.map((d) => (
                          <p key={d.label}>
                            <span className="font-semibold text-slate-300">{d.label}:</span> {d.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Vertical layout for mobile */}
        <div className="md:hidden">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute left-4 top-0 w-0.5 bg-gradient-to-b from-primary-main to-primary-light"
              style={{ height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />

            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const details = getStepDetails(step.key)

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? 'bg-primary-main border-primary-light shadow-lg shadow-primary-main/50'
                          : isActive
                          ? 'bg-primary-main/20 border-primary-main'
                          : 'bg-white/5 border-white/20'
                      }`}
                    >
                      <StepIcon
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-white' : isActive ? 'text-primary-light' : 'text-slate-400'
                        }`}
                      />
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <p
                        className={`font-semibold text-sm ${
                          isCurrent ? 'text-primary-light' : isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                      {details.length > 0 && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                          {details.map((d) => (
                            <p key={d.label}>
                              <span className="font-semibold text-slate-300">{d.label}:</span> {d.value}
                            </p>
                          ))}
                        </div>
                      )}
                      {isCurrent && job && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-main/20 border border-primary-main/30 text-xs text-primary-light"
                        >
                          <Clock className="w-3 h-3" />
                          Current step
                        </motion.div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.article>

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
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-main/30 flex items-center justify-center border border-primary-light/50">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-white">
                      {provider.providerType === 'INDIVIDUAL' 
                        ? `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || provider.providerType
                        : provider.businessName || provider.providerType}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Provider ID: <span className="font-mono text-primary-light">{provider.providerCode}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                      provider.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40'
                        : 'bg-amber-500/15 text-amber-100 border border-amber-400/40'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {provider.verificationStatus === 'VERIFIED' ? 'Verified by SERVICHAYA' : provider.verificationStatus}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                      provider.isAvailable
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40'
                        : 'bg-slate-500/30 text-slate-200 border border-slate-400/40'
                    }`}
                  >
                    <Circle className={`w-2 h-2 ${provider.isAvailable ? 'text-emerald-300 fill-emerald-300' : 'text-slate-300'} rounded-full`} />
                    {provider.isAvailable ? 'Available for booking' : 'Currently unavailable'}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-slate-300">Experience</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {(provider.experienceYears || 0)}+ years
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-slate-300 inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Rating
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {typeof provider.rating === 'number'
                      ? provider.rating.toFixed(1)
                      : (provider.rating || 0)}
                    /5
                    <span className="ml-1 text-xs text-slate-300">
                      ({provider.ratingCount || 0} reviews)
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-slate-300 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                    Jobs completed
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {provider.totalJobsCompleted || 0}+
                  </p>
                </div>
              </div>

              {provider.bio && (
                <div className="mt-4 rounded-xl bg-black/20 border border-white/10 p-3">
                  <p className="text-xs text-slate-300 font-semibold mb-1">About this provider</p>
                  <p className="text-sm text-slate-200 line-clamp-3">
                    {provider.bio}
                  </p>
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Type:</span>
                  <span className="text-white">{payment.paymentType}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total:</span>
                  <span className="text-white">₹{(payment.totalAmount || 0).toLocaleString()}</span>
                </div>
                {(payment.paymentType === 'PARTIAL' || payment.paymentType === 'FULL') && (
                  <>
                    <div className="flex justify-between text-slate-300">
                      <span>Upfront Amount:</span>
                      <span className={`font-semibold ${payment.upfrontPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                        ₹{(payment.upfrontAmount || 0).toLocaleString()}
                        {payment.upfrontPaid && ' ✓ Paid'}
                      </span>
                    </div>
                    {payment.upfrontPaymentDate && (
                      <div className="text-xs text-slate-400">
                        Paid on: {new Date(payment.upfrontPaymentDate).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
                {(payment.paymentType === 'PARTIAL' || payment.paymentType === 'POST_WORK') && (
                  <div className="flex justify-between text-slate-300">
                    <span>Final Amount:</span>
                    <span className={`font-semibold ${payment.finalPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                      ₹{(payment.finalAmount || 0).toLocaleString()}
                      {payment.finalPaid && ' ✓ Paid'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Status:</span>
                  <span className={`font-semibold ${
                    payment.paymentStatus === 'COMPLETED' ? 'text-green-400' :
                    payment.paymentStatus === 'PARTIAL' ? 'text-yellow-400' :
                    payment.paymentStatus === 'PENDING' ? 'text-yellow-400' :
                    'text-slate-300'
                  }`}>
                    {payment.paymentStatus}
                  </span>
                </div>
                {payment.paymentStatus === 'PENDING' && (
                  <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Payment processing: 2 business days</span>
                    </div>
                  </div>
                )}
                {!payment.upfrontPaid && (payment.paymentType === 'PARTIAL' || payment.paymentType === 'FULL') && job.status === 'PENDING_FOR_PAYMENT' && (
                  <Link href={`/customer/jobs/${jobId}/payment?type=upfront`} className="block mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                    >
                      <CreditCard className="w-4 h-4" /> Pay Upfront ₹{(payment.upfrontAmount || 0).toLocaleString()}
                    </motion.button>
                  </Link>
                )}
                {!payment.finalPaid &&
                  payment.finalAmount &&
                  job.status === 'PAYMENT_PENDING' && (
                  <Link href={`/customer/jobs/${jobId}/payment?type=final`} className="block mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                    >
                      <CreditCard className="w-4 h-4" /> Pay Final ₹{(payment.finalAmount || 0).toLocaleString()}
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.article>
          )}

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <h2 className="font-bold text-lg mb-3 text-white">Actions</h2>
            
            {/* Status-based guidance */}
            {job.status === 'PENDING' && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-400/30">
                <p className="text-xs text-amber-200 font-medium mb-1">⏳ What's next?</p>
                <p className="text-xs text-amber-100">We're matching your request with verified providers. You'll be notified when a provider accepts.</p>
              </div>
            )}
            {job.status === 'MATCHED' && !providerNeedsConfirmation && (
              <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-400/30">
                <p className="text-xs text-indigo-200 font-medium mb-1">✅ Provider matched</p>
                <p className="text-xs text-indigo-100">Providers have been matched to your job. Click "View Providers" below to communicate with them and negotiate.</p>
              </div>
            )}
            {providerNeedsConfirmation && (
              <div className="mb-4 p-3 rounded-lg bg-accent-green/10 border-2 border-accent-green/50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-accent-green font-bold mb-1">Provider Has Accepted Your Request!</p>
                    <p className="text-xs text-slate-200 mb-3">
                      A provider has accepted your job. Please confirm to proceed, or you can view all providers and choose a different one.
                    </p>
                    <Link href={`/customer/jobs/${jobId}/select-provider`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-green to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-accent-green/50 transition-all inline-flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm or View Providers
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {job.status === 'IN_PROGRESS' && (
              <div className="mb-4 p-3 rounded-lg bg-primary-main/10 border border-primary-main/30">
                <p className="text-xs text-primary-light font-medium mb-1">🔧 Work in progress</p>
                <p className="text-xs text-slate-200">Your service is being completed. Track updates in real-time. You can chat with your provider if needed.</p>
              </div>
            )}
            {job.status === 'ACCEPTED' && job.providerId && (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/30">
                <p className="text-xs text-blue-200 font-medium mb-1">✅ Provider Assigned</p>
                <p className="text-xs text-blue-100">Your provider is ready to start. You can chat with them or track the job status.</p>
              </div>
            )}
            {canPay && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
                <p className="text-xs text-yellow-200 font-medium mb-1">💳 Payment required</p>
                <p className="text-xs text-yellow-100">Complete payment to proceed with your service.</p>
              </div>
            )}
            {canReview && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
                <p className="text-xs text-emerald-200 font-medium mb-1">⭐ Share your experience</p>
                <p className="text-xs text-emerald-100">Help us improve by rating your service experience.</p>
              </div>
            )}

            <div className="space-y-2">
              {canSelectProvider && !providerNeedsConfirmation && (
                <Link href={`/customer/jobs/${jobId}/select-provider`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    View Providers
                  </motion.button>
                </Link>
              )}
              {canSelectProvider && providerNeedsConfirmation && (
                <Link href={`/customer/jobs/${jobId}/select-provider`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-accent-green to-emerald-500 text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent-green/50 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Provider or View All
                  </motion.button>
                </Link>
              )}
              {canCancel && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelClick} 
                    disabled={actionLoading} 
                    className="w-full rounded-xl border border-red-400/30 bg-red-500/20 text-red-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-red-500/30 transition-colors"
                  >
                    Cancel request
                  </motion.button>
                  {job.status === 'CANCELLATION_PAYMENT_PENDING' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCompleteCancellation} 
                      disabled={actionLoading} 
                      className="w-full rounded-xl border border-yellow-400/30 bg-yellow-500/20 text-yellow-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-yellow-500/30 transition-colors"
                    >
                      Complete Cancellation Payment
                    </motion.button>
                  )}
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTrackJob}
                disabled={actionLoading}
                className="w-full rounded-xl border border-blue-400/30 bg-blue-500/20 text-blue-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-blue-500/30 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Track Job Status
              </motion.button>
              {canPayUpfront && payment && (
                <Link href={`/customer/jobs/${jobId}/payment?type=upfront`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Upfront ₹{payment.upfrontAmount?.toLocaleString() || '0'}
                  </motion.button>
                </Link>
              )}
              {canPayFinal && payment && (
                <Link href={`/customer/jobs/${jobId}/payment?type=final`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Final ₹{payment.finalAmount?.toLocaleString() || '0'}
                  </motion.button>
                </Link>
              )}
              {canChatWithProvider && job.providerId && (
                <Link href={`/customer/chat/${jobId}?customerId=${job.customerId}&providerId=${job.providerId}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat with Provider
                  </motion.button>
                </Link>
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
              {!canCancel && !canPay && !canReview && !canChatWithProvider && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-300 mb-1">No actions available</p>
                  <p className="text-xs text-slate-400">All steps completed for this request.</p>
                </div>
              )}
            </div>
          </motion.article>
        </aside>
      </section>

      {showPaymentModal && payment && (
        <Modal title="Confirm payment" onClose={() => setShowPaymentModal(false)}>
          <p className="text-sm text-slate-300 mb-4">You are about to pay ₹{(payment.finalAmount || 0).toLocaleString()} for this completed job.</p>
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

      {/* Cancel Modal */}
      {showCancelModal && cancellationFeeInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Cancel Request</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {cancellationFeeInfo.cancellationFee > 0 ? (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
                  <p className="text-sm text-yellow-200 mb-1">Cancellation Fee: ₹{cancellationFeeInfo.cancellationFee.toLocaleString()}</p>
                  <p className="text-sm text-yellow-100">Refund Amount: ₹{cancellationFeeInfo.refundAmount.toLocaleString()}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30">
                  <p className="text-sm text-green-200">Full refund will be processed</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">Cancellation Reason</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
                  placeholder="Please provide a reason for cancellation..."
                />
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                  }}
                  className="flex-1 rounded-xl border border-slate-600 text-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelCurrentJob}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="flex-1 rounded-xl bg-red-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-red-600 transition-colors"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Track Job Modal */}
      {showTrackModal && trackingInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Job Tracking</h2>
              <button
                onClick={() => setShowTrackModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Job Code:</span>
                <span className="text-white font-semibold">{trackingInfo.jobCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-white font-semibold">{trackingInfo.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Provider:</span>
                <span className="text-white font-semibold">{trackingInfo.providerId || 'Not assigned'}</span>
              </div>
              {trackingInfo.acceptedAt && trackingInfo.acceptedAt !== 'Not accepted' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Accepted At:</span>
                  <span className="text-white">{new Date(trackingInfo.acceptedAt).toLocaleString()}</span>
                </div>
              )}
              {trackingInfo.startedAt && trackingInfo.startedAt !== 'Not started' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Started At:</span>
                  <span className="text-white">{new Date(trackingInfo.startedAt).toLocaleString()}</span>
                </div>
              )}
              {trackingInfo.completedAt && trackingInfo.completedAt !== 'Not completed' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed At:</span>
                  <span className="text-white">{new Date(trackingInfo.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTrackModal(false)}
              className="w-full mt-4 rounded-xl bg-primary-main text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-light transition-colors"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      )}

      {showReviewModal && (
        <Modal title="Submit review" onClose={() => setShowReviewModal(false)}>
          <div className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">Overall rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setReviewData((prev) => ({ ...prev, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= reviewData.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-600 text-slate-600'
                      }`}
                    />
                  </motion.button>
                ))}
                <span className="ml-2 text-sm text-slate-300">{reviewData.rating}/5</span>
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'qualityRating', label: 'Quality' },
                { key: 'punctualityRating', label: 'Punctuality' },
                { key: 'communicationRating', label: 'Communication' },
                { key: 'valueRating', label: 'Value for Money' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5 text-slate-300">{label}</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setReviewData((prev) => ({ ...prev, [key]: star }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            star <= (reviewData[key as keyof typeof reviewData] as number)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-600 text-slate-600'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Text */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">Your feedback</label>
              <textarea
                rows={4}
                value={reviewData.reviewText}
                onChange={(e) => setReviewData((prev) => ({ ...prev, reviewText: e.target.value }))}
                className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50"
                placeholder="Share your experience with service quality, punctuality, communication, and overall satisfaction..."
              />
              <p className="text-xs text-slate-400 mt-1">
                {reviewData.reviewText.length}/10 minimum characters
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={submitReview} 
              disabled={actionLoading || reviewData.reviewText.trim().length < 10} 
              className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-main/50 transition-all"
            >
              {actionLoading ? (
                <span className="inline-flex items-center gap-2">
                  <ButtonLoader size="sm" />
                  Submitting...
                </span>
              ) : (
                'Submit review'
              )}
            </motion.button>
          </div>
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
