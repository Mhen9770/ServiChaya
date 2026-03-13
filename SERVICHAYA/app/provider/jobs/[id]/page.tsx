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
import LocationPicker from '@/components/map/LocationPicker'

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
  const [distanceFromCurrentKm, setDistanceFromCurrentKm] = useState<number | null>(null)

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

      // After we have job data, estimate distance from provider's current location (browser)
      if (jobData.latitude && jobData.longitude && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const toRad = (v: number) => (v * Math.PI) / 180
            const R = 6371 // km
            const dLat = toRad(jobData.latitude! - pos.coords.latitude)
            const dLon = toRad(jobData.longitude! - pos.coords.longitude)
            const lat1 = toRad(pos.coords.latitude)
            const lat2 = toRad(jobData.latitude!)

            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const d = R * c
            setDistanceFromCurrentKm(Math.round(d * 10) / 10)
          },
          () => {
            setDistanceFromCurrentKm(null)
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
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

  const statusSteps = [
    { key: 'PENDING', label: 'Request Created', description: 'Customer raised the service request' },
    { key: 'MATCHED', label: 'Matched to You', description: 'You have been matched to this job' },
    { key: 'ACCEPTED', label: 'Accepted by You', description: 'You confirmed you will take this job' },
    { key: 'IN_PROGRESS', label: 'Work In Progress', description: 'You are working on this job' },
    { key: 'PAYMENT_PENDING', label: 'Payment Pending', description: 'Waiting for customer payment' },
    { key: 'COMPLETED', label: 'Completed', description: 'Job completed and closed' },
    { key: 'CANCELLED', label: 'Cancelled', description: 'Job was cancelled' },
  ]

  const getStepIndex = (status: string) => {
    return statusSteps.findIndex((s) => s.key === status)
  }

  const currentStepIndex = getStepIndex(job?.status || '')

  const getStepDetails = (key: string): { label: string; value: string }[] => {
    if (!job) return []
    const details: { label: string; value: string }[] = []

    switch (key) {
      case 'PENDING':
        details.push(
          { label: 'Created at', value: new Date(job.createdAt).toLocaleString() },
          { label: 'Job code', value: job.jobCode },
          job.estimatedBudget
            ? { label: 'Estimated budget', value: `₹${job.estimatedBudget.toLocaleString()}` }
            : { label: 'Estimated budget', value: 'Not specified' },
        )
        break
      case 'MATCHED':
        details.push({ label: 'Matched to you', value: 'Assigned based on your skills & location' })
        break
      case 'ACCEPTED':
        if (job.acceptedAt) {
          details.push({ label: 'Accepted at', value: new Date(job.acceptedAt).toLocaleString() })
        }
        details.push({ label: 'Next step', value: 'Travel to customer and start work' })
        break
      case 'IN_PROGRESS':
        if (job.startedAt) {
          details.push({ label: 'Started at', value: new Date(job.startedAt).toLocaleString() })
        }
        if (job.finalPrice) {
          details.push({ label: 'Expected final price', value: `₹${job.finalPrice.toLocaleString()}` })
        } else if (job.estimatedBudget) {
          details.push({ label: 'Estimated budget', value: `₹${job.estimatedBudget.toLocaleString()}` })
        }
        break
      case 'PAYMENT_PENDING':
        if (paymentSchedule) {
          details.push(
            { label: 'Final amount', value: `₹${paymentSchedule.finalAmount.toLocaleString()}` },
            { label: 'Payment status', value: paymentSchedule.paymentStatus },
          )
        }
        break
      case 'COMPLETED':
        if (job.completedAt) {
          details.push({ label: 'Completed at', value: new Date(job.completedAt).toLocaleString() })
        }
        if (job.finalPrice) {
          details.push({ label: 'Final price', value: `₹${job.finalPrice.toLocaleString()}` })
        }
        if (paymentSchedule?.paymentStatus) {
          details.push({ label: 'Payment status', value: paymentSchedule.paymentStatus })
        }
        break
      case 'CANCELLED':
        details.push({ label: 'Status', value: 'Cancelled – no further action required' })
        break
      default:
        break
    }

    return details
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-5 lg:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/provider/jobs" className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-primary-light mb-4 sm:mb-6 transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Back to Jobs</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 backdrop-blur-md shadow-lg shadow-black/20"
      >
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{job.title}</h1>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold flex items-center gap-1 border ${
                job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60' :
                job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED' ? 'bg-primary-main/20 text-primary-light border-primary-main/60' :
                job.status === 'MATCHED' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/60' :
                job.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-400/60' :
                'bg-slate-700/50 text-slate-300 border-slate-600/60'
              }`}>
                <StatusIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{statusInfo.text}</span>
                <span className="sm:hidden">{job.status.replace('_', ' ')}</span>
              </span>
              {job.isEmergency && (
                <span className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-red-500/20 text-red-300 border border-red-400/50 rounded-full text-[9px] sm:text-xs font-semibold animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Emergency
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-3 sm:mb-4 leading-relaxed">{job.description}</p>
            <div className="text-[10px] sm:text-xs text-slate-400">Job Code: {job.jobCode}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-2.5 sm:p-3 bg-slate-800/50 rounded-lg sm:rounded-xl border-2 border-primary-main/20">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-400">Preferred Time</div>
              <div className="font-semibold text-white truncate">
                {new Date(job.preferredTime).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-2.5 sm:p-3 bg-slate-800/50 rounded-lg sm:rounded-xl border-2 border-primary-main/20">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-400">Location</div>
              <div className="font-semibold text-white truncate">{job.addressLine1}</div>
            </div>
          </div>
          {job.estimatedBudget && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-2.5 sm:p-3 bg-slate-800/50 rounded-lg sm:rounded-xl border-2 border-purple-400/20">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400">Estimated Budget</div>
                <div className="font-semibold text-white">₹{job.estimatedBudget.toLocaleString()}</div>
              </div>
            </div>
          )}
          {job.finalPrice && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-2.5 sm:p-3 bg-gradient-to-br from-accent-green/20 to-green-600/20 rounded-lg sm:rounded-xl border-2 border-accent-green/40">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent-green flex-shrink-0" />
              <div>
                <div className="text-slate-300">Final Price</div>
                <div className="font-semibold text-accent-green">₹{job.finalPrice.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Small map with customer's exact location (and approximate distance from provider) */}
        {(job.latitude && job.longitude) && (
          <div className="mb-4 sm:mb-6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-light" />
                <span>Job location on map</span>
              </div>
              {distanceFromCurrentKm !== null && (
                <span className="text-[11px] sm:text-xs text-slate-300">
                  Approx. {distanceFromCurrentKm} km from your current location
                </span>
              )}
            </div>
            <LocationPicker
              center={{ lat: job.latitude, lng: job.longitude }}
              value={{ lat: job.latitude, lng: job.longitude }}
              radiusKm={undefined}
              readOnly
              height={220}
            />
          </div>
        )}

        {job.specialInstructions && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-400/40 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <div className="text-[10px] sm:text-xs font-semibold text-blue-300">Special Instructions</div>
            </div>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">{job.specialInstructions}</div>
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
            className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl glass-dark border-2 border-purple-400/30 p-4 sm:p-5 lg:p-6 backdrop-blur-md shadow-lg shadow-purple-500/10"
          >
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 font-display flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light" />
              Customer Information
            </h2>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">{customer.name}</h3>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3">
                  {customer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.mobileNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{customer.mobileNumber}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-[10px] sm:text-xs">
                  <div className="p-2 sm:p-3 bg-slate-800/30 rounded-lg border border-white/5">
                    <div className="text-slate-400 mb-0.5 sm:mb-1">Total Jobs</div>
                    <div className="font-semibold text-white text-sm sm:text-base">{customer.totalJobs}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-800/30 rounded-lg border border-white/5">
                    <div className="text-slate-400 mb-0.5 sm:mb-1">Completed</div>
                    <div className="font-semibold text-accent-green text-sm sm:text-base">{customer.completedJobs}</div>
                  </div>
                  {(customer.averageRating ?? 0) > 0 && (
                    <div className="p-2 sm:p-3 bg-slate-800/30 rounded-lg border border-white/5">
                      <div className="text-slate-400 mb-0.5 sm:mb-1">Avg Rating</div>
                      <div className="font-semibold text-white text-sm sm:text-base">{(customer.averageRating ?? 0).toFixed(1)}</div>
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
          className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 lg:p-6 backdrop-blur-md shadow-lg shadow-black/20"
        >
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 font-display flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light" />
            Job Timeline
          </h2>

          {/* Horizontal timeline on desktop */}
          <div className="hidden md:block">
            <div className="relative pb-4">
              <div className="absolute left-6 right-6 top-5 h-0.5 bg-white/10" />
              <div
                className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-primary-main to-primary-light origin-left"
                style={{
                  width:
                    currentStepIndex >= 0 && statusSteps.length > 1
                      ? `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`
                      : '0%',
                }}
              />

              <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStepIndex && currentStepIndex >= 0
                  const isCurrent = index === currentStepIndex
                  const details = getStepDetails(step.key)

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-primary-main text-white border-primary-main shadow-md'
                            : isActive
                            ? 'bg-primary-main/20 text-primary-light border-primary-main/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p
                        className={`text-[11px] font-semibold ${
                          isCurrent
                            ? 'text-primary-light'
                            : isActive
                            ? 'text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-400">{step.description}</p>
                      {details.length > 0 && (
                        <div className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                          {details.map((d) => (
                            <p key={d.label}>
                              <span className="font-semibold text-white">{d.label}:</span> {d.value}
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

          {/* Vertical timeline on mobile */}
          <div className="md:hidden">
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white/10" />
              <div
                className="absolute left-3 top-0 w-0.5 bg-gradient-to-b from-primary-main to-primary-light"
                style={{
                  height:
                    currentStepIndex >= 0 && statusSteps.length > 1
                      ? `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`
                      : '0%',
                }}
              />

              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStepIndex && currentStepIndex >= 0
                  const isCurrent = index === currentStepIndex
                  const details = getStepDetails(step.key)

                  return (
                    <div key={step.key} className="relative flex items-start gap-3">
                      <div
                        className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-primary-main text-white border-primary-main shadow-md'
                            : isActive
                            ? 'bg-primary-main/20 text-primary-light border-primary-main/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent
                              ? 'text-primary-light'
                              : isActive
                              ? 'text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                        {details.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                            {details.map((d) => (
                              <p key={d.label}>
                                <span className="font-semibold text-white">{d.label}:</span> {d.value}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22 }}
          className="mb-6 rounded-2xl glass-dark border border-white/10 p-6"
        >
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 font-display">What should you do now?</h2>
          <p className="text-[10px] sm:text-xs text-slate-300 mb-2 sm:mb-3 leading-relaxed">
            These suggestions are based on the current job status coming from the backend, so they always stay in sync
            with the actual workflow.
          </p>

          {job.status === 'ACCEPTED' && (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary-main/10 border-2 border-primary-main/40 text-xs sm:text-sm text-slate-300 space-y-1 sm:space-y-1.5">
              <p className="font-semibold text-white">Job is accepted. Next steps:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs">
                <li>Contact the customer if you need any clarification before starting.</li>
                <li>Reach the service location at the preferred time.</li>
                <li>Tap <span className="font-semibold">"Start Job"</span> when you actually begin the work.</li>
              </ul>
            </div>
          )}

          {job.status === 'IN_PROGRESS' && (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary-main/10 border-2 border-primary-main/40 text-xs sm:text-sm text-slate-300 space-y-1 sm:space-y-1.5">
              <p className="font-semibold text-white">Job is in progress. Remember:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs">
                <li>Keep the customer informed about any extra work or changes in price.</li>
                <li>Decide the final amount with the customer before closing the job.</li>
                <li>
                  When work is done, click <span className="font-semibold">"Complete Job"</span>, enter final price in
                  ₹ and choose the correct payment channel (Cash / Online).
                </li>
              </ul>
            </div>
          )}

          {job.status === 'PAYMENT_PENDING' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-sm text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">Waiting for customer payment</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Customer has to complete the final payment from their side (online / cash as per flow).</li>
                <li>You will see updated payment status here once backend confirms the payment.</li>
                <li>Avoid doing additional unpaid work until payment status is updated to completed or partial.</li>
              </ul>
            </div>
          )}

          {job.status === 'COMPLETED' && (
            <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30 text-sm text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">Job is completed.</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Verify that payment status below is correct as per platform rules.</li>
                <li>Customer may submit a review from their app; this will impact your rating.</li>
                <li>Final earnings for this job will be reflected in your Earnings page.</li>
              </ul>
            </div>
          )}

          {job.status === 'CANCELLED' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-sm text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">Job has been cancelled.</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>No further action is required on this job.</li>
                <li>Check your notifications for cancellation reason if provided.</li>
                <li>Focus on other active or available jobs in your dashboard.</li>
              </ul>
            </div>
          )}

          {job.status === 'PENDING' || job.status === 'MATCHED' ? (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">Job is not yet accepted.</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Review the job details, location and estimated budget carefully.</li>
                <li>Only accept the job from your “Available Jobs” list when you are sure you can serve it.</li>
                <li>After accepting, this screen will show you Start / Complete actions based on backend status.</li>
              </ul>
            </div>
          ) : null}
        </motion.div>

        {paymentSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl glass-dark border-2 border-accent-green/40 p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 backdrop-blur-md shadow-lg shadow-accent-green/10"
          >
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 font-display flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent-green" />
              Payment Information
            </h2>
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-slate-800/50 rounded-lg sm:rounded-xl border-2 border-accent-green/40">
              <div className="text-[10px] sm:text-xs text-slate-300 mb-0.5 sm:mb-1">Your Payment Preference</div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                {paymentSchedule.paymentType === 'PARTIAL' && paymentSchedule.upfrontPercentage 
                  ? `Partial Payment (${paymentSchedule.upfrontPercentage}% upfront)`
                  : paymentSchedule.paymentType === 'FULL'
                  ? 'Full Payment (100% upfront)'
                  : paymentSchedule.paymentType === 'POST_WORK'
                  ? 'Post Work Payment (Pay after completion)'
                  : paymentSchedule.paymentType}
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-slate-300">Total Amount</span>
                <span className="text-base sm:text-lg font-bold text-white">₹{paymentSchedule.totalAmount.toLocaleString()}</span>
              </div>
              {paymentSchedule.paymentType === 'PARTIAL' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Upfront ({paymentSchedule.upfrontPercentage}%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">₹{paymentSchedule.upfrontAmount.toLocaleString()}</span>
                      {paymentSchedule.upfrontPaid && (
                        <CheckCircle2 className="w-4 h-4 text-accent-green" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Final Amount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">₹{paymentSchedule.finalAmount.toLocaleString()}</span>
                      {paymentSchedule.finalPaid && (
                        <CheckCircle2 className="w-4 h-4 text-accent-green" />
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-300">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    paymentSchedule.paymentStatus === 'COMPLETED' 
                      ? 'bg-accent-green/20 text-accent-green border-accent-green/50'
                      : paymentSchedule.paymentStatus === 'PARTIAL'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                  }`}>
                    {paymentSchedule.paymentStatus}
                  </span>
                </div>
                {paymentSchedule.paymentStatus === 'PENDING' && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Payment processing: 2 business days</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          {canStart && (
            <motion.button
              whileHover={{ scale: actionLoading ? 1 : 1.05 }}
              whileTap={{ scale: actionLoading ? 1 : 0.95 }}
              onClick={handleStartJob}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-accent-green/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {actionLoading ? 'Starting...' : 'Start Job'}
            </motion.button>
          )}
          {canComplete && (
            <motion.button
              whileHover={{ scale: actionLoading ? 1 : 1.05 }}
              whileTap={{ scale: actionLoading ? 1 : 0.95 }}
              onClick={() => setShowCompleteModal(true)}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-main to-primary-light text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Complete Job</span>
              <span className="sm:hidden">Complete</span>
            </motion.button>
          )}
          {canCancel && (
            <motion.button
              whileHover={{ scale: actionLoading ? 1 : 1.05 }}
              whileTap={{ scale: actionLoading ? 1 : 0.95 }}
              onClick={handleCancelJob}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-red-500/60 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-500/10 hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{actionLoading ? 'Cancelling...' : 'Cancel Job'}</span>
              <span className="sm:hidden">{actionLoading ? 'Cancelling' : 'Cancel'}</span>
            </motion.button>
          )}
        </div>
      </motion.section>

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/30 p-4 sm:p-6 max-w-md w-full backdrop-blur-md shadow-2xl shadow-black/50"
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Complete Job</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2 block">Final Price (₹) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    setFinalPrice(value)
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl glass border-2 border-white/20 text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-primary-main/50 transition-colors text-sm sm:text-base"
                  placeholder="Enter final amount charged"
                  min="0"
                  step="0.01"
                  required
                />
                {job.estimatedBudget && (
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
                    Estimated: ₹{job.estimatedBudget.toLocaleString()}
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2 block">Payment Channel <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentChannel('CASH')}
                    className={`p-2.5 sm:p-3 border-2 rounded-lg sm:rounded-xl font-semibold transition-all ${
                      paymentChannel === 'CASH'
                        ? 'border-primary-main bg-primary-main/20 text-primary-light'
                        : 'border-white/30 text-slate-300 hover:border-primary-main/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">CASH</span>
                      <span className="text-[9px] sm:text-xs opacity-75">Immediate</span>
                    </div>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentChannel('ONLINE')}
                    className={`p-2.5 sm:p-3 border-2 rounded-lg sm:rounded-xl font-semibold transition-all ${
                      paymentChannel === 'ONLINE'
                        ? 'border-primary-main bg-primary-main/20 text-primary-light'
                        : 'border-white/30 text-slate-300 hover:border-primary-main/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">ONLINE</span>
                      <span className="text-[9px] sm:text-xs opacity-75">Payment Link</span>
                    </div>
                  </motion.button>
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 leading-relaxed">
                  {paymentChannel === 'CASH' 
                    ? 'Job will be marked as completed immediately after cash payment confirmation.'
                    : 'Customer will receive a payment link. Job will be completed after payment confirmation.'}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowCompleteModal(false)
                    setFinalPrice('')
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 border-white/30 text-white text-xs sm:text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCompleteJob}
                  disabled={actionLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-accent-green/50 transition-all disabled:opacity-50"
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
