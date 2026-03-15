'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCustomerById, updateCustomer, deactivateCustomer, activateCustomer, type CustomerDto } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  ArrowLeft, Phone, Mail, Calendar, UserCheck, UserX, 
  ClipboardList, CheckCircle2, XCircle, Clock, MapPin, Edit
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminCustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = Number(params.id)
  const [customer, setCustomer] = useState<CustomerDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    isActive: true
  })

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const data = await getCustomerById(customerId)
      setCustomer(data)
      setEditForm({
        name: data.name || '',
        email: data.email || '',
        mobileNumber: data.mobileNumber || '',
        isActive: data.isActive
      })
    } catch (error: any) {
      console.error('Failed to fetch customer:', error)
      if (error.response?.status === 404) {
        toast.error('Customer not found')
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to load customer details'
        toast.error(errorMsg)
      }
      router.push('/admin/customers')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!customer) return

    try {
      setActionLoading(true)
      await updateCustomer(customerId, editForm)
      toast.success('Customer updated successfully!')
      setShowEditModal(false)
      await fetchCustomer()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update customer. Please try again.'
      toast.error(errorMsg)
      console.error('Update customer error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!customer) return

    if (!confirm('Are you sure you want to deactivate this customer?')) {
      return
    }

    try {
      setActionLoading(true)
      await deactivateCustomer(customerId)
      toast.success('Customer deactivated successfully')
      await fetchCustomer()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to deactivate customer. Please try again.'
      toast.error(errorMsg)
      console.error('Deactivate customer error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!customer) return

    try {
      setActionLoading(true)
      await activateCustomer(customerId)
      toast.success('Customer activated successfully')
      await fetchCustomer()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to activate customer. Please try again.'
      toast.error(errorMsg)
      console.error('Activate customer error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading customer details..." />
  }

  if (!customer) {
    return (
      <div className="px-6 py-6">
        <p className="text-neutral-textSecondary">Customer not found</p>
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
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-neutral-textSecondary hover:text-primary-main transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">
              Customer Details
            </h1>
            <p className="text-sm text-neutral-textSecondary mt-1">
              Customer Code: {customer.customerCode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {customer.isActive ? (
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Deactivate
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={actionLoading}
                className="px-4 py-2 bg-accent-green/20 text-accent-green rounded-lg hover:bg-accent-green/30 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Activate
              </button>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border"
        >
          <h2 className="text-lg font-semibold text-neutral-textPrimary mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Name</label>
              <p className="text-base text-neutral-textPrimary mt-1">{customer.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-neutral-textSecondary" />
                <p className="text-base text-neutral-textPrimary">{customer.email || 'N/A'}</p>
                {customer.emailVerified && (
                  <span title="Email Verified">
                    <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Mobile Number</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-neutral-textSecondary" />
                <p className="text-base text-neutral-textPrimary">{customer.mobileNumber || 'N/A'}</p>
                {customer.mobileVerified && (
                  <span title="Mobile Verified">
                    <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Status</label>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                  customer.isActive 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {customer.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Account Status</label>
              <p className="text-base text-neutral-textPrimary mt-1">{customer.accountStatus || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Joined Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-neutral-textSecondary" />
                <p className="text-base text-neutral-textPrimary">
                  {new Date(customer.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {customer.lastLoginAt && (
              <div>
                <label className="text-xs font-semibold text-neutral-textSecondary uppercase">Last Login</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-neutral-textSecondary" />
                  <p className="text-base text-neutral-textPrimary">
                    {new Date(customer.lastLoginAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Job Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border"
        >
          <h2 className="text-lg font-semibold text-neutral-textPrimary mb-4">Job Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-main/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-5 h-5 text-primary-main" />
                <span className="text-xs font-semibold text-neutral-textSecondary">Total Jobs</span>
              </div>
              <p className="text-2xl font-bold text-primary-main">{customer.totalJobsCreated || 0}</p>
            </div>
            <div className="bg-accent-green/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
                <span className="text-xs font-semibold text-neutral-textSecondary">Completed</span>
              </div>
              <p className="text-2xl font-bold text-accent-green">{customer.totalJobsCompleted || 0}</p>
            </div>
            <div className="bg-yellow-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-semibold text-neutral-textSecondary">Active</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{customer.activeJobs || 0}</p>
            </div>
            <div className="bg-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-xs font-semibold text-neutral-textSecondary">Cancelled</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{customer.totalJobsCancelled || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-neutral-textPrimary mb-4">Edit Customer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-textSecondary mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textSecondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textSecondary mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-border rounded-lg hover:bg-neutral-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
