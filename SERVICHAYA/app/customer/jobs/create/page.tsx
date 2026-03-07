'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CalendarClock, CheckCircle2, Home, Layers, MapPin, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { createJob, type CreateJobDto } from '@/lib/services/job'
import { getAllCategories, type ServiceCategory } from '@/lib/services/service'
import { getServiceSkillsByCategory, type ServiceSkillDto } from '@/lib/services/provider'
import { getAllActiveCities, getZonesByCity, getPodsByZone, type CityMasterDto, type ZoneMasterDto, type PodMasterDto } from '@/lib/services/admin'

const initialState: CreateJobDto = {
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
  const [form, setForm] = useState<CreateJobDto>(initialState)
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
    hydrateMasterData()
  }, [router])

  const hydrateMasterData = async () => {
    try {
      const [serviceCategories, cityData] = await Promise.all([getAllCategories(), getAllActiveCities()])
      setCategories(serviceCategories)
      setCities(cityData)
    } catch {
      toast.error('Failed to load booking form data')
    }
  }

  const onSelectCategory = async (categoryId: number) => {
    setForm((prev) => ({ ...prev, serviceCategoryId: categoryId, serviceSkillId: undefined }))
    if (!categoryId) {
      setSkills([])
      return
    }
    try {
      setSkills(await getServiceSkillsByCategory(categoryId))
    } catch {
      toast.error('Unable to load skill options')
    }
  }

  const onSelectCity = async (cityId: number) => {
    setForm((prev) => ({ ...prev, cityId, zoneId: undefined, podId: undefined }))
    setPods([])
    if (!cityId) {
      setZones([])
      return
    }
    try {
      setZones(await getZonesByCity(cityId))
    } catch {
      toast.error('Unable to load zones')
    }
  }

  const onSelectZone = async (zoneId: number) => {
    setForm((prev) => ({ ...prev, zoneId, podId: undefined }))
    if (!zoneId) {
      setPods([])
      return
    }
    try {
      setPods(await getPodsByZone(zoneId))
    } catch {
      toast.error('Unable to load PODs')
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const user = getCurrentUser()
    if (!user) return

    if (!form.serviceCategoryId || !form.title || !form.description || !form.preferredTime || !form.cityId || !form.addressLine1) {
      toast.error('Please fill all mandatory fields')
      return
    }

    try {
      setLoading(true)
      await createJob(user.userId, { ...form, estimatedBudget: form.estimatedBudget || undefined })
      toast.success('Your service request is submitted successfully')
      router.push('/customer/jobs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-primary-dark to-primary-main text-white p-7">
        <h1 className="text-3xl font-bold mb-2">Create a new service request</h1>
        <p className="text-sm text-blue-100 max-w-2xl">We made booking simpler: choose service, add details, pick location and preferred time. That’s it.</p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs">
          {[
            ['1', 'Service info'],
            ['2', 'Location & time'],
            ['3', 'Review & submit'],
          ].map(([n, label]) => (
            <div key={label} className="rounded-xl bg-white/10 border border-white/20 px-3 py-2"><span className="font-bold mr-1">{n}.</span>{label}</div>
          ))}
        </div>
      </section>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-neutral-border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-lg mb-4 inline-flex items-center gap-2"><Layers className="w-5 h-5 text-primary-main" /> Service information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Select label="Category" required value={form.serviceCategoryId} onChange={(v) => onSelectCategory(Number(v))}>
                <option value={0}>Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select label="Skill (optional)" value={form.serviceSkillId || ''} onChange={(v) => setForm((prev) => ({ ...prev, serviceSkillId: v ? Number(v) : undefined }))}>
                <option value="">Select skill</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input label="Request title" required value={form.title} onChange={(v) => setForm((prev) => ({ ...prev, title: v }))} placeholder="Example: AC servicing and gas refill" />
              <Input label="Estimated budget (₹)" type="number" value={form.estimatedBudget || ''} onChange={(v) => setForm((prev) => ({ ...prev, estimatedBudget: v ? Number(v) : undefined }))} placeholder="Optional" />
            </div>
            <label className="block text-sm font-semibold mt-4 mb-1">Description *</label>
            <textarea required value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30" placeholder="Explain issue, requirements, and expected outcome" />
            <label className="mt-3 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isEmergency} onChange={(e) => setForm((prev) => ({ ...prev, isEmergency: e.target.checked }))} /> Mark as emergency</label>
          </div>

          <div>
            <h2 className="font-bold text-lg mb-4 inline-flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-main" /> Location & schedule</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Preferred date & time" type="datetime-local" required value={form.preferredTime} onChange={(v) => setForm((prev) => ({ ...prev, preferredTime: v }))} icon={CalendarClock} />
              <Select label="City" required value={form.cityId} onChange={(v) => onSelectCity(Number(v))}>
                <option value={0}>Select city</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </Select>
              <Select label="Zone" value={form.zoneId || ''} onChange={(v) => onSelectZone(v ? Number(v) : 0)}>
                <option value="">Select zone</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
              </Select>
              <Select label="POD" value={form.podId || ''} onChange={(v) => setForm((prev) => ({ ...prev, podId: v ? Number(v) : undefined }))}>
                <option value="">Select pod</option>
                {pods.map((pod) => <option key={pod.id} value={pod.id}>{pod.name}</option>)}
              </Select>
              <Input label="Address line 1" required value={form.addressLine1} onChange={(v) => setForm((prev) => ({ ...prev, addressLine1: v }))} icon={Home} />
              <Input label="Address line 2" value={form.addressLine2 || ''} onChange={(v) => setForm((prev) => ({ ...prev, addressLine2: v }))} />
              <Input label="Pincode" value={form.pincode || ''} onChange={(v) => setForm((prev) => ({ ...prev, pincode: v }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1">Special instructions</label>
            <textarea value={form.specialInstructions || ''} onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))} rows={3} className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30" placeholder="Landmark, building entry details or notes" />
          </div>
        </div>

        <aside className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="font-bold mb-3">Before you submit</h3>
          <ul className="text-sm text-neutral-textSecondary space-y-2 mb-5">
            <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5" /> Add a clear title and complete issue description.</li>
            <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5" /> Confirm your schedule and location fields.</li>
            <li className="inline-flex items-start gap-2"><AlertCircle className="w-4 h-4 text-accent-orange mt-0.5" /> Mark emergency only for urgent needs.</li>
          </ul>
          <button disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-main text-white font-semibold disabled:opacity-50">
            <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit request'}
          </button>
        </aside>
      </form>
    </div>
  )
}

function Input({ label, value, onChange, required, type = 'text', placeholder, icon: Icon }: { label: string; value: string | number; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}{required ? ' *' : ''}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-neutral-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />}
        <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl border border-neutral-border ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30`} />
      </div>
    </div>
  )
}

function Select({ label, value, onChange, required, children }: { label: string; value: string | number; onChange: (value: string) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}{required ? ' *' : ''}</label>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-neutral-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-main/30">
        {children}
      </select>
    </div>
  )
}
