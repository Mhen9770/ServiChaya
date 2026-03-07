'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, ClipboardList, DollarSign, Mail, MapPin, Phone, Save, UserCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerProfile, type CustomerProfileDto, updateCustomerProfile } from '@/lib/services/customer'
import Loader from '@/components/ui/Loader'

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<CustomerProfileDto | null>(null)
  const [name, setName] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return
    loadProfile(currentUser.userId)
  }, [])

  const loadProfile = async (customerId: number) => {
    try {
      setLoading(true)
      const data = await getCustomerProfile(customerId)
      setProfile(data)
      setName(data.name || data.fullName || '')
      setProfileImageUrl(data.profileImageUrl || '')
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    try {
      setSaving(true)
      const updated = await updateCustomerProfile(currentUser.userId, { name, profileImageUrl })
      setProfile(updated)
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Profile update failed')
    } finally {
      setSaving(false)
    }
  }

  const completionScore = useMemo(() => {
    if (!profile) return 0
    let score = 35
    if (name.trim()) score += 25
    if (profileImageUrl.trim()) score += 20
    if (profile.addresses && profile.addresses.length) score += 20
    return Math.min(score, 100)
  }, [profile, name, profileImageUrl])

  if (loading) return <Loader fullScreen text="Loading profile..." />
  if (!profile) return <div className="px-6 py-6">Profile not available.</div>

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Profile & Trust Center</h1>
        <p className="text-sm text-neutral-textSecondary mt-1">Keep your profile updated to get faster service matching and better support.</p>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Customer profile" className="w-24 h-24 rounded-full object-cover border-4 border-primary-main/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-main/10 text-primary-main flex items-center justify-center">
                <UserCircle2 className="w-10 h-10" />
              </div>
            )}

            <h2 className="font-bold text-lg mt-3">{name || 'Customer'}</h2>
            <p className="text-xs text-neutral-textSecondary">Customer ID: {profile.userId}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified account
            </span>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <p className="inline-flex items-center gap-2 text-neutral-textSecondary"><Mail className="w-4 h-4" />{profile.email}</p>
            <p className="inline-flex items-center gap-2 text-neutral-textSecondary"><Phone className="w-4 h-4" />{profile.mobileNumber}</p>
          </div>
        </motion.section>

        <section className="lg:col-span-2 bg-white border border-neutral-border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-3">Edit profile</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Display Name" value={name} onChange={setName} placeholder="Enter your full name" />
              <Field label="Profile image URL" value={profileImageUrl} onChange={setProfileImageUrl} placeholder="https://..." />
            </div>
            <button onClick={handleSave} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-main text-white text-sm font-semibold disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="rounded-xl bg-neutral-background p-4">
            <p className="text-sm font-semibold mb-2">Profile completion: {completionScore}%</p>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-main to-primary-light" style={{ width: `${completionScore}%` }} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Stat icon={ClipboardList} label="Total Jobs" value={profile.totalJobs || 0} />
            <Stat icon={BadgeCheck} label="Completed" value={profile.completedJobs || 0} />
            <Stat icon={DollarSign} label="Total Spend" value={`₹${(profile.totalSpent || 0).toLocaleString()}`} />
          </div>
        </section>
      </div>

      <section className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Saved addresses</h3>
        {profile.addresses && profile.addresses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {profile.addresses.map((address) => (
              <div key={address.id} className="rounded-xl border border-neutral-border p-4">
                <p className="font-semibold text-sm inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{address.addressLine1}</p>
                <p className="text-xs text-neutral-textSecondary mt-1">{address.addressLine2}</p>
                <p className="text-xs text-neutral-textSecondary mt-1">{address.cityName} {address.pincode ? `- ${address.pincode}` : ''}</p>
                {address.isDefault && <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary-main/10 text-primary-main">Default</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-textSecondary">No saved addresses yet. You can add one while creating a service request.</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30"
      />
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-border p-4">
      <p className="inline-flex items-center gap-2 text-xs text-neutral-textSecondary"><Icon className="w-4 h-4" />{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}
