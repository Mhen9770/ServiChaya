'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getJobById, type JobDto } from '@/lib/services/job'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  ArrowLeft, Calendar, MapPin, DollarSign, AlertCircle, 
  CheckCircle2, Clock, User, Building2, Phone, Mail, 
  FileText, Image as ImageIcon
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)
  const [job, setJob] = useState<JobDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const data = await getJobById(jobId)
      setJob(data)
    } catch (error: any) {
      console.error('Failed to fetch job:', error)
      if (error.response?.status === 404) {
        toast.error('Job not found')
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to load job details'
        toast.error(errorMsg)
      }
      router.push('/admin/jobs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'MATCHED': return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-accent-green/20 text-accent-green'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-background text-neutral-textSecondary'
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading job details..." />
  }

  if (!job) {
    return (
      <div className="px-6 py-6">
        <p className="text-neutral-textSecondary">Job not found</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">{job.title}</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Job Code: {job.jobCode}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Job Details
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">Description</div>
                <div className="text-sm text-neutral-textPrimary">{job.description}</div>
              </div>
              {job.specialInstructions && (
                <div>
                  <div className="text-xs text-neutral-textSecondary mb-1">Special Instructions</div>
                  <div className="text-sm text-neutral-textPrimary">{job.specialInstructions}</div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-textSecondary mb-1">Preferred Time</div>
                  <div className="flex items-center gap-2 text-sm text-neutral-textPrimary">
                    <Calendar className="w-4 h-4" />
                    {new Date(job.preferredTime).toLocaleString()}
                  </div>
                </div>
                {job.estimatedBudget && (
                  <div>
                    <div className="text-xs text-neutral-textSecondary mb-1">Estimated Budget</div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent-green">
                      <DollarSign className="w-4 h-4" />
                      ₹{job.estimatedBudget.toLocaleString()}
                    </div>
                  </div>
                )}
                {job.finalPrice && (
                  <div>
                    <div className="text-xs text-neutral-textSecondary mb-1">Final Price</div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent-green">
                      <DollarSign className="w-4 h-4" />
                      ₹{job.finalPrice.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              {job.isEmergency && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-600">Emergency Service</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>
            <div className="space-y-2">
              <div className="text-sm text-neutral-textPrimary">{job.addressLine1}</div>
              {job.addressLine2 && (
                <div className="text-sm text-neutral-textSecondary">{job.addressLine2}</div>
              )}
              {job.pincode && (
                <div className="text-xs text-neutral-textSecondary">Pincode: {job.pincode}</div>
              )}
              {(job.latitude && job.longitude) && (
                <div className="text-xs text-neutral-textSecondary">
                  Coordinates: {job.latitude.toFixed(6)}, {job.longitude.toFixed(6)}
                </div>
              )}
            </div>
          </div>

          {job.attachments && job.attachments.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
              <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Attachments
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.attachments.map((attachment) => (
                  <a
                    key={attachment.fileUrl}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <div className="aspect-square bg-neutral-background rounded-xl overflow-hidden border border-neutral-border hover:border-primary-main/30 transition-all">
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName || 'Attachment'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    {attachment.fileName && (
                      <div className="text-xs text-neutral-textSecondary mt-1 truncate">{attachment.fileName}</div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-green rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-textPrimary">Job Created</div>
                  <div className="text-xs text-neutral-textSecondary">{new Date(job.createdAt).toLocaleString()}</div>
                </div>
              </div>
              {job.acceptedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent-green rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-textPrimary">Provider Accepted</div>
                    <div className="text-xs text-neutral-textSecondary">{new Date(job.acceptedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {job.startedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-main rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-textPrimary">Job Started</div>
                    <div className="text-xs text-neutral-textSecondary">{new Date(job.startedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {job.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent-green rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-textPrimary">Job Completed</div>
                    <div className="text-xs text-neutral-textSecondary">{new Date(job.completedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display">Participants</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">Customer ID</div>
                <Link
                  href={`/admin/users/${job.customerId}`}
                  className="text-sm font-semibold text-primary-main hover:text-primary-dark transition-colors"
                >
                  {job.customerId}
                </Link>
              </div>
              {job.providerId && (
                <div>
                  <div className="text-xs text-neutral-textSecondary mb-1">Provider ID</div>
                  <Link
                    href={`/admin/providers/${job.providerId}`}
                    className="text-sm font-semibold text-primary-main hover:text-primary-dark transition-colors"
                  >
                    {job.providerId}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
