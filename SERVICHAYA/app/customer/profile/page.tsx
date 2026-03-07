'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { BadgeCheck, Mail, MapPin, Phone, Save, UserCircle2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerProfile, type CustomerProfileDto, updateCustomerProfile } from '@/lib/services/customer'
import Loader from '@/components/ui/Loader'

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<CustomerProfileDto | null>(null)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return
    load(user.userId)
  }, [])

  const load = async (customerId: number) => {
    try {
      setLoading(true)
      const res = await getCustomerProfile(customerId)
      setProfile(res)
      setName(res.name || res.fullName || '')
      setImage(res.profileImageUrl || '')
    } catch {
      toast.error('Unable to load profile')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    const user = getCurrentUser()
    if (!user) return
    try {
      setSaving(true)
      const updated = await updateCustomerProfile(user.userId, { name, profileImageUrl: image })
      setProfile(updated)
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const completion = useMemo(() => {
    if (!profile) return 0
    let points = 40
    if (name.trim()) points += 20
    if (image.trim()) points += 20
    if (profile.addresses?.length) points += 20
    return Math.min(100, points)
  }, [profile, name, image])

  if (loading) return <Loader fullScreen text="Loading profile" />
  if (!profile) return <div className="px-6 py-6">No profile data.</div>

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-7">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-sm text-slate-300 mt-1">Manage identity details, track account completeness and keep addresses current.</p>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-neutral-border p-6">
          <div className="flex flex-col items-center text-center">
            {image ? (
              <img src={image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-primary-main/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-main/10 text-primary-main flex items-center justify-center">
                <UserCircle2 className="w-10 h-10" />
              </div>
            )}
            <p className="mt-3 font-bold text-lg">{name || 'Customer'}</p>
            <p className="text-xs text-neutral-textSecondary">Customer ID: {profile.userId}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full"><BadgeCheck className="w-3.5 h-3.5" /> Verified profile</span>
          </div>

          <div className="mt-6 text-sm space-y-2 text-neutral-textSecondary">
            <p className="inline-flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</p>
            <p className="inline-flex items-center gap-2"><Phone className="w-4 h-4" />{profile.mobileNumber}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-border p-6 space-y-6">
          <div>
            <h2 className="font-bold text-lg">Edit details</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Field label="Display name" value={name} onChange={setName} />
              <Field label="Profile image URL" value={image} onChange={setImage} />
            </div>
            <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-main text-white font-semibold disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>

          <div className="rounded-xl bg-neutral-background border border-neutral-border p-4">
            <p className="text-sm font-semibold">Profile completion: {completion}%</p>
            <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-main to-primary-light" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="Total Jobs" value={profile.totalJobs || 0} />
            <Stat label="Completed" value={profile.completedJobs || 0} />
            <Stat label="Total Spend" value={`₹${(profile.totalSpent || 0).toLocaleString()}`} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-neutral-border p-6">
        <h3 className="font-bold text-lg mb-4">Saved addresses</h3>
        {profile.addresses?.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {profile.addresses.map((address) => (
              <div key={address.id} className="rounded-xl border border-neutral-border p-4">
                <p className="font-semibold text-sm inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{address.addressLine1}</p>
                {address.addressLine2 && <p className="text-xs text-neutral-textSecondary mt-1">{address.addressLine2}</p>}
                <p className="text-xs text-neutral-textSecondary mt-1">{address.cityName} {address.pincode ? `- ${address.pincode}` : ''}</p>
                {address.isDefault && <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary-main/10 text-primary-main">Default</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-textSecondary">No addresses saved yet.</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm" />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-border p-4">
      <p className="text-xs text-neutral-textSecondary">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}
