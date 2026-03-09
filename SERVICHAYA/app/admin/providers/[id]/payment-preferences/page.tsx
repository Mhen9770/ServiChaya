'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
import { 
  getPaymentPreferences, createPaymentPreference, updatePaymentPreference, deletePaymentPreference,
  type PaymentPreferenceDto, type CreatePaymentPreferenceDto 
} from '@/lib/services/payment'
import { getCategoryById, getAllCategories, type ServiceCategory } from '@/lib/services/service'
import Loader from '@/components/ui/Loader'

export default function ProviderPaymentPreferencesPage() {
  const router = useRouter()
  const params = useParams()
  const providerId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [preferences, setPreferences] = useState<PaymentPreferenceDto[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreatePaymentPreferenceDto>({
    serviceCategoryId: undefined,
    paymentType: 'POST_WORK',
    partialPaymentPercentage: undefined,
    minimumUpfrontAmount: undefined,
    hourlyRate: undefined,
  })

  useEffect(() => {
    fetchData()
  }, [providerId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [prefs, cats] = await Promise.all([
        getPaymentPreferences(providerId),
        getAllCategories(false, undefined, true).catch(() => [])
      ])
      setPreferences(prefs)
      setCategories(cats)
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load payment preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.paymentType) {
      toast.error('Please select payment type')
      return
    }

    if (formData.paymentType === 'PARTIAL' && !formData.partialPaymentPercentage) {
      toast.error('Please enter partial payment percentage')
      return
    }

    try {
      setSubmitting(true)
      if (editingId) {
        await updatePaymentPreference(editingId, formData)
        toast.success('Payment preference updated')
      } else {
        await createPaymentPreference(providerId, formData)
        toast.success('Payment preference created')
      }
      setShowModal(false)
      setEditingId(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Failed to save preference:', error)
      toast.error(error.response?.data?.message || 'Failed to save preference')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (pref: PaymentPreferenceDto) => {
    setEditingId(pref.id)
    setFormData({
      serviceCategoryId: pref.serviceCategoryId,
      paymentType: pref.paymentType,
      partialPaymentPercentage: pref.partialPaymentPercentage,
      minimumUpfrontAmount: pref.minimumUpfrontAmount,
      hourlyRate: pref.hourlyRate,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment preference?')) return

    try {
      setDeleting(id)
      await deletePaymentPreference(id)
      toast.success('Payment preference deleted')
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete preference:', error)
      toast.error('Failed to delete preference')
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setFormData({
      serviceCategoryId: undefined,
      paymentType: 'POST_WORK',
      partialPaymentPercentage: undefined,
      minimumUpfrontAmount: undefined,
      hourlyRate: undefined,
    })
  }

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Default (All Categories)'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || `Category #${categoryId}`
  }

  if (loading) return <Loader />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Provider
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Payment Preferences</h1>
              <p className="text-slate-300 mt-1">Configure payment settings for Provider #{providerId}</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setEditingId(null)
                setShowModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Preference
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
        >
          {preferences.length === 0 ? (
            <div className="text-center py-12 text-slate-300">
              <p>No payment preferences configured</p>
              <p className="text-sm mt-2">Click "Add Preference" to configure payment settings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {preferences.map((pref) => (
                <div
                  key={pref.id}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-primary-main/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          {getCategoryName(pref.serviceCategoryId)}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          pref.paymentType === 'FULL' ? 'bg-blue-500/20 text-blue-300' :
                          pref.paymentType === 'PARTIAL' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {pref.paymentType}
                        </span>
                        {pref.isActive ? (
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">Active</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">Inactive</span>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-300">
                        {pref.partialPaymentPercentage && (
                          <p>Partial Payment: {pref.partialPaymentPercentage}%</p>
                        )}
                        {pref.minimumUpfrontAmount && (
                          <p>Min Upfront: ₹{pref.minimumUpfrontAmount.toLocaleString()}</p>
                        )}
                        {pref.hourlyRate && (
                          <p>Hourly Rate: ₹{pref.hourlyRate.toLocaleString()}/hr</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(pref)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pref.id)}
                        disabled={deleting === pref.id}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        {deleting === pref.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit' : 'Add'} Payment Preference
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">
                    Service Category (Optional)
                  </label>
                  <select
                    value={formData.serviceCategoryId || ''}
                    onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-main focus:outline-none"
                  >
                    <option value="">Default (All Categories)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-main focus:outline-none"
                    required
                  >
                    <option value="POST_WORK">Post Work Payment</option>
                    <option value="PARTIAL">Partial Payment</option>
                    <option value="FULL">Full Payment (Upfront)</option>
                  </select>
                </div>

                {formData.paymentType === 'PARTIAL' && (
                  <div>
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">
                      Partial Payment Percentage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.partialPaymentPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, partialPaymentPercentage: Number(e.target.value) })}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-main focus:outline-none"
                      placeholder="e.g., 30"
                      required={formData.paymentType === 'PARTIAL'}
                    />
                    <p className="text-xs text-slate-400 mt-1">Percentage of total amount to be paid upfront</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">
                    Minimum Upfront Amount (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumUpfrontAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minimumUpfrontAmount: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-main focus:outline-none"
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">
                    Hourly Rate (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate || ''}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-main focus:outline-none"
                    placeholder="e.g., 150"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingId(null)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editingId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingId ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
