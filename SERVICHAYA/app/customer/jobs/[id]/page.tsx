'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getJobById, type JobDto } from '@/lib/services/job'
import { cancelJob } from '@/lib/services/jobStatus'
import { processPayment, getPaymentSchedule, type PaymentScheduleDto } from '@/lib/services/payment'
import { createReview, getJobReview, type ReviewDto } from '@/lib/services/review'
import { getProviderProfile, type ProviderProfileDto } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  Calendar, MapPin, DollarSign, AlertCircle, CheckCircle2, 
  X, Clock, User, Star, MessageSquare, ArrowLeft, CreditCard,
  Building2, Phone, Mail, Shield, TrendingUp, FileText, Image as ImageIcon
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)
  
  const [job, setJob] = useState<JobDto | null>(null)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleDto | null>(null)
  const [review, setReview] = useState<ReviewDto | null>(null)
  const [provider, setProvider] = useState<ProviderProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5,
    qualityRating: 5,
    punctualityRating: 5,
    communicationRating: 5,
    valueRating: 5,
    reviewText: ''
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/jobs/' + jobId)
      return
    }
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const jobData = await getJobById(jobId)
      setJob(jobData)
      
      // Fetch payment schedule if job is accepted or in progress
      if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(jobData.status)) {
        try {
          const schedule = await getPaymentSchedule(jobId)
          setPaymentSchedule(schedule)
        } catch (error) {
          console.log('No payment schedule found for this job')
        }
      }
      
      // Fetch provider info if provider is assigned
      if (jobData.providerId) {
        try {
          const providerData = await getProviderProfile(jobData.providerId)
          setProvider(providerData)
        } catch (error) {
          console.log('Could not fetch provider details')
        }
      }
      
      // Fetch review if job is completed
      if (jobData.status === 'COMPLETED') {
        try {
          const existingReview = await getJobReview(jobId)
          setReview(existingReview)
        } catch (error) {
          console.log('No review found for this job')
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch job:', error)
      if (error.response?.status === 404) {
        toast.error('Job not found')
      } else {
        toast.error('Failed to load job details')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelJob = async () => {
    if (!confirm('Are you sure you want to cancel this job? This action cannot be undone.')) return
    
    const currentUser = getCurrentUser()
    if (!currentUser || !job) return

    try {
      setActionLoading(true)
      await cancelJob(jobId, currentUser.userId, 'Customer cancelled', false)
      toast.success('Job cancelled successfully')
      await fetchJobDetails()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to cancel job'
      toast.error(errorMsg)
      console.error('Cancel job error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!job) return
    
    const currentUser = getCurrentUser()
    if (!currentUser) return

    if (!reviewData.reviewText || reviewData.reviewText.trim().length < 10) {
      toast.error('Please provide a detailed review (at least 10 characters)')
      return
    }

    try {
      setActionLoading(true)
      await createReview(currentUser.userId, {
        jobId: job.id,
        ...reviewData
      })
      toast.success('Review submitted successfully!')
      setShowReviewModal(false)
      setReviewData({ rating: 5, qualityRating: 5, punctualityRating: 5, communicationRating: 5, valueRating: 5, reviewText: '' })
      await fetchJobDetails()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to submit review'
      toast.error(errorMsg)
      console.error('Submit review error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentSchedule || !job) return
    
    const currentUser = getCurrentUser()
    if (!currentUser) return

    if (paymentSchedule.finalAmount <= 0) {
      toast.error('Invalid payment amount')
      return
    }

    try {
      setActionLoading(true)
      await processPayment({
        jobId: job.id,
        amount: paymentSchedule.finalAmount,
        paymentMethod: 'UPI'
      })
      toast.success('Payment processed successfully!')
      setShowPaymentModal(false)
      await fetchJobDetails()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Payment failed. Please try again.'
      toast.error(errorMsg)
      console.error('Payment error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Waiting for Provider' }
      case 'MATCHED':
        return { color: 'bg-blue-100 text-blue-800', icon: User, text: 'Provider Matched' }
      case 'ACCEPTED':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle2, text: 'Provider Accepted' }
      case 'IN_PROGRESS':
        return { color: 'bg-purple-100 text-purple-800', icon: Clock, text: 'Service In Progress' }
      case 'COMPLETED':
        return { color: 'bg-accent-green/20 text-accent-green', icon: CheckCircle2, text: 'Completed' }
      case 'CANCELLED':
        return { color: 'bg-red-100 text-red-800', icon: X, text: 'Cancelled' }
      default:
        return { color: 'bg-neutral-background text-neutral-textSecondary', icon: Clock, text: status }
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading job details..." />
  }

  if (!job) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-12">
          <p className="text-lg text-neutral-textSecondary">Job not found</p>
          <Link href="/customer/jobs" className="text-primary-main hover:underline mt-4 inline-block">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(job.status)
  const StatusIcon = statusInfo.icon
  const canCancel = ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status)
  const canReview = job.status === 'COMPLETED' && !review
  const canPay = job.status === 'COMPLETED' && paymentSchedule && !paymentSchedule.finalPaid

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border mb-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-neutral-textPrimary">{job.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.text}
              </span>
              {job.isEmergency && (
                <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  Emergency
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-textSecondary mb-4">{job.description}</p>
            <div className="text-xs text-neutral-textSecondary">Job Code: {job.jobCode}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-5 h-5 text-neutral-textSecondary" />
            <div>
              <div className="text-neutral-textSecondary">Preferred Time</div>
              <div className="font-semibold text-neutral-textPrimary">
                {new Date(job.preferredTime).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-5 h-5 text-neutral-textSecondary" />
            <div>
              <div className="text-neutral-textSecondary">Location</div>
              <div className="font-semibold text-neutral-textPrimary">{job.addressLine1}</div>
            </div>
          </div>
          {job.estimatedBudget && (
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="w-5 h-5 text-neutral-textSecondary" />
              <div>
                <div className="text-neutral-textSecondary">Estimated Budget</div>
                <div className="font-semibold text-neutral-textPrimary">₹{job.estimatedBudget}</div>
              </div>
            </div>
          )}
          {job.finalPrice && (
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="w-5 h-5 text-accent-green" />
              <div>
                <div className="text-neutral-textSecondary">Final Price</div>
                <div className="font-semibold text-accent-green">₹{job.finalPrice}</div>
              </div>
            </div>
          )}
        </div>

        {job.specialInstructions && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div className="text-xs font-semibold text-blue-800">Special Instructions</div>
            </div>
            <div className="text-sm text-blue-900">{job.specialInstructions}</div>
          </div>
        )}

        {job.attachments && job.attachments.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-semibold text-neutral-textSecondary mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Attachments
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {job.attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square bg-neutral-background rounded-xl overflow-hidden border border-neutral-border hover:border-primary-main/30 transition-all"
                >
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.fileName || 'Attachment'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {provider && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-6 bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-blue-100 shadow-sm"
          >
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <User className="w-5 h-5 text-primary-main" />
              Service Provider
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-main to-primary-dark rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-neutral-textPrimary">{provider.businessName || 'Service Provider'}</h3>
                  {provider.verificationStatus === 'VERIFIED' && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-accent-green/20 text-accent-green rounded-full text-xs font-semibold">
                      <Shield className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                {provider.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= Math.round(provider.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-border'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-neutral-textPrimary">{provider.rating.toFixed(1)}</span>
                    {provider.ratingCount && (
                      <span className="text-xs text-neutral-textSecondary">({provider.ratingCount} reviews)</span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-neutral-textSecondary">
                  {provider.experienceYears && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>{provider.experienceYears} years experience</span>
                    </div>
                  )}
                  {provider.totalJobsCompleted !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{provider.totalJobsCompleted} jobs completed</span>
                    </div>
                  )}
                </div>
                {provider.bio && (
                  <p className="text-sm text-neutral-textSecondary mt-3 line-clamp-2">{provider.bio}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6 bg-white rounded-2xl p-6 border border-neutral-border"
        >
          <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-main" />
            Job Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-accent-green rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-neutral-textPrimary">Job Created</div>
                <div className="text-xs text-neutral-textSecondary">{new Date(job.createdAt).toLocaleString()}</div>
              </div>
            </div>
            {job.acceptedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-green rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-textPrimary">Provider Accepted</div>
                  <div className="text-xs text-neutral-textSecondary">{new Date(job.acceptedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            {job.startedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-main rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-textPrimary">Service Started</div>
                  <div className="text-xs text-neutral-textSecondary">{new Date(job.startedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            {job.completedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-green rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-textPrimary">Service Completed</div>
                  <div className="text-xs text-neutral-textSecondary">{new Date(job.completedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {paymentSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
          >
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent-green" />
              Payment Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-textSecondary">Total Amount</span>
                <span className="text-lg font-bold text-neutral-textPrimary">₹{paymentSchedule.totalAmount.toLocaleString()}</span>
              </div>
              {paymentSchedule.paymentType === 'PARTIAL' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-textSecondary">Upfront ({paymentSchedule.upfrontPercentage}%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-textPrimary">₹{paymentSchedule.upfrontAmount.toLocaleString()}</span>
                      {paymentSchedule.upfrontPaid && (
                        <CheckCircle2 className="w-4 h-4 text-accent-green" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-textSecondary">Final Amount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-textPrimary">₹{paymentSchedule.finalAmount.toLocaleString()}</span>
                      {paymentSchedule.finalPaid && (
                        <CheckCircle2 className="w-4 h-4 text-accent-green" />
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-neutral-textSecondary">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    paymentSchedule.paymentStatus === 'COMPLETED' 
                      ? 'bg-accent-green/20 text-accent-green'
                      : paymentSchedule.paymentStatus === 'PARTIAL'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-neutral-background text-neutral-textSecondary'
                  }`}>
                    {paymentSchedule.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 flex-wrap">
          {canPay && paymentSchedule && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPaymentModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              {actionLoading ? 'Processing...' : `Pay ₹${paymentSchedule.finalAmount.toLocaleString()}`}
            </motion.button>
          )}
          {canReview && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReviewModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star className="w-4 h-4" />
              Rate Provider
            </motion.button>
          )}
          {canCancel && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelJob}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 border-2 border-red-500 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              {actionLoading ? 'Cancelling...' : 'Cancel Job'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {review && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border"
        >
          <h2 className="text-lg font-bold text-neutral-textPrimary mb-4">Your Review</h2>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-border'}`} />
              ))}
            </div>
            <span className="text-sm font-semibold text-neutral-textPrimary">{review.rating}/5</span>
          </div>
          {review.reviewText && (
            <p className="text-sm text-neutral-textSecondary">{review.reviewText}</p>
          )}
        </motion.div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4">Rate Your Experience</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-neutral-textPrimary mb-2 block">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className="text-2xl"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-border'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-textPrimary mb-2 block">Review</label>
                <textarea
                  value={reviewData.reviewText}
                  onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                  className="w-full p-3 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none"
                  rows={4}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowReviewModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 border-2 border-neutral-border text-neutral-textSecondary rounded-xl font-semibold hover:bg-neutral-background transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitReview}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Review'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showPaymentModal && paymentSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4">Complete Payment</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-textSecondary">Final Amount</span>
                <span className="font-semibold text-neutral-textPrimary">₹{paymentSchedule.finalAmount}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPaymentModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border-2 border-neutral-border text-neutral-textSecondary rounded-xl font-semibold hover:bg-neutral-background transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl font-semibold hover:shadow-md transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : `Pay ₹${paymentSchedule.finalAmount.toLocaleString()}`}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
