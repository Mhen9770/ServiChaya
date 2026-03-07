'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { BadgeCheck, Mail, MapPin, Phone, Save, ShieldCheck, UserCircle2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerProfile, type CustomerProfileDto, updateCustomerProfile } from '@/lib/services/customer'
import Loader from '@/components/ui/Loader'

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<CustomerProfileDto | null>(null)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return
    load(user.userId)
  }, [])

  const load = async (customerId: number) => {
    try {
      setLoading(true)
      const response = await getCustomerProfile(customerId)
      setProfile(response)
      setName(response.name || response.fullName || '')
      setImageUrl(response.profileImageUrl || '')
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    const user = getCurrentUser()
    if (!user) return

    try {
      setSaving(true)
      const updated = await updateCustomerProfile(user.userId, { name, profileImageUrl: imageUrl })
      setProfile(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const completion = useMemo(() => {
    if (!profile) return 0
    let points = 40
    if (name.trim()) points += 20
    if (imageUrl.trim()) points += 20
    if (profile.addresses?.length) points += 20
    return Math.min(100, points)
  }, [profile, name, imageUrl])

  if (loading) return <Loader fullScreen text="Loading profile..." />
  if (!profile) return <div className="px-6 py-6">Profile not found.</div>

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-7 border border-slate-800">
        <h1 className="text-3xl font-bold">Customer Profile & Trust</h1>
        <p className="text-sm text-slate-300 mt-2">Keep your profile complete to get better matching and smoother service communication.</p>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <aside className="rounded-2xl border border-neutral-border bg-white p-6">
          <div className="flex flex-col items-center text-center">
            {imageUrl ? (
              <img src={imageUrl} alt="profile" className="h-24 w-24 rounded-full border-4 border-primary-main/20 object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary-main/10 text-primary-main flex items-center justify-center">
                <UserCircle2 className="w-10 h-10" />
              </div>
            )}
            <p className="text-lg font-bold mt-3">{name || 'Customer'}</p>
            <p className="text-xs text-neutral-textSecondary">User ID: {profile.userId}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1 font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified account
            </span>
          </div>

          <div className="mt-6 space-y-2 text-sm text-neutral-textSecondary">
            <p className="inline-flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</p>
            <p className="inline-flex items-center gap-2"><Phone className="w-4 h-4" />{profile.mobileNumber}</p>
          </div>
        </aside>

        <div className="lg:col-span-2 space-y-5">
          <section className="rounded-2xl border border-neutral-border bg-white p-6">
            <h2 className="text-lg font-bold">Edit profile details</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Field label="Display name" value={name} onChange={setName} />
              <Field label="Profile image URL" value={imageUrl} onChange={setImageUrl} />
            </div>

            <button onClick={saveProfile} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-main text-white px-4 py-2.5 font-semibold disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save profile'}
            </button>
          </section>

          <section className="rounded-2xl border border-neutral-border bg-white p-6">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold">Profile completion</p>
              <p className="text-sm font-bold text-primary-main">{completion}%</p>
            </div>
            <div className="h-2 rounded-full bg-neutral-background overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-main to-primary-light" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-xs text-neutral-textSecondary mt-2 inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> More complete profiles lead to better matching context.</p>
          </section>

          <section className="grid sm:grid-cols-3 gap-3">
            <Stat label="Total Jobs" value={profile.totalJobs || 0} />
            <Stat label="Completed" value={profile.completedJobs || 0} />
            <Stat label="Total Spend" value={`₹${(profile.totalSpent || 0).toLocaleString()}`} />
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-border bg-white p-6">
        <h3 className="text-lg font-bold mb-4">Saved addresses</h3>
        {profile.addresses?.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {profile.addresses.map((address) => (
              <article key={address.id} className="rounded-xl border border-neutral-border p-4">
                <p className="font-semibold text-sm inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{address.addressLine1}</p>
                {address.addressLine2 && <p className="text-xs text-neutral-textSecondary mt-1">{address.addressLine2}</p>}
                <p className="text-xs text-neutral-textSecondary mt-1">{address.cityName} {address.pincode ? `- ${address.pincode}` : ''}</p>
                {address.isDefault && <span className="inline-block mt-2 text-xs rounded-full bg-primary-main/10 px-2 py-1 text-primary-main font-semibold">Default</span>}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-textSecondary">No saved addresses available.</p>
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
    <article className="rounded-xl border border-neutral-border p-4 bg-white">
      <p className="text-xs text-neutral-textSecondary">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </article>
  )
}
