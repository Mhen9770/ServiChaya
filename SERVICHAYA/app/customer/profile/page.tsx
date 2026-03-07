'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerProfile, updateCustomerProfile, type CustomerProfileDto } from '@/lib/services/customer'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { User, Mail, Phone, MapPin, Calendar, DollarSign, ClipboardList, CheckCircle2, XCircle, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CustomerProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<CustomerProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', profileImageUrl: '' })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/profile')
      return
    }
    fetchProfile(currentUser.userId)
  }, [router])

  const fetchProfile = async (customerId: number) => {
    try {
      setLoading(true)
      const data = await getCustomerProfile(customerId)
      setProfile(data)
      // Use name or fullName for compatibility
      const displayName = data.name || (data as any).fullName || ''
      setFormData({ name: displayName, profileImageUrl: data.profileImageUrl || '' })
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load profile'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    try {
      const updated = await updateCustomerProfile(currentUser.userId, formData)
      setProfile(updated)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading profile..." />
  }

  if (!profile) {
    return (
      <div className="px-6 py-6">
        <p className="text-neutral-textSecondary">Profile not found</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">My Profile</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Manage your profile information</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2.5 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="md:col-span-1"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-main to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
                {profile.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt={profile.name || (profile as any).fullName || 'Customer'} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-xl text-sm focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    placeholder="Name"
                  />
                  <input
                    type="url"
                    value={formData.profileImageUrl}
                    onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-xl text-sm focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    placeholder="Profile Image URL"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        const displayName = profile.name || (profile as any).fullName || ''
                        setFormData({ name: displayName, profileImageUrl: profile.profileImageUrl || '' })
                      }}
                      className="flex-1 px-4 py-2 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-neutral-textPrimary mb-2">{profile.name || (profile as any).fullName || 'Customer'}</h2>
                  <p className="text-xs text-neutral-textSecondary">
                    Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-neutral-border">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-neutral-textSecondary" />
                <span className="text-neutral-textSecondary">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-neutral-textSecondary" />
                <span className="text-neutral-textSecondary">{profile.mobileNumber}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="md:col-span-2 space-y-6"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary-main" />
                </div>
                <div>
                  <div className="text-xs text-neutral-textSecondary">Total Jobs</div>
                  <div className="text-2xl font-bold text-primary-main">{profile.totalJobs || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent-green" />
                </div>
                <div>
                  <div className="text-xs text-neutral-textSecondary">Completed</div>
                  <div className="text-2xl font-bold text-accent-green">{profile.completedJobs || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent-green" />
                </div>
                <div>
                  <div className="text-xs text-neutral-textSecondary">Total Spent</div>
                  <div className="text-2xl font-bold text-accent-green">₹{(profile.totalSpent || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {profile.addresses && profile.addresses.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
              <h3 className="text-lg font-bold text-neutral-textPrimary mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Saved Addresses
              </h3>
              <div className="space-y-3">
                {profile.addresses.map((address) => (
                  <div key={address.id} className="p-4 bg-neutral-background rounded-xl border border-neutral-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-textPrimary mb-1">{address.addressLine1}</p>
                        {address.addressLine2 && (
                          <p className="text-xs text-neutral-textSecondary mb-1">{address.addressLine2}</p>
                        )}
                        <p className="text-xs text-neutral-textSecondary">
                          {address.cityName} {address.pincode && `- ${address.pincode}`}
                        </p>
                      </div>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
