'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, CheckCircle2, MapPin, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { createJob, type CreateJobDto } from '@/lib/services/job'
import { getAllCategories, type ServiceCategory } from '@/lib/services/service'
import { getServiceSkillsByCategory, type ServiceSkillDto } from '@/lib/services/provider'
import { getAllActiveCities, getZonesByCity, getPodsByZone, type CityMasterDto, type PodMasterDto, type ZoneMasterDto } from '@/lib/services/admin'

const initialForm: CreateJobDto = {
  serviceCategoryId: 0,
  serviceSkillId: undefined,
  title: '',
  description: '',
  preferredTime: '',
  isEmergency: false,
  estimatedBudget: undefined,
  cityId: 0,
  zoneId: undefined,
  podId: undefined,
  addressLine1: '',
  addressLine2: '',
  pincode: '',
  specialInstructions: '',
}

export default function CreateJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateJobDto>(initialForm)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [skills, setSkills] = useState<ServiceSkillDto[]>([])
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [zones, setZones] = useState<ZoneMasterDto[]>([])
  const [pods, setPods] = useState<PodMasterDto[]>([])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/jobs/create')
      return
    }
    loadFormData()
  }, [router])

  const loadFormData = async () => {
    try {
      const [cats, activeCities] = await Promise.all([getAllCategories(), getAllActiveCities()])
      setCategories(cats)
      setCities(activeCities)
    } catch {
      toast.error('Failed to load service form data')
    }
  }

  const selectedCategory = useMemo(() => categories.find((cat) => cat.id === form.serviceCategoryId), [categories, form.serviceCategoryId])

  const onCategoryChange = async (categoryId: number) => {
    setForm((prev) => ({ ...prev, serviceCategoryId: categoryId, serviceSkillId: undefined }))
    if (!categoryId) {
      setSkills([])
      return
    }
    try {
      const categorySkills = await getServiceSkillsByCategory(categoryId)
      setSkills(categorySkills)
    } catch {
      toast.error('Unable to fetch skills for this category')
    }
  }

  const onCityChange = async (cityId: number) => {
    setForm((prev) => ({ ...prev, cityId, zoneId: undefined, podId: undefined }))
    setPods([])
    if (!cityId) {
      setZones([])
      return
    }
    try {
      const zoneList = await getZonesByCity(cityId)
      setZones(zoneList)
    } catch {
      toast.error('Failed to load zones')
    }
  }

  const onZoneChange = async (zoneId: number) => {
    setForm((prev) => ({ ...prev, zoneId, podId: undefined }))
    if (!zoneId) {
      setPods([])
      return
    }
    try {
      const podList = await getPodsByZone(zoneId)
      setPods(podList)
    } catch {
      toast.error('Failed to load POD locations')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const currentUser = getCurrentUser()
    if (!currentUser) return

    if (!form.serviceCategoryId || !form.title || !form.description || !form.preferredTime || !form.cityId || !form.addressLine1) {
      toast.error('Please complete all required fields')
      return
    }

    try {
      setLoading(true)
      await createJob(currentUser.userId, {
        ...form,
        estimatedBudget: form.estimatedBudget || undefined,
      })
      toast.success('Service request submitted successfully!')
      router.push('/customer/jobs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create service request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main">
        <ArrowLeft className="w-4 h-4" /> Back to My Jobs
      </Link>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-primary-dark to-primary-main text-white p-7">
        <h1 className="text-3xl font-bold mb-2">Book a Service in Minutes</h1>
        <p className="text-sm text-blue-100 max-w-2xl">
          Tell us what you need, where you need it, and when. We’ll match you with the right professional.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {['Verified providers', 'Transparent pricing', 'Live updates'].map((item) => (
            <span key={item} className="bg-white/15 border border-white/20 rounded-full px-3 py-1">{item}</span>
          ))}
        </div>
      </section>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-neutral-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="font-bold text-lg mb-4">Service Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <SelectField label="Service Category" required value={form.serviceCategoryId} onChange={(val) => onCategoryChange(Number(val))}>
              <option value={0}>Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </SelectField>

            <SelectField label="Skill (Optional)" value={form.serviceSkillId || ''} onChange={(val) => setForm((prev) => ({ ...prev, serviceSkillId: val ? Number(val) : undefined }))}>
              <option value="">Select skill</option>
              {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
            </SelectField>
          </div>

          {selectedCategory?.description && <p className="text-xs text-neutral-textSecondary mt-2">{selectedCategory.description}</p>}

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <InputField label="Request title" required value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} placeholder="Example: Deep cleaning for 2BHK" />
            <InputField label="Estimated budget (₹)" type="number" value={form.estimatedBudget || ''} onChange={(value) => setForm((prev) => ({ ...prev, estimatedBudget: value ? Number(value) : undefined }))} placeholder="Optional" />
          </div>

          <label className="block text-sm font-semibold mt-4 mb-1">Describe your requirement *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30"
            placeholder="Mention scope, size, condition, urgency, and what you expect."
          />

          <div className="mt-4 flex items-center gap-2 text-sm">
            <input id="isEmergency" type="checkbox" checked={!!form.isEmergency} onChange={(e) => setForm((prev) => ({ ...prev, isEmergency: e.target.checked }))} />
            <label htmlFor="isEmergency">This is an emergency request</label>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-4">Schedule & Location</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Preferred Date & Time"
              required
              type="datetime-local"
              value={form.preferredTime}
              onChange={(value) => setForm((prev) => ({ ...prev, preferredTime: value }))}
              icon={CalendarClock}
            />

            <SelectField label="City" required value={form.cityId} onChange={(val) => onCityChange(Number(val))}>
              <option value={0}>Select city</option>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </SelectField>

            <SelectField label="Zone" value={form.zoneId || ''} onChange={(val) => onZoneChange(val ? Number(val) : 0)}>
              <option value="">Select zone</option>
              {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
            </SelectField>

            <SelectField label="POD" value={form.podId || ''} onChange={(val) => setForm((prev) => ({ ...prev, podId: val ? Number(val) : undefined }))}>
              <option value="">Select POD</option>
              {pods.map((pod) => <option key={pod.id} value={pod.id}>{pod.name}</option>)}
            </SelectField>

            <InputField label="Address line 1" required value={form.addressLine1} onChange={(value) => setForm((prev) => ({ ...prev, addressLine1: value }))} icon={MapPin} />
            <InputField label="Address line 2" value={form.addressLine2 || ''} onChange={(value) => setForm((prev) => ({ ...prev, addressLine2: value }))} />
            <InputField label="Pincode" value={form.pincode || ''} onChange={(value) => setForm((prev) => ({ ...prev, pincode: value }))} />
          </div>

          <label className="block text-sm font-semibold mt-4 mb-1">Special Instructions</label>
          <textarea
            value={form.specialInstructions || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30"
            placeholder="Any gate access code, landmark, or instructions for provider"
          />
        </div>

        <div className="bg-neutral-background rounded-xl p-4 text-xs text-neutral-textSecondary">
          <p className="font-semibold text-neutral-textPrimary mb-1 inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-green" />What happens next?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>We match your request with suitable nearby providers.</li>
            <li>You can track status and updates from the My Jobs page.</li>
            <li>After completion, you can rate and review the service.</li>
          </ul>
        </div>

        <button disabled={loading} className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-main to-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold disabled:opacity-50">
          <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Service Request'}
        </button>
      </motion.form>
    </div>
  )
}

type InputProps = {
  label: string
  value: string | number
  required?: boolean
  type?: string
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
  onChange: (value: string) => void
}

function InputField({ label, value, required, type = 'text', placeholder, onChange, icon: Icon }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}{required ? ' *' : ''}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-neutral-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-neutral-border ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30`}
        />
      </div>
    </div>
  )
}

type SelectProps = {
  label: string
  value: string | number
  required?: boolean
  onChange: (value: string) => void
  children: React.ReactNode
}

function SelectField({ label, value, required, onChange, children }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}{required ? ' *' : ''}</label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-main/30"
      >
        {children}
      </select>
    </div>
  )
}
