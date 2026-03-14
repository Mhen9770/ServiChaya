'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getJobById, type JobDto } from '@/lib/services/job'
import { 
  getAvailableProvidersForJob, assignJobToProvider, getJobAssignments, removeJobAssignment,
  getAdminJobDetails, forceMatchJob, cancelAdminJob, updateJobStatus, getJobAnalytics,
  type ProviderMatchDto 
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  ArrowLeft, Calendar, MapPin, DollarSign, AlertCircle, 
  CheckCircle2, Clock, User, Building2, Phone, Mail, 
  FileText, Image as ImageIcon, UserPlus, X, Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)
  const [job, setJob] = useState<JobDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableProviders, setAvailableProviders] = useState<ProviderMatchDto[]>([])
  const [assignedProviders, setAssignedProviders] = useState<ProviderMatchDto[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
      fetchAssignedProviders()
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const data = await getAdminJobDetails(jobId)
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

  const fetchAvailableProviders = async () => {
    try {
      setLoadingProviders(true)
      const providers = await getAvailableProvidersForJob(jobId)
      setAvailableProviders(providers)
    } catch (error: any) {
      console.error('Failed to fetch providers:', error)
      toast.error('Failed to load available providers')
    } finally {
      setLoadingProviders(false)
    }
  }

  const fetchAssignedProviders = async () => {
    try {
      setLoadingAssignments(true)
      const assignments = await getJobAssignments(jobId)
      setAssignedProviders(assignments)
    } catch (error: any) {
      console.error('Failed to fetch assigned providers:', error)
      // Don't show error toast, just log it
    } finally {
      setLoadingAssignments(false)
    }
  }

  const [removingAssignment, setRemovingAssignment] = useState<number | null>(null)

  const handleRemoveAssignment = async (matchId: number) => {
    if (!confirm('Are you sure you want to remove this provider assignment?')) return

    try {
      setRemovingAssignment(matchId)
      await removeJobAssignment(jobId, matchId)
      toast.success('Provider assignment removed')
      fetchAssignedProviders() // Refresh the list
      fetchJobDetails() // Refresh job details
    } catch (error: any) {
      console.error('Failed to remove assignment:', error)
      toast.error(error.response?.data?.message || 'Failed to remove assignment')
    } finally {
      setRemovingAssignment(null)
    }
  }

  const handleAssignJob = async () => {
    if (!selectedProviderId) {
      toast.error('Please select a provider')
      return
    }

    try {
      setAssigning(true)
      await assignJobToProvider(jobId, selectedProviderId)
      toast.success('Job assigned successfully')
      setShowAssignModal(false)
      setSelectedProviderId(null)
      fetchJobDetails() // Refresh job details
      fetchAssignedProviders() // Refresh assigned providers list
    } catch (error: any) {
      console.error('Failed to assign job:', error)
      toast.error(error.response?.data?.message || 'Failed to assign job')
    } finally {
      setAssigning(false)
    }
  }

  const handleForceMatch = async () => {
    try {
      setForceMatching(true)
      await forceMatchJob(jobId)
      toast.success('Matching triggered successfully')
      setShowForceMatchModal(false)
      await fetchJobDetails()
      await fetchAssignedProviders()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to trigger matching')
    } finally {
      setForceMatching(false)
    }
  }

  const handleCancelJob = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    try {
      setCancelling(true)
      await cancelAdminJob(jobId, cancelReason, cancelledBy)
      toast.success('Job cancelled successfully')
      setShowCancelModal(false)
      setCancelReason('')
      await fetchJobDetails()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel job')
    } finally {
      setCancelling(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus.trim()) {
      toast.error('Please select a status')
      return
    }

    try {
      setUpdatingStatus(true)
      await updateJobStatus(jobId, newStatus)
      toast.success('Job status updated successfully')
      setShowStatusModal(false)
      setNewStatus('')
      await fetchJobDetails()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
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
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display">Admin Actions</h2>
            <div className="space-y-2 mb-6">
              {job.status === 'PENDING' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForceMatchModal(true)}
                  disabled={forceMatching}
                  className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {forceMatching ? 'Triggering...' : 'Force Match'}
                </motion.button>
              )}
              {!['COMPLETED', 'CANCELLED'].includes(job.status) && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelling}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {cancelling ? 'Cancelling...' : 'Cancel Job'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowStatusModal(true)}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </motion.button>
                </>
              )}
            </div>
          </div>

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-textPrimary font-display">Participants</h2>
              {(!job.providerId || job.status === 'PENDING') && (
              <button
                onClick={() => {
                  setShowAssignModal(true)
                  fetchAvailableProviders()
                }}
                disabled={loadingProviders}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingProviders ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Assign Provider
                  </>
                )}
              </button>
              )}
            </div>
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
                  <div className="text-xs text-neutral-textSecondary mb-1">Accepted Provider ID</div>
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

          {/* Assigned Providers Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-textPrimary font-display">Assigned Providers</h2>
              <button
                onClick={fetchAssignedProviders}
                className="text-sm text-primary-main hover:text-primary-dark transition-colors"
                disabled={loadingAssignments}
              >
                {loadingAssignments ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {loadingAssignments ? (
              <div className="text-center py-8 text-neutral-textSecondary">Loading assignments...</div>
            ) : assignedProviders.length === 0 ? (
              <div className="text-center py-8 text-neutral-textSecondary">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No providers assigned yet</p>
                <p className="text-xs mt-1">Click "Assign Provider" to assign providers to this job</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedProviders.map((assignment) => (
                  <div
                    key={assignment.matchId}
                    className="flex items-center justify-between p-4 border border-neutral-border rounded-lg hover:bg-neutral-background transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/providers/${assignment.providerId}`}
                          className="font-semibold text-primary-main hover:text-primary-dark transition-colors"
                        >
                          Provider #{assignment.providerId}
                        </Link>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          assignment.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'NOTIFIED' ? 'bg-blue-100 text-blue-800' :
                          assignment.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status}
                        </span>
                        {assignment.matchScore && (
                          <span className="text-xs text-neutral-textSecondary">
                            Score: {assignment.matchScore.toFixed(1)}%
                          </span>
                        )}
                        {assignment.rankOrder && (
                          <span className="text-xs text-neutral-textSecondary">
                            Rank: #{assignment.rankOrder}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-textSecondary">
                        {assignment.notifiedAt && (
                          <span>Notified: {new Date(assignment.notifiedAt).toLocaleString()}</span>
                        )}
                        {assignment.respondedAt && (
                          <span>Responded: {new Date(assignment.respondedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    {assignment.status !== 'ACCEPTED' && (
                      <button
                        onClick={() => assignment.matchId && handleRemoveAssignment(assignment.matchId)}
                        disabled={removingAssignment === assignment.matchId}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove assignment"
                      >
                        {removingAssignment === assignment.matchId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign Provider Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-neutral-textPrimary">Assign Provider</h3>
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedProviderId(null)
                    }}
                    className="text-neutral-textSecondary hover:text-neutral-textPrimary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {loadingProviders ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-main mb-2" />
                    <p className="text-sm text-neutral-textSecondary">Loading available providers...</p>
                  </div>
                ) : availableProviders.length === 0 ? (
                  <p className="text-sm text-neutral-textSecondary py-4">No available providers found for this job.</p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                      {availableProviders.map((provider) => (
                        <button
                          key={provider.providerId}
                          onClick={() => setSelectedProviderId(provider.providerId)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedProviderId === provider.providerId
                              ? 'border-primary-main bg-primary-light/10'
                              : 'border-neutral-border hover:border-primary-main/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">Provider #{provider.providerId}</div>
                              {provider.matchScore && (
                                <div className="text-xs text-neutral-textSecondary">
                                  Match Score: {provider.matchScore.toFixed(1)}%
                                </div>
                              )}
                            </div>
                            {selectedProviderId === provider.providerId && (
                              <CheckCircle2 className="w-5 h-5 text-primary-main" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAssignModal(false)
                          setSelectedProviderId(null)
                        }}
                        className="flex-1 px-4 py-2 border border-neutral-border rounded-lg hover:bg-neutral-background transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssignJob}
                        disabled={!selectedProviderId || assigning}
                        className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        {assigning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          'Assign'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Force Match Modal */}
      {showForceMatchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Force Match Job</h2>
              <button onClick={() => setShowForceMatchModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">This will trigger the matching algorithm to find providers for this job.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForceMatchModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForceMatch}
                disabled={forceMatching}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {forceMatching ? 'Triggering...' : 'Force Match'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Cancel Job</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Cancel on behalf of</label>
                <select
                  value={cancelledBy}
                  onChange={(e) => setCancelledBy(e.target.value as 'CUSTOMER' | 'PROVIDER')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="PROVIDER">Provider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Cancellation Reason</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                  placeholder="Please provide a reason for cancellation..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelJob}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Job Status</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setNewStatus('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Current Status</label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">{job.status}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                >
                  <option value="">Select status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="MATCHING">MATCHING</option>
                  <option value="MATCHED">MATCHED</option>
                  <option value="PENDING_FOR_PAYMENT">PENDING_FOR_PAYMENT</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false)
                    setNewStatus('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus || !newStatus.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
