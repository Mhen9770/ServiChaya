'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Send, ShieldCheck, Sparkles, AlertCircle, Info } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createJob, type CreateJobDto } from '@/lib/services/job'
import { getAllCategories, getAllSubCategories, type ServiceCategory, type ServiceSubCategory } from '@/lib/services/service'
import { getServiceSkillsByCategory, type ServiceSkillDto } from '@/lib/services/provider'
import {
  getAllActiveCities,
  getPodsByZone,
  getZonesByCity,
  type CityMasterDto,
  type PodMasterDto,
  type ZoneMasterDto,
} from '@/lib/services/admin'

const emptyForm: CreateJobDto = {
  serviceCategoryId: 0,
  serviceSubCategoryId: undefined,
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
  const [form, setForm] = useState<CreateJobDto>(emptyForm)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([])
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
    loadInitialData()
  }, [router])

  const loadInitialData = async () => {
    try {
      const [categoryRes, cityRes] = await Promise.all([getAllCategories(), getAllActiveCities()])
      setCategories(categoryRes)
      setCities(cityRes)
    } catch {
      toast.error('Failed to load create job form data')
    }
  }

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.serviceCategoryId),
    [categories, form.serviceCategoryId]
  )

  const handleCategory = async (categoryId: number) => {
    setForm((prev) => ({ ...prev, serviceCategoryId: categoryId, serviceSubCategoryId: undefined, serviceSkillId: undefined }))
    if (!categoryId) {
      setSubCategories([])
      setSkills([])
      return
    }

    try {
      const [subCategoryRes, skillRes] = await Promise.all([
        getAllSubCategories(categoryId),
        getServiceSkillsByCategory(categoryId)
      ])
      setSubCategories(subCategoryRes)
      setSkills(skillRes)
    } catch {
      toast.error('Unable to load subcategories or skills')
    }
  }

  const handleSubCategory = async (subCategoryId: number) => {
    setForm((prev) => ({ ...prev, serviceSubCategoryId: subCategoryId, serviceSkillId: undefined }))
    if (!subCategoryId || !form.serviceCategoryId) {
      setSkills([])
      return
    }

    try {
      const skillRes = await getServiceSkillsByCategory(form.serviceCategoryId)
      setSkills(skillRes)
    } catch {
      toast.error('Unable to load skills')
    }
  }

  const handleCity = async (cityId: number) => {
    setForm((prev) => ({ ...prev, cityId, zoneId: undefined, podId: undefined }))
    setPods([])

    if (!cityId) {
      setZones([])
      return
    }

    try {
      const zoneRes = await getZonesByCity(cityId)
      setZones(zoneRes)
    } catch {
      toast.error('Unable to load zones')
    }
  }

  const handleZone = async (zoneId: number) => {
    setForm((prev) => ({ ...prev, zoneId, podId: undefined }))

    if (!zoneId) {
      setPods([])
      return
    }

    try {
      const podRes = await getPodsByZone(zoneId)
      setPods(podRes)
    } catch {
      toast.error('Unable to load PODs')
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    const user = getCurrentUser()
    if (!user) return

    if (!form.serviceCategoryId || !form.title || !form.description || !form.preferredTime || !form.cityId || !form.addressLine1) {
      toast.error('Please fill all required fields before submitting')
      return
    }

    try {
      setSaving(true)
      await createJob(user.userId, {
        ...form,
        estimatedBudget: form.estimatedBudget || undefined,
      })
      toast.success('Request submitted successfully')
      router.push('/customer/jobs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create request')
    } finally {
      setSaving(false)
    }
  }

  const formProgress = useMemo(() => {
    let filled = 0
    const total = 7
    if (form.serviceCategoryId) filled++
    if (form.title) filled++
    if (form.description) filled++
    if (form.preferredTime) filled++
    if (form.cityId) filled++
    if (form.addressLine1) filled++
    if (form.estimatedBudget) filled++
    return Math.round((filled / total) * 100)
  }, [form])

  return (
    <div className="px-6 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-primary-light transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to requests
        </Link>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-7 border border-slate-800"
      >
        <p className="text-xs uppercase tracking-wide text-slate-300">Smart Request Builder</p>
        <h1 className="text-3xl font-bold mt-2">Create a request that gets matched faster</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">Complete details improve match quality, reduce confusion, and help providers give better final outcomes.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${formProgress}%` }}
              className="h-full bg-white"
            />
          </div>
          <span className="text-xs text-slate-300">{formProgress}% complete</span>
        </div>
      </motion.section>

      <form onSubmit={submit} className="grid xl:grid-cols-[1.3fr_1fr] gap-5">
        <div className="rounded-2xl glass-dark border border-white/10 p-6 space-y-7">
          <section>
            <h2 className="font-bold text-lg text-white">Service scope</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <SelectField required label="Category" value={form.serviceCategoryId} onChange={(value) => handleCategory(Number(value))}>
                <option value={0}>Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </SelectField>

              {form.serviceCategoryId > 0 && subCategories.length > 0 && (
                <SelectField label="Sub Category (optional)" value={form.serviceSubCategoryId || ''} onChange={(value) => handleSubCategory(value ? Number(value) : 0)}>
                  <option value="">Select subcategory</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                  ))}
                </SelectField>
              )}

              <SelectField label="Skill (optional)" value={form.serviceSkillId || ''} onChange={(value) => setForm((prev) => ({ ...prev, serviceSkillId: value ? Number(value) : undefined }))}>
                <option value="">Select skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </SelectField>
            </div>

            {selectedCategory?.description && <p className="text-xs text-slate-300 mt-2">{selectedCategory.description}</p>}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <InputField required label="Request Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} placeholder="Ex: Bathroom leakage repair" />
              <InputField label="Estimated Budget (₹)" type="number" value={form.estimatedBudget || ''} onChange={(value) => setForm((prev) => ({ ...prev, estimatedBudget: value ? Number(value) : undefined }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1 text-white">Description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400"
              placeholder="Mention issue details, expected outcome, urgency and specific instructions"
            />

            <label className="mt-3 inline-flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={!!form.isEmergency} onChange={(e) => setForm((prev) => ({ ...prev, isEmergency: e.target.checked }))} className="rounded" /> Emergency request
            </label>
          </section>

          <section>
            <h2 className="font-bold text-lg text-white">Schedule & location</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <InputField required label="Preferred Date & Time" type="datetime-local" icon={CalendarDays} value={form.preferredTime} onChange={(value) => setForm((prev) => ({ ...prev, preferredTime: value }))} />
              <SelectField required label="City" value={form.cityId} onChange={(value) => handleCity(Number(value))}>
                <option value={0}>Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </SelectField>

              <SelectField label="Zone" value={form.zoneId || ''} onChange={(value) => handleZone(value ? Number(value) : 0)}>
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </SelectField>

              <SelectField label="POD" value={form.podId || ''} onChange={(value) => setForm((prev) => ({ ...prev, podId: value ? Number(value) : undefined }))}>
                <option value="">Select POD</option>
                {pods.map((pod) => (
                  <option key={pod.id} value={pod.id}>{pod.name}</option>
                ))}
              </SelectField>

              <InputField required label="Address line 1" icon={MapPin} value={form.addressLine1} onChange={(value) => setForm((prev) => ({ ...prev, addressLine1: value }))} />
              <InputField label="Address line 2" value={form.addressLine2 || ''} onChange={(value) => setForm((prev) => ({ ...prev, addressLine2: value }))} />
              <InputField label="Pincode" value={form.pincode || ''} onChange={(value) => setForm((prev) => ({ ...prev, pincode: value }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1 text-white">Special instructions</label>
            <textarea
              rows={3}
              value={form.specialInstructions || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
              className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400"
              placeholder="Landmark, entry notes, contact preference"
            />
          </section>

          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            disabled={saving} 
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-5 py-2.5 font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
          >
            <Send className="w-4 h-4" /> {saving ? 'Submitting...' : 'Submit Request'}
          </motion.button>
        </div>

        <aside className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <h3 className="font-bold text-lg text-white">What happens next</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-green" />We match your request with relevant nearby providers.</li>
              <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-green" />You can track progress and updates in My Requests.</li>
              <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-green" />After completion, payment and rating become available.</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-500/20 p-5"
          >
            <p className="font-semibold text-emerald-200 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />Safety note
            </p>
            <p className="text-xs text-emerald-100 mt-2">Share only necessary details. Avoid sensitive personal information in instructions.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-primary-main/30 bg-primary-main/20 p-5"
          >
            <p className="font-semibold inline-flex items-center gap-2 text-primary-light">
              <Sparkles className="w-4 h-4" />Pro tip
            </p>
            <p className="text-xs text-slate-300 mt-2">Include exact issue scope and preferred slot to reduce provider back-and-forth.</p>
          </motion.div>

          {formProgress < 50 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-amber-400/30 bg-amber-500/20 p-5"
            >
              <p className="font-semibold text-amber-200 inline-flex items-center gap-2">
                <Info className="w-4 h-4" />Quick tip
              </p>
              <p className="text-xs text-amber-100 mt-2">Fill in more details to improve your request quality and get better matches.</p>
            </motion.div>
          )}
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
      <label className="block text-sm font-semibold mb-1 text-white">{label}{required ? ' *' : ''}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl glass border border-white/20 ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50`}
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
      <label className="block text-sm font-semibold mb-1 text-white">{label}{required ? ' *' : ''}</label>
      <select 
        required={required} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
        style={{ colorScheme: 'dark' }}
      >
        {children}
      </select>
    </div>
  )
}
