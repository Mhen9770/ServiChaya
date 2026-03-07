'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllStates, createState, updateState, deleteState, getStatesByCountry,
  getAllActiveCountries,
  type StateMasterDto, type CountryMasterDto
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminStatesPage() {
  const [states, setStates] = useState<StateMasterDto[]>([])
  const [countries, setCountries] = useState<CountryMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingState, setEditingState] = useState<StateMasterDto | null>(null)
  const [formData, setFormData] = useState<StateMasterDto>({
    code: '',
    name: '',
    description: '',
    countryId: 0,
    isActive: true
  })

  useEffect(() => {
    fetchCountries()
    fetchStates()
  }, [currentPage, pageSize, sortKey, sortDirection])

  const fetchCountries = async () => {
    try {
      const result = await getAllActiveCountries()
      setCountries(result || [])
      if (result.length > 0 && formData.countryId === 0) {
        setFormData({ ...formData, countryId: result[0].id || 0 })
      }
    } catch (error: any) {
      console.error('Failed to fetch countries:', error)
    }
  }

  const fetchStates = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllStates(currentPage, pageSize, sortKey, sortDirection)
      setStates(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch states:', error)
      toast.error(error.response?.data?.message || 'Failed to load states')
      setStates([])
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
    setEditingState(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      countryId: countries[0]?.id || 0,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (state: StateMasterDto) => {
    setEditingState(state)
    setFormData({ ...state })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this state?')) return

    try {
      await deleteState(id)
      toast.success('State deleted successfully')
      fetchStates()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete state')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code || !formData.countryId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingState?.id) {
        await updateState(editingState.id, formData)
        toast.success('State updated successfully')
      } else {
        await createState(formData)
        toast.success('State created successfully')
      }
      setShowModal(false)
      fetchStates()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save state')
    }
  }

  const columns: Column<StateMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (state) => (
        <span className="font-semibold text-primary-main">{state.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (state) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{state.name}</span>
        </div>
      )
    },
    {
      key: 'countryName',
      header: 'Country',
      render: (state) => <span className="text-sm text-neutral-textSecondary">{state.countryName || 'N/A'}</span>
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (state) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          state.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {state.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {state.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (state) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(state)}
            className="p-1.5 rounded-lg hover:bg-neutral-background transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-primary-main" />
          </button>
          <button
            onClick={() => state.id && handleDelete(state.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ]

  if (loading && states.length === 0) {
    return <SkeletonTable rows={10} cols={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary">States</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">Manage state master data</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add State
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-6">
        <DataTable
          data={states}
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
                {editingState ? 'Edit State' : 'Add New State'}
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
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.countryId}
                    onChange={(e) => setFormData({ ...formData, countryId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
                    required
                  >
                    <option value={0}>Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
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
                  {editingState ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
