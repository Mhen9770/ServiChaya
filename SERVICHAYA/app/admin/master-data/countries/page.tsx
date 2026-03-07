'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllCountries, createCountry, updateCountry, deleteCountry, 
  type CountryMasterDto 
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, Globe, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<CountryMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingCountry, setEditingCountry] = useState<CountryMasterDto | null>(null)
  const [formData, setFormData] = useState<CountryMasterDto>({
    code: '',
    name: '',
    description: '',
    countryCode: '',
    currencyCode: '',
    phoneCode: '',
    isActive: true
  })

  useEffect(() => {
    fetchCountries()
  }, [currentPage, pageSize, sortKey, sortDirection])

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllCountries(currentPage, pageSize, sortKey, sortDirection)
      setCountries(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch countries:', error)
      toast.error(error.response?.data?.message || 'Failed to load countries')
      setCountries([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, sortKey, sortDirection])

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
    setCurrentPage(0)
  }

  const handleCreate = () => {
    setEditingCountry(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      countryCode: '',
      currencyCode: '',
      phoneCode: '',
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (country: CountryMasterDto) => {
    setEditingCountry(country)
    setFormData({ ...country })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this country?')) return

    try {
      await deleteCountry(id)
      toast.success('Country deleted successfully')
      fetchCountries()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete country')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingCountry?.id) {
        await updateCountry(editingCountry.id, formData)
        toast.success('Country updated successfully')
      } else {
        await createCountry(formData)
        toast.success('Country created successfully')
      }
      setShowModal(false)
      fetchCountries()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save country')
    }
  }

  const columns: Column<CountryMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (country) => (
        <span className="font-semibold text-primary-main">{country.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (country) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{country.name}</span>
        </div>
      )
    },
    {
      key: 'countryCode',
      header: 'Country Code',
      render: (country) => <span className="text-sm">{country.countryCode || 'N/A'}</span>
    },
    {
      key: 'currencyCode',
      header: 'Currency',
      render: (country) => <span className="text-sm">{country.currencyCode || 'N/A'}</span>
    },
    {
      key: 'phoneCode',
      header: 'Phone Code',
      render: (country) => <span className="text-sm">{country.phoneCode || 'N/A'}</span>
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (country) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          country.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {country.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {country.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (country) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(country)}
            className="p-1.5 rounded-lg hover:bg-neutral-background transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-primary-main" />
          </button>
          <button
            onClick={() => country.id && handleDelete(country.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ]

  if (loading && countries.length === 0) {
    return <SkeletonTable rows={10} cols={7} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary">Countries</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">Manage country master data</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Country
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-6">
        <DataTable
          data={countries}
          columns={columns}
          onSort={handleSort}
          currentSortKey={sortKey}
          currentSortDirection={sortDirection}
        />

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-border">
              <h2 className="text-xl font-bold text-neutral-textPrimary">
                {editingCountry ? 'Edit Country' : 'Add New Country'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={formData.countryCode || ''}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={formData.currencyCode || ''}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                    Phone Code
                  </label>
                  <input
                    type="text"
                    value={formData.phoneCode || ''}
                    onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-textPrimary mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-neutral-border rounded-lg hover:bg-neutral-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {editingCountry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
