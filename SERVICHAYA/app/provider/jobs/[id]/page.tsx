'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getJobById, type JobDto } from '@/lib/services/job'
import { startJob, completeJob, cancelJob } from '@/lib/services/jobStatus'
import { getCustomerProfile, type CustomerProfileDto } from '@/lib/services/customer'
import { getPaymentSchedule, type PaymentScheduleDto } from '@/lib/services/payment'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  Calendar, MapPin, DollarSign, AlertCircle, CheckCircle2, 
  X, Clock, Play, ArrowLeft, MessageSquare, User, FileText, 
  Image as ImageIcon, Building2, Phone, Mail, Shield, CreditCard
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProviderJobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)
  
  const [job, setJob] = useState<JobDto | null>(null)
  const [customer, setCustomer] = useState<CustomerProfileDto | null>(null)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [finalPrice, setFinalPrice] = useState('')
  const [paymentChannel, setPaymentChannel] = useState<'CASH' | 'ONLINE'>('ONLINE')
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/jobs/' + jobId)
      return
    }
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const jobData = await getJobById(jobId)
      setJob(jobData)
      
      // Fetch additional details in parallel
      const promises: Promise<any>[] = []
      
      // Fetch customer info
      if (jobData.customerId) {
        promises.push(
          getCustomerProfile(jobData.customerId)
            .then(setCustomer)
            .catch(() => {
              console.log('Could not fetch customer details')
              setCustomer(null)
            })
        )
      }
      
      // Fetch payment schedule if job is pending for payment, accepted or in progress
      if (['PENDING_FOR_PAYMENT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING'].includes(jobData.status)) {
        promises.push(
          getPaymentSchedule(jobId)
            .then(setPaymentSchedule)
            .catch(() => {
              console.log('No payment schedule found for this job')
              setPaymentSchedule(null)
            })
        )
      }
      
      await Promise.all(promises)
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

  const handleStartJob = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser || !job) {
      toast.error('Please login first')
      return
    }

    if (job.status !== 'ACCEPTED') {
      toast.error('Job must be accepted before starting')
      return
    }

    try {
      setActionLoading(true)
      await startJob(jobId, currentUser.userId)
      toast.success('Job started successfully!')
      await fetchJobDetails()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to start job. Please try again.'
      toast.error(errorMsg)
      console.error('Start job error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteJob = async () => {
    if (!finalPrice || isNaN(Number(finalPrice)) || Number(finalPrice) <= 0) {
      toast.error('Please enter a valid final price (greater than 0)')
      return
    }

    if (!paymentChannel) {
      toast.error('Please select a payment channel')
      return
    }

    const currentUser = getCurrentUser()
    if (!currentUser || !job) {
      toast.error('Please login first')
      return
    }

    if (job.status !== 'IN_PROGRESS') {
      toast.error('Job must be in progress to complete')
      return
    }

    try {
      setActionLoading(true)
      await completeJob(jobId, currentUser.userId, Number(finalPrice), paymentChannel)
      toast.success(paymentChannel === 'CASH' 
        ? 'Job completed! Payment received via cash.' 
        : 'Job completed! Payment link sent to customer.')
      setShowCompleteModal(false)
      setFinalPrice('')
      setPaymentChannel('ONLINE') // Reset to default
      await fetchJobDetails()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to complete job. Please try again.'
      toast.error(errorMsg)
      console.error('Complete job error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelJob = async () => {
    if (!confirm('Are you sure you want to cancel this job? This action cannot be undone and may affect your rating.')) return
    
    const currentUser = getCurrentUser()
    if (!currentUser || !job) {
      toast.error('Please login first')
      return
    }

    if (!['ACCEPTED', 'IN_PROGRESS'].includes(job.status)) {
      toast.error('This job cannot be cancelled')
      return
    }

    try {
      setActionLoading(true)
      await cancelJob(jobId, currentUser.userId, 'Provider cancelled', true)
      toast.success('Job cancelled successfully')
      await fetchJobDetails()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to cancel job. Please try again.'
      toast.error(errorMsg)
      console.error('Cancel job error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle2, text: 'Accepted - Ready to Start' }
      case 'IN_PROGRESS':
        return { color: 'bg-purple-100 text-purple-800', icon: Play, text: 'In Progress' }
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
          <Link href="/provider/jobs" className="text-primary-main hover:underline mt-4 inline-block">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(job.status)
  const StatusIcon = statusInfo.icon
  const canStart = job.status === 'ACCEPTED'
  const canComplete = job.status === 'IN_PROGRESS'
  const canCancel = ['ACCEPTED', 'IN_PROGRESS'].includes(job.status)

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/provider/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main mb-6 transition-colors">
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
              Job Attachments
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

        {customer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-6 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 border border-purple-100 shadow-sm"
          >
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <User className="w-5 h-5 text-primary-main" />
              Customer Information
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-neutral-textPrimary mb-2">{customer.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-neutral-textSecondary mb-3">
                  {customer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.mobileNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      <span>{customer.mobileNumber}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-neutral-textSecondary mb-1">Total Jobs</div>
                    <div className="font-semibold text-neutral-textPrimary">{customer.totalJobs}</div>
                  </div>
                  <div>
                    <div className="text-neutral-textSecondary mb-1">Completed</div>
                    <div className="font-semibold text-accent-green">{customer.completedJobs}</div>
                  </div>
                  {customer.averageRating > 0 && (
                    <div>
                      <div className="text-neutral-textSecondary mb-1">Avg Rating</div>
                      <div className="font-semibold text-neutral-textPrimary">{customer.averageRating.toFixed(1)}</div>
                    </div>
                  )}
                </div>
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
                  <div className="text-sm font-semibold text-neutral-textPrimary">You Accepted</div>
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
              <DollarSign className="w-5 h-5 text-accent-green" />
              Payment Information
            </h2>
            <div className="mb-4 p-3 bg-white/60 rounded-xl border border-green-200">
              <div className="text-xs text-neutral-textSecondary mb-1">Your Payment Preference</div>
              <div className="text-sm font-semibold text-neutral-textPrimary">
                {paymentSchedule.paymentType === 'PARTIAL' && paymentSchedule.upfrontPercentage 
                  ? `Partial Payment (${paymentSchedule.upfrontPercentage}% upfront)`
                  : paymentSchedule.paymentType === 'FULL'
                  ? 'Full Payment (100% upfront)'
                  : paymentSchedule.paymentType === 'POST_WORK'
                  ? 'Post Work Payment (Pay after completion)'
                  : paymentSchedule.paymentType}
              </div>
            </div>
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
                <div className="flex justify-between items-center mb-2">
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
                {paymentSchedule.paymentStatus === 'PENDING' && (
                  <div className="text-xs text-neutral-textSecondary flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Payment processing: 2 business days</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 flex-wrap">
          {canStart && (
            <motion.button
              whileHover={{ scale: actionLoading ? 1 : 1.05 }}
              whileTap={{ scale: actionLoading ? 1 : 0.95 }}
              onClick={handleStartJob}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {actionLoading ? 'Starting...' : 'Start Job'}
            </motion.button>
          )}
          {canComplete && (
            <motion.button
              whileHover={{ scale: actionLoading ? 1 : 1.05 }}
              whileTap={{ scale: actionLoading ? 1 : 0.95 }}
              onClick={() => setShowCompleteModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Job
            </motion.button>
          )}
          {canCancel && (
            <motion.button
              whileHover={{ scale: actionLoading ? 1 : 1.05 }}
              whileTap={{ scale: actionLoading ? 1 : 0.95 }}
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

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4">Complete Job</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-neutral-textPrimary mb-2 block">Final Price (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    setFinalPrice(value)
                  }}
                  className="w-full p-3 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  placeholder="Enter final amount charged"
                  min="0"
                  step="0.01"
                  required
                />
                {job.estimatedBudget && (
                  <div className="text-xs text-neutral-textSecondary mt-1">
                    Estimated: ₹{job.estimatedBudget.toLocaleString()}
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-semibold text-neutral-textPrimary mb-2 block">Payment Channel <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('CASH')}
                    className={`p-3 border-2 rounded-xl font-semibold transition-all ${
                      paymentChannel === 'CASH'
                        ? 'border-primary-main bg-primary-main/10 text-primary-main'
                        : 'border-neutral-border text-neutral-textSecondary hover:border-primary-main/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <DollarSign className="w-5 h-5" />
                      <span>CASH</span>
                      <span className="text-xs opacity-75">Immediate</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('ONLINE')}
                    className={`p-3 border-2 rounded-xl font-semibold transition-all ${
                      paymentChannel === 'ONLINE'
                        ? 'border-primary-main bg-primary-main/10 text-primary-main'
                        : 'border-neutral-border text-neutral-textSecondary hover:border-primary-main/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <CreditCard className="w-5 h-5" />
                      <span>ONLINE</span>
                      <span className="text-xs opacity-75">Payment Link</span>
                    </div>
                  </button>
                </div>
                <div className="text-xs text-neutral-textSecondary mt-2">
                  {paymentChannel === 'CASH' 
                    ? 'Job will be marked as completed immediately after cash payment confirmation.'
                    : 'Customer will receive a payment link. Job will be completed after payment confirmation.'}
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowCompleteModal(false)
                    setFinalPrice('')
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 border-2 border-neutral-border text-neutral-textSecondary rounded-xl font-semibold hover:bg-neutral-background transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCompleteJob}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Completing...' : 'Complete Job'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
