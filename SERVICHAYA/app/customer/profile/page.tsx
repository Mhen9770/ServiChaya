'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Mail, MapPin, Phone, Save, ShieldCheck, UserCircle2 } from 'lucide-react'
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
    const user = getCurrentUser()
    if (!user) return
    loadProfile(user.userId)
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

  const save = async () => {
    const user = getCurrentUser()
    if (!user) return
    try {
      setSaving(true)
      const updated = await updateCustomerProfile(user.userId, { name, profileImageUrl })
      setProfile(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  const profileStrength = useMemo(() => {
    if (!profile) return 0
    let score = 35
    if (name.trim()) score += 25
    if (profileImageUrl.trim()) score += 20
    if (profile.addresses?.length) score += 20
    return Math.min(100, score)
  }, [profile, name, profileImageUrl])

  if (loading) return <Loader fullScreen text="Loading your profile..." />
  if (!profile) return <div className="px-6 py-6">Profile unavailable.</div>

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-primary-dark via-primary-main to-primary-light text-white p-7">
        <h1 className="text-3xl font-bold mb-2">Profile & Trust</h1>
        <p className="text-sm text-blue-100">A complete profile helps us match you with better providers and support faster resolution.</p>
      </section>

      <div className="grid lg:grid-cols-3 gap-5">
        <article className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-primary-main/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-main/10 text-primary-main flex items-center justify-center"><UserCircle2 className="w-11 h-11" /></div>
            )}
            <h2 className="font-bold mt-3 text-lg">{name || 'Customer'}</h2>
            <p className="text-xs text-neutral-textSecondary">User ID: {profile.userId}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck className="w-3.5 h-3.5" />Verified account</span>
          </div>
          <div className="mt-5 space-y-2 text-sm text-neutral-textSecondary">
            <p className="inline-flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</p>
            <p className="inline-flex items-center gap-2"><Phone className="w-4 h-4" />{profile.mobileNumber}</p>
          </div>
        </article>

        <article className="lg:col-span-2 bg-white border border-neutral-border rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-lg mb-3">Personal details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Display Name" value={name} onChange={setName} placeholder="Enter your name" />
              <Field label="Profile image URL" value={profileImageUrl} onChange={setProfileImageUrl} placeholder="https://..." />
            </div>
            <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-main text-white text-sm font-semibold disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>

          <div className="rounded-xl border border-neutral-border p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-semibold">Profile strength</span>
              <span className="text-primary-main font-bold">{profileStrength}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-main to-primary-light" style={{ width: `${profileStrength}%` }} /></div>
            <div className="mt-3 text-xs text-neutral-textSecondary inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-accent-green" />Complete profile helps in better provider matching.</div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <Stat label="Total Jobs" value={profile.totalJobs || 0} />
            <Stat label="Completed Jobs" value={profile.completedJobs || 0} />
            <Stat label="Total Spent" value={`₹${(profile.totalSpent || 0).toLocaleString()}`} />
          </div>
        </article>
      </div>

      <section className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Saved addresses</h3>
        {profile.addresses?.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {profile.addresses.map((address) => (
              <article key={address.id} className="rounded-xl border border-neutral-border p-4">
                <p className="font-semibold text-sm inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{address.addressLine1}</p>
                <p className="text-xs text-neutral-textSecondary mt-1">{address.addressLine2}</p>
                <p className="text-xs text-neutral-textSecondary mt-1">{address.cityName} {address.pincode ? `- ${address.pincode}` : ''}</p>
                {address.isDefault && <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary-main/10 text-primary-main">Default</span>}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-textSecondary">No saved addresses available yet.</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30" />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-border p-4 bg-white">
      <p className="text-xs text-neutral-textSecondary">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}
