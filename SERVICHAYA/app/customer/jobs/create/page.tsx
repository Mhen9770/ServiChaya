'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CalendarDays, MapPin, Send, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createJob, type CreateJobDto } from '@/lib/services/job'
import { getAllCategories, type ServiceCategory } from '@/lib/services/service'
import { getServiceSkillsByCategory, type ServiceSkillDto } from '@/lib/services/provider'
import {
  getAllActiveCities,
  getPodsByZone,
  getZonesByCity,
  type CityMasterDto,
  type PodMasterDto,
  type ZoneMasterDto,
} from '@/lib/services/admin'

const blankForm: CreateJobDto = {
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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CreateJobDto>(blankForm)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [skills, setSkills] = useState<ServiceSkillDto[]>([])
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [zones, setZones] = useState<ZoneMasterDto[]>([])
  const [pods, setPods] = useState<PodMasterDto[]>([])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login?redirect=/customer/jobs/create')
      return
    }
    initData()
  }, [router])

  const initData = async () => {
    try {
      const [categoryRes, cityRes] = await Promise.all([getAllCategories(), getAllActiveCities()])
      setCategories(categoryRes)
      setCities(cityRes)
    } catch {
      toast.error('Unable to load create form data')
    }
  }

  const selectedCategory = useMemo(() => categories.find((c) => c.id === form.serviceCategoryId), [categories, form.serviceCategoryId])

  const onCategoryChange = async (categoryId: number) => {
    setForm((prev) => ({ ...prev, serviceCategoryId: categoryId, serviceSkillId: undefined }))
    if (!categoryId) {
      setSkills([])
      return
    }
    try {
      const skillRes = await getServiceSkillsByCategory(categoryId)
      setSkills(skillRes)
    } catch {
      toast.error('Skills could not be loaded')
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
      setZones(await getZonesByCity(cityId))
    } catch {
      toast.error('Zones could not be loaded')
    }
  }

  const onZoneChange = async (zoneId: number) => {
    setForm((prev) => ({ ...prev, zoneId, podId: undefined }))
    if (!zoneId) {
      setPods([])
      return
    }
    try {
      setPods(await getPodsByZone(zoneId))
    } catch {
      toast.error('PODs could not be loaded')
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const user = getCurrentUser()
    if (!user) return

    if (!form.serviceCategoryId || !form.title || !form.description || !form.preferredTime || !form.cityId || !form.addressLine1) {
      toast.error('Please complete required fields')
      return
    }

    try {
      setSaving(true)
      await createJob(user.userId, {
        ...form,
        estimatedBudget: form.estimatedBudget || undefined,
      })
      toast.success('Request created successfully')
      router.push('/customer/jobs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main">
        <ArrowLeft className="w-4 h-4" /> Back to My Requests
      </Link>

      <section className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-7">
        <h1 className="text-3xl font-bold">Create a high-quality request</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
          Better request details means faster match and smoother service delivery. Add complete service scope, preferred slot and exact location.
        </p>
      </section>

      <form onSubmit={submit} className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-neutral-border p-6 space-y-6">
          <div>
            <h2 className="font-bold text-lg">1) Service information</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <SelectField required label="Category" value={form.serviceCategoryId} onChange={(v) => onCategoryChange(Number(v))}>
                <option value={0}>Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
              <SelectField label="Skill (optional)" value={form.serviceSkillId || ''} onChange={(v) => setForm((prev) => ({ ...prev, serviceSkillId: v ? Number(v) : undefined }))}>
                <option value="">Select skill</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectField>
            </div>
            {selectedCategory?.description && <p className="text-xs text-neutral-textSecondary mt-2">{selectedCategory.description}</p>}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <InputField required label="Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} placeholder="Ex: Kitchen sink leakage fix" />
              <InputField label="Estimated budget (₹)" type="number" value={form.estimatedBudget || ''} onChange={(value) => setForm((prev) => ({ ...prev, estimatedBudget: value ? Number(value) : undefined }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1">Detailed description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm"
              placeholder="Include issue, expected output, location details, urgency and any constraints"
            />

            <label className="mt-3 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isEmergency} onChange={(e) => setForm((prev) => ({ ...prev, isEmergency: e.target.checked }))} />
              Mark as emergency request
            </label>
          </div>

          <div>
            <h2 className="font-bold text-lg">2) Date, time & location</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <InputField required label="Preferred slot" type="datetime-local" icon={CalendarDays} value={form.preferredTime} onChange={(value) => setForm((prev) => ({ ...prev, preferredTime: value }))} />
              <SelectField required label="City" value={form.cityId} onChange={(v) => onCityChange(Number(v))}>
                <option value={0}>Select city</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </SelectField>
              <SelectField label="Zone" value={form.zoneId || ''} onChange={(v) => onZoneChange(v ? Number(v) : 0)}>
                <option value="">Select zone</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
              </SelectField>
              <SelectField label="POD" value={form.podId || ''} onChange={(v) => setForm((prev) => ({ ...prev, podId: v ? Number(v) : undefined }))}>
                <option value="">Select POD</option>
                {pods.map((pod) => <option key={pod.id} value={pod.id}>{pod.name}</option>)}
              </SelectField>
              <InputField required label="Address line 1" value={form.addressLine1} icon={MapPin} onChange={(value) => setForm((prev) => ({ ...prev, addressLine1: value }))} />
              <InputField label="Address line 2" value={form.addressLine2 || ''} onChange={(value) => setForm((prev) => ({ ...prev, addressLine2: value }))} />
              <InputField label="Pincode" value={form.pincode || ''} onChange={(value) => setForm((prev) => ({ ...prev, pincode: value }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1">Special instructions</label>
            <textarea
              rows={3}
              value={form.specialInstructions || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
              className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm"
              placeholder="Landmark, gate instructions, contact preference"
            />
          </div>

          <button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-main text-white font-semibold disabled:opacity-60">
            <Send className="w-4 h-4" /> {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>

        <aside className="bg-white rounded-2xl border border-neutral-border p-6 h-fit">
          <h3 className="font-bold text-lg">What happens next</h3>
          <ol className="mt-4 text-sm text-neutral-textSecondary space-y-3 list-decimal list-inside">
            <li>Matching engine finds relevant nearby providers.</li>
            <li>You receive status updates and timeline progress.</li>
            <li>After completion, payment and review are enabled.</li>
          </ol>

          <div className="rounded-xl mt-5 bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            <p className="inline-flex items-center gap-2 font-semibold"><ShieldCheck className="w-4 h-4" /> Customer safety note</p>
            <p className="mt-2 text-xs">Only share address and details needed for service delivery.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
  icon: Icon,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}{required ? ' *' : ''}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-textSecondary" />}
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-neutral-border ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm`}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  required,
  children,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}{required ? ' *' : ''}</label>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm bg-white">
        {children}
      </select>
    </div>
  )
}
