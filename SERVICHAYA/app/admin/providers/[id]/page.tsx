'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getProviderById, approveProvider, rejectProvider, type ProviderDto } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { getCurrentUser } from '@/lib/auth'
import { 
  ArrowLeft, CheckCircle2, XCircle, Star, Phone, Mail, Building2, 
  MapPin, Calendar, DollarSign, Briefcase, AlertCircle, User, FileText,
  Award, ExternalLink, Eye, Download, Wrench, Globe, Clock, Shield
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminProviderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const providerId = Number(params.id)
  const [provider, setProvider] = useState<ProviderDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [expandedDocument, setExpandedDocument] = useState<number | null>(null)

  useEffect(() => {
    if (providerId) {
      fetchProvider()
    }
  }, [providerId])

  const fetchProvider = async () => {
    try {
      setLoading(true)
      const data = await getProviderById(providerId)
      setProvider(data)
    } catch (error: any) {
      console.error('Failed to fetch provider:', error)
      if (error.response?.status === 404) {
        toast.error('Provider not found')
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to load provider details'
        toast.error(errorMsg)
      }
      router.push('/admin/providers')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!provider || provider.profileStatus !== 'PENDING_VERIFICATION') {
      toast.error('Provider cannot be approved in current status')
      return
    }

    try {
      setActionLoading(true)
      await approveProvider(providerId, adminNotes || undefined)
      toast.success('Provider approved successfully!')
      setShowApproveModal(false)
      setAdminNotes('')
      await fetchProvider()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to approve provider. Please try again.'
      toast.error(errorMsg)
      console.error('Approve provider error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    if (!provider || provider.profileStatus !== 'PENDING_VERIFICATION') {
      toast.error('Provider cannot be rejected in current status')
      return
    }

    if (!confirm('Are you sure you want to reject this provider? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(true)
      await rejectProvider(providerId, adminNotes)
      toast.success('Provider rejected successfully')
      setShowRejectModal(false)
      setAdminNotes('')
      await fetchProvider()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to reject provider. Please try again.'
      toast.error(errorMsg)
      console.error('Reject provider error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'AADHAAR': 'Aadhaar Card',
      'PAN': 'PAN Card',
      'ADDRESS_PROOF': 'Address Proof',
      'PROFILE_PHOTO': 'Profile Photo',
      'CERTIFICATION': 'Certification'
    }
    return labels[type] || type
  }

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-accent-green/20 text-accent-green border-accent-green/30'
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading provider details..." />
  }

  if (!provider) {
    return (
      <div className="px-6 py-6">
        <p className="text-neutral-textSecondary">Provider not found</p>
      </div>
    )
  }

  const canApprove = provider.profileStatus === 'PENDING_VERIFICATION' && provider.verificationStatus === 'PENDING'
  const canReject = provider.profileStatus === 'PENDING_VERIFICATION' && provider.verificationStatus === 'PENDING'

  return (
    <div className="px-6 py-6 bg-gradient-to-br from-neutral-background to-white min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Link
          href="/admin/providers"
          className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Providers
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {provider.profileImageUrl && (
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={provider.profileImageUrl} 
                  alt={provider.businessName || 'Provider'} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-neutral-textPrimary font-display">
                {provider.businessName || 'Provider Details'}
              </h1>
              <p className="text-sm text-neutral-textSecondary mt-1">
                Provider Code: <span className="font-semibold text-primary-main">{provider.providerCode}</span>
              </p>
            </div>
          </div>
          {canApprove && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve Provider
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                <XCircle className="w-5 h-5" />
                Reject Provider
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Profile Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border">
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <User className="w-6 h-6 text-primary-main" />
              Profile Overview
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">Business Name</div>
                <div className="text-sm font-semibold text-neutral-textPrimary">{provider.businessName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">Provider Type</div>
                <div className="text-sm font-semibold text-neutral-textPrimary capitalize">
                  {provider.providerType?.replace('_', ' ') || 'N/A'}
                </div>
              </div>
              {provider.experienceYears && (
                <div>
                  <div className="text-xs text-neutral-textSecondary mb-1">Total Experience</div>
                  <div className="text-sm font-semibold text-neutral-textPrimary flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary-main" />
                    {provider.experienceYears} years
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">Provider Code</div>
                <div className="text-sm font-semibold text-primary-main">{provider.providerCode}</div>
              </div>
            </div>
            {provider.bio && (
              <div className="mt-4 pt-4 border-t border-neutral-border">
                <div className="text-xs text-neutral-textSecondary mb-2">Bio / Description</div>
                <p className="text-sm text-neutral-textPrimary leading-relaxed">{provider.bio}</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border">
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <Phone className="w-6 h-6 text-primary-main" />
              Contact Information
            </h2>
            <div className="space-y-3">
              {provider.email && (
                <div className="flex items-center gap-3 p-3 bg-neutral-background rounded-xl">
                  <Mail className="w-5 h-5 text-neutral-textSecondary" />
                  <span className="text-sm text-neutral-textPrimary">{provider.email}</span>
                </div>
              )}
              {provider.mobileNumber && (
                <div className="flex items-center gap-3 p-3 bg-neutral-background rounded-xl">
                  <Phone className="w-5 h-5 text-neutral-textSecondary" />
                  <span className="text-sm text-neutral-textPrimary">{provider.mobileNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border">
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-main" />
              Verification Documents
            </h2>
            {provider.documents && provider.documents.length > 0 ? (
              <div className="space-y-4">
                {provider.documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-2 border-neutral-border rounded-xl p-4 hover:border-primary-main/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-primary-main" />
                          <span className="font-semibold text-neutral-textPrimary">
                            {getDocumentTypeLabel(doc.documentType)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getVerificationStatusColor(doc.verificationStatus)}`}>
                            {doc.verificationStatus}
                          </span>
                        </div>
                        {doc.documentNumber && (
                          <div className="text-xs text-neutral-textSecondary mb-2">
                            Number: <span className="font-semibold text-neutral-textPrimary">{doc.documentNumber}</span>
                          </div>
                        )}
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary-main hover:text-primary-dark transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Document
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-textSecondary">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded</p>
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border">
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-main" />
              Skills & Expertise
            </h2>
            {provider.skills && provider.skills.length > 0 ? (
              <div className="space-y-4">
                {provider.skills.map((skill) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border-2 rounded-xl p-4 ${
                      skill.isPrimary 
                        ? 'border-accent-green bg-accent-green/5' 
                        : 'border-neutral-border bg-neutral-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-primary-main" />
                          <span className="font-semibold text-neutral-textPrimary">{skill.skillName}</span>
                          {skill.isPrimary && (
                            <span className="px-2.5 py-1 bg-accent-green/20 text-accent-green rounded-full text-xs font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-accent-green" />
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          {skill.experienceYears && (
                            <div>
                              <span className="text-neutral-textSecondary">Experience: </span>
                              <span className="font-semibold text-neutral-textPrimary">{skill.experienceYears} years</span>
                            </div>
                          )}
                          {skill.certificationName && (
                            <div>
                              <span className="text-neutral-textSecondary">Certification: </span>
                              <span className="font-semibold text-neutral-textPrimary">{skill.certificationName}</span>
                            </div>
                          )}
                        </div>
                        {skill.certificationDocumentUrl && (
                          <a
                            href={skill.certificationDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary-main hover:text-primary-dark transition-colors mt-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Certification
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-textSecondary">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No skills added</p>
              </div>
            )}
          </div>

          {/* Service Areas Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border">
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary-main" />
              Service Areas
            </h2>
            {provider.serviceAreas && provider.serviceAreas.length > 0 ? (
              <div className="space-y-4">
                {provider.serviceAreas.map((area) => (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border-2 rounded-xl p-4 ${
                      area.isPrimary 
                        ? 'border-accent-green bg-accent-green/5' 
                        : 'border-neutral-border bg-neutral-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-5 h-5 text-primary-main" />
                          <span className="font-semibold text-neutral-textPrimary">
                            {area.cityName} → {area.zoneName || 'N/A'} → {area.podName}
                          </span>
                          {area.isPrimary && (
                            <span className="px-2.5 py-1 bg-accent-green/20 text-accent-green rounded-full text-xs font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-accent-green" />
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-neutral-textSecondary">
                          Service Radius: <span className="font-semibold text-neutral-textPrimary">{area.serviceRadiusKm} km</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-textSecondary">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No service areas configured</p>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border">
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary-main" />
              Performance Metrics
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="text-xs text-neutral-textSecondary mb-1">Rating</div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-bold text-neutral-textPrimary">
                    {provider.rating ? provider.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-xs text-neutral-textSecondary mb-1">Jobs Completed</div>
                <div className="text-lg font-bold text-neutral-textPrimary">{provider.totalJobsCompleted || 0}</div>
              </div>
              <div className={`rounded-xl p-4 border ${
                provider.isAvailable 
                  ? 'bg-gradient-to-br from-accent-green/10 to-accent-green/20 border-accent-green/30' 
                  : 'bg-neutral-background border-neutral-border'
              }`}>
                <div className="text-xs text-neutral-textSecondary mb-1">Available</div>
                <div className={`text-lg font-bold ${provider.isAvailable ? 'text-accent-green' : 'text-neutral-textSecondary'}`}>
                  {provider.isAvailable ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-border sticky top-6">
            <h2 className="text-lg font-bold text-neutral-textPrimary mb-4 font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-main" />
              Verification Status
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-neutral-textSecondary mb-2">Verification Status</div>
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${
                  provider.verificationStatus === 'VERIFIED' 
                    ? 'bg-accent-green/20 text-accent-green border-2 border-accent-green/30' 
                    : provider.verificationStatus === 'REJECTED'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                }`}>
                  {provider.verificationStatus}
                </span>
              </div>
              <div>
                <div className="text-xs text-neutral-textSecondary mb-2">Profile Status</div>
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${
                  provider.profileStatus === 'ACTIVE' 
                    ? 'bg-accent-green/20 text-accent-green border-2 border-accent-green/30'
                    : provider.profileStatus === 'PENDING_VERIFICATION'
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                    : 'bg-neutral-background text-neutral-textSecondary border-2 border-neutral-border'
                }`}>
                  {provider.profileStatus.replace('_', ' ')}
                </span>
              </div>
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">User ID</div>
                <div className="text-sm font-semibold text-neutral-textPrimary">{provider.userId}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-textSecondary mb-1">Created At</div>
                <div className="text-sm font-semibold text-neutral-textPrimary flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-neutral-textSecondary" />
                  {new Date(provider.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display">Approve Provider</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none resize-none"
                rows={4}
                placeholder="Add any notes about this approval..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve Provider'}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setAdminNotes('')
                }}
                className="flex-1 px-4 py-3 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display">Reject Provider</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:border-red-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !adminNotes.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Provider'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setAdminNotes('')
                }}
                className="flex-1 px-4 py-3 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
