'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllZones, createZone, updateZone, deleteZone, getZonesByCity,
  getAllActiveCities, type ZoneMasterDto, type CityMasterDto 
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminZonesPage() {
  const [zones, setZones] = useState<ZoneMasterDto[]>([])
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState<ZoneMasterDto | null>(null)
  const [formData, setFormData] = useState<ZoneMasterDto>({
    code: '',
    name: '',
    description: '',
    cityId: 0,
    latitude: undefined,
    longitude: undefined,
    servicePriority: 0,
    isActive: true
  })

  useEffect(() => {
    fetchCities()
    fetchZones()
  }, [currentPage, pageSize, sortKey, sortDirection])

  const fetchCities = async () => {
    try {
      const citiesData = await getAllActiveCities()
      setCities(citiesData)
    } catch (error: any) {
      console.error('Failed to fetch cities:', error)
    }
  }

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllZones(currentPage, pageSize, sortKey, sortDirection)
      setZones(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch zones:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load zones'
      toast.error(errorMsg)
      setZones([])
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
    setEditingZone(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      cityId: cities.length > 0 ? cities[0].id || 0 : 0,
      latitude: undefined,
      longitude: undefined,
      servicePriority: 0,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (zone: ZoneMasterDto) => {
    setEditingZone(zone)
    setFormData({
      ...zone,
      cityId: zone.cityId || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this zone?')) return

    try {
      await deleteZone(id)
      toast.success('Zone deleted successfully')
      fetchZones()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete zone'
      toast.error(errorMsg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code || !formData.cityId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingZone?.id) {
        await updateZone(editingZone.id, formData)
        toast.success('Zone updated successfully')
      } else {
        await createZone(formData)
        toast.success('Zone created successfully')
      }
      setShowModal(false)
      fetchZones()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save zone'
      toast.error(errorMsg)
    }
  }

  const columns: Column<ZoneMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (zone) => (
        <span className="font-semibold text-primary-main">{zone.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (zone) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{zone.name}</span>
        </div>
      )
    },
    {
      key: 'cityName',
      header: 'City',
      render: (zone) => <span className="text-sm text-neutral-textSecondary">{zone.cityName || 'N/A'}</span>
    },
    {
      key: 'servicePriority',
      header: 'Priority',
      sortable: true,
      render: (zone) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-main/10 text-primary-main">
          {zone.servicePriority || 0}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (zone) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          zone.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {zone.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {zone.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (zone) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(zone)}
            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => zone.id && handleDelete(zone.id)}
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
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Zones</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Create and manage zone master data</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Zone
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
            { key: 'zoneCode', label: 'Zone Code' },
            { key: 'servicePriority', label: 'Priority' },
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
            data={zones}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No zones found. Create your first zone!"
          />

          {zones.length > 0 && (
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
              {editingZone ? 'Edit Zone' : 'Create New Zone'}
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
                    placeholder="ZONE_CODE"
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
                  placeholder="Zone Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.cityId}
                  onChange={(e) => setFormData({ ...formData, cityId: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  required
                >
                  <option value={0}>Select City</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Zone description..."
                />
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
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Service Priority</label>
                  <input
                    type="number"
                    value={formData.servicePriority || 0}
                    onChange={(e) => setFormData({ ...formData, servicePriority: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
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
                  {editingZone ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
