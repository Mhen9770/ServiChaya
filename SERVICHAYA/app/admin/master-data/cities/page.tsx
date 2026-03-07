'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getAllCities, createCity, updateCity, deleteCity,
  getAllActiveStates,
  type CityMasterDto, type StateMasterDto
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, MapPin, Eye, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminCitiesPage() {
  const router = useRouter()
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [states, setStates] = useState<StateMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingCity, setEditingCity] = useState<CityMasterDto | null>(null)
  const [formData, setFormData] = useState<CityMasterDto>({
    code: '',
    name: '',
    description: '',
    stateId: 1,
    latitude: undefined,
    longitude: undefined,
    timezone: '',
    population: undefined,
    isServiceable: false,
    isActive: true
  })

  useEffect(() => {
    fetchStates()
    fetchCities()
  }, [currentPage, pageSize, sortKey, sortDirection])

  const fetchStates = async () => {
    try {
      const result = await getAllActiveStates()
      setStates(result || [])
      if (result.length > 0 && formData.stateId === 1) {
        setFormData({ ...formData, stateId: result[0].id || 0 })
      }
    } catch (error: any) {
      console.error('Failed to fetch states:', error)
    }
  }

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllCities(currentPage, pageSize, sortKey, sortDirection)
      setCities(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch cities:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load cities'
      toast.error(errorMsg)
      setCities([])
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
    setEditingCity(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      stateId: states[0]?.id || 0,
      latitude: undefined,
      longitude: undefined,
      timezone: '',
      population: undefined,
      isServiceable: false,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (city: CityMasterDto) => {
    setEditingCity(city)
    setFormData({
      ...city,
      stateId: city.stateId || 1
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this city?')) return

    try {
      await deleteCity(id)
      toast.success('City deleted successfully')
      fetchCities()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete city'
      toast.error(errorMsg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingCity?.id) {
        await updateCity(editingCity.id, formData)
        toast.success('City updated successfully')
      } else {
        await createCity(formData)
        toast.success('City created successfully')
      }
      setShowModal(false)
      fetchCities()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save city'
      toast.error(errorMsg)
    }
  }

  const columns: Column<CityMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (city) => (
        <span className="font-semibold text-primary-main">{city.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (city) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{city.name}</span>
        </div>
      )
    },
    {
      key: 'stateName',
      header: 'State',
      render: (city) => <span className="text-sm text-neutral-textSecondary">{city.stateName || 'N/A'}</span>
    },
    {
      key: 'isServiceable',
      header: 'Serviceable',
      render: (city) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          city.isServiceable 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-neutral-background text-neutral-textSecondary'
        }`}>
          {city.isServiceable ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (city) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          city.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {city.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {city.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (city) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(city)}
            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => city.id && handleDelete(city.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Cities</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Create and manage city master data</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add City
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FilterBar
          filters={[]}
          onFilterChange={() => {}}
          initialFilters={{}}
          sortOptions={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'cityCode', label: 'City Code' },
            { key: 'isActive', label: 'Status' }
          ]}
          currentSortBy={sortKey}
          currentSortDir={sortDirection}
          onSortChange={handleSort}
        />
      </motion.div>

      {loading ? (
        <SkeletonTable />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <DataTable
            data={cities}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No cities found. Create your first city!"
          />

          {cities.length > 0 && (
            <div className="mt-4">
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
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-neutral-textPrimary mb-4 font-display">
              {editingCity ? 'Edit City' : 'Create New City'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                    placeholder="CITY_CODE"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  required
                  placeholder="City Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="City description..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stateId}
                    onChange={(e) => setFormData({ ...formData, stateId: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                  >
                    <option value={0}>Select State</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Timezone</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    placeholder="Asia/Kolkata"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    placeholder="23.2599"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    placeholder="77.4126"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Population</label>
                  <input
                    type="number"
                    value={formData.population || ''}
                    onChange={(e) => setFormData({ ...formData, population: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    placeholder="1000000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isServiceable || false}
                    onChange={(e) => setFormData({ ...formData, isServiceable: e.target.checked })}
                    className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                  />
                  <span className="text-sm font-semibold text-neutral-textPrimary">Serviceable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                  />
                  <span className="text-sm font-semibold text-neutral-textPrimary">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-neutral-border text-neutral-textSecondary rounded-xl font-semibold hover:bg-neutral-background transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-md transition-all"
                >
                  {editingCity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
