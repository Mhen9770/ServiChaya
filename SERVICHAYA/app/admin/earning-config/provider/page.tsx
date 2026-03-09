'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getProviderEarningConfigs, createProviderEarningConfig, updateProviderEarningConfig, deleteProviderEarningConfig,
  type ProviderEarningConfigDto,
  getProviders,
  getAllServiceCategories
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/ui/Pagination'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, User, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProviderEarningConfigPage() {
  const [configs, setConfigs] = useState<ProviderEarningConfigDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ProviderEarningConfigDto | null>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filterProviderId, setFilterProviderId] = useState<number | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<Partial<ProviderEarningConfigDto>>({
    providerId: undefined,
    serviceCategoryId: undefined,
    earningModel: 'COMMISSION_ONLY',
    commissionPercentage: undefined,
    fixedCommissionAmount: undefined,
    minimumCommission: undefined,
    maximumCommission: undefined,
    leadPrice: undefined,
    leadPricePercentage: undefined,
    minimumLeadPrice: undefined,
    maximumLeadPrice: undefined,
    hybridCommissionWeight: undefined,
    hybridLeadWeight: undefined,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: undefined,
    reason: '',
    isActive: true
  })

  useEffect(() => {
    fetchConfigs()
    fetchProviders()
    fetchCategories()
  }, [currentPage, pageSize, filterProviderId])

  const fetchProviders = async () => {
    try {
      const result = await getProviders('ACTIVE', 0, 1000)
      setProviders(result.content || [])
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const result = await getAllServiceCategories(0, 1000, 'name', 'asc')
      setCategories(result.content || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getProviderEarningConfigs(filterProviderId, currentPage, pageSize)
      setConfigs(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch provider earning configs:', error)
      toast.error(error.response?.data?.message || 'Failed to load configurations')
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filterProviderId])

  const handleCreate = () => {
    setEditingConfig(null)
    setFormData({
      providerId: undefined,
      serviceCategoryId: undefined,
      earningModel: 'COMMISSION_ONLY',
      commissionPercentage: undefined,
      fixedCommissionAmount: undefined,
      minimumCommission: undefined,
      maximumCommission: undefined,
      leadPrice: undefined,
      leadPricePercentage: undefined,
      minimumLeadPrice: undefined,
      maximumLeadPrice: undefined,
      hybridCommissionWeight: undefined,
      hybridLeadWeight: undefined,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveUntil: undefined,
      reason: '',
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (config: ProviderEarningConfigDto) => {
    setEditingConfig(config)
    setFormData({
      ...config,
      effectiveFrom: config.effectiveFrom ? config.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
      effectiveUntil: config.effectiveUntil ? config.effectiveUntil.split('T')[0] : undefined
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return
    
    try {
      setDeleting(id)
      await deleteProviderEarningConfig(id)
      toast.success('Configuration deleted successfully')
      fetchConfigs()
    } catch (error: any) {
      console.error('Failed to delete configuration:', error)
      toast.error(error.response?.data?.message || 'Failed to delete configuration')
    } finally {
      setDeleting(null)
    }
  }

  const handleSubmit = async () => {
    if (!formData.providerId) {
      toast.error('Please select a provider')
      return
    }

    try {
      setSubmitting(true)
      if (editingConfig?.id) {
        await updateProviderEarningConfig(editingConfig.id, formData)
        toast.success('Configuration updated successfully')
      } else {
        await createProviderEarningConfig(formData)
        toast.success('Configuration created successfully')
      }
      setShowModal(false)
      fetchConfigs()
    } catch (error: any) {
      console.error('Failed to save configuration:', error)
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: Column<ProviderEarningConfigDto>[] = [
    { key: 'id', header: 'ID', sortable: true },
    {
      key: 'providerId',
      header: 'Provider',
      render: (config) => {
        const provider = providers.find(p => p.id === config.providerId)
        return provider ? `#${config.providerId} - ${provider.businessName || provider.providerCode}` : `Provider #${config.providerId}`
      }
    },
    { 
      key: 'earningModel', 
      header: 'Model', 
      render: (config) => (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
          {config.earningModel}
        </span>
      )
    },
    {
      key: 'serviceCategoryId',
      header: 'Category',
      render: (config) => {
        if (!config.serviceCategoryId) return 'All Categories'
        const category = categories.find(c => c.id === config.serviceCategoryId)
        return category ? category.name : `ID: ${config.serviceCategoryId}`
      }
    },
    {
      key: 'commissionPercentage',
      header: 'Commission %',
      render: (config) => config.commissionPercentage ? `${config.commissionPercentage}%` : '-'
    },
    {
      key: 'leadPrice',
      header: 'Lead Price',
      render: (config) => config.leadPrice ? `₹${config.leadPrice}` : '-'
    },
    {
      key: 'effectiveFrom',
      header: 'Effective From',
      render: (config) => config.effectiveFrom ? new Date(config.effectiveFrom).toLocaleDateString() : '-'
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (config) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          config.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {config.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (config) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(config)}
            className="text-primary-main hover:text-primary-dark transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(config.id!)}
            disabled={deleting === config.id}
            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting === config.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )
    }
  ]

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
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Provider Earning Configuration</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Manage provider-specific earning overrides</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Config
          </button>
        </div>
      </motion.div>

      {/* Filter */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
          Filter by Provider
        </label>
        <select
          value={filterProviderId || ''}
          onChange={(e) => {
            setFilterProviderId(e.target.value ? Number(e.target.value) : undefined)
            setCurrentPage(0)
          }}
          className="w-full max-w-xs px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
        >
          <option value="">All Providers</option>
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              #{provider.id} - {provider.businessName || provider.providerCode}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <DataTable
            data={configs}
            columns={columns}
            onSort={() => {}}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-textPrimary">
                {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-textSecondary hover:text-neutral-textPrimary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Provider *
                </label>
                <select
                  value={formData.providerId || ''}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                  required
                  disabled={!!editingConfig}
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      #{provider.id} - {provider.businessName || provider.providerCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Service Category (Leave empty for default)
                </label>
                <select
                  value={formData.serviceCategoryId || ''}
                  onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                >
                  <option value="">Default (All Categories)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Earning Model */}
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Earning Model *
                </label>
                <select
                  value={formData.earningModel || 'COMMISSION_ONLY'}
                  onChange={(e) => setFormData({ ...formData, earningModel: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                >
                  <option value="COMMISSION_ONLY">Commission Only</option>
                  <option value="LEAD_ONLY">Lead Only</option>
                  <option value="HYBRID">Hybrid (Both)</option>
                </select>
              </div>

              {/* Commission Fields */}
              {(formData.earningModel === 'COMMISSION_ONLY' || formData.earningModel === 'HYBRID') && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="col-span-2 font-semibold text-neutral-textPrimary mb-2">Commission Settings</h3>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Commission Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.commissionPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, commissionPercentage: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Fixed Commission Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fixedCommissionAmount || ''}
                      onChange={(e) => setFormData({ ...formData, fixedCommissionAmount: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Minimum Commission (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumCommission || ''}
                      onChange={(e) => setFormData({ ...formData, minimumCommission: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Maximum Commission (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maximumCommission || ''}
                      onChange={(e) => setFormData({ ...formData, maximumCommission: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Lead Fields */}
              {(formData.earningModel === 'LEAD_ONLY' || formData.earningModel === 'HYBRID') && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="col-span-2 font-semibold text-neutral-textPrimary mb-2">Lead Price Settings</h3>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Fixed Lead Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.leadPrice || ''}
                      onChange={(e) => setFormData({ ...formData, leadPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Lead Price Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.leadPricePercentage || ''}
                      onChange={(e) => setFormData({ ...formData, leadPricePercentage: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Minimum Lead Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumLeadPrice || ''}
                      onChange={(e) => setFormData({ ...formData, minimumLeadPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Maximum Lead Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maximumLeadPrice || ''}
                      onChange={(e) => setFormData({ ...formData, maximumLeadPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Hybrid Weights */}
              {formData.earningModel === 'HYBRID' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                  <h3 className="col-span-2 font-semibold text-neutral-textPrimary mb-2">Hybrid Model Weights</h3>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Commission Weight (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hybridCommissionWeight || ''}
                      onChange={(e) => setFormData({ ...formData, hybridCommissionWeight: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                      Lead Weight (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hybridLeadWeight || ''}
                      onChange={(e) => setFormData({ ...formData, hybridLeadWeight: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Effective Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveFrom || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Effective Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveUntil || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveUntil: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent"
                  rows={3}
                  placeholder="Reason for this provider-specific override"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-border rounded-lg hover:bg-neutral-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingConfig ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingConfig ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
