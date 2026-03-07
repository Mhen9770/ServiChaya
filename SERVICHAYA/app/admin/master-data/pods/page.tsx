'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllPods, createPod, updatePod, deletePod,
  getAllActiveCities, getZonesByCity,
  type PodMasterDto, type CityMasterDto, type ZoneMasterDto 
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminPodsPage() {
  const [pods, setPods] = useState<PodMasterDto[]>([])
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [zones, setZones] = useState<ZoneMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingPod, setEditingPod] = useState<PodMasterDto | null>(null)
  const [formData, setFormData] = useState<PodMasterDto>({
    code: '',
    name: '',
    description: '',
    cityId: 0,
    zoneId: 0,
    latitude: 0,
    longitude: 0,
    serviceRadiusKm: 0,
    maxProviders: undefined,
    maxWorkforce: undefined,
    isActive: true
  })

  useEffect(() => {
    fetchCities()
    fetchPods()
  }, [currentPage, pageSize, sortKey, sortDirection])

  useEffect(() => {
    if (formData.cityId > 0) {
      fetchZonesForCity(formData.cityId)
    } else {
      setZones([])
    }
  }, [formData.cityId])

  const fetchCities = async () => {
    try {
      const citiesData = await getAllActiveCities()
      setCities(citiesData)
    } catch (error: any) {
      console.error('Failed to fetch cities:', error)
    }
  }

  const fetchZonesForCity = async (cityId: number) => {
    try {
      const zonesData = await getZonesByCity(cityId)
      setZones(zonesData)
      if (zonesData.length > 0 && formData.zoneId === 0) {
        setFormData({ ...formData, zoneId: zonesData[0].id || 0 })
      }
    } catch (error: any) {
      console.error('Failed to fetch zones:', error)
      setZones([])
    }
  }

  const fetchPods = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllPods(currentPage, pageSize, sortKey, sortDirection)
      setPods(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch PODs:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load PODs'
      toast.error(errorMsg)
      setPods([])
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
    setEditingPod(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      cityId: cities.length > 0 ? cities[0].id || 0 : 0,
      zoneId: 0,
      latitude: 0,
      longitude: 0,
      serviceRadiusKm: 0,
      maxProviders: undefined,
      maxWorkforce: undefined,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (pod: PodMasterDto) => {
    setEditingPod(pod)
    setFormData({
      ...pod,
      cityId: pod.cityId || 0,
      zoneId: pod.zoneId || 0
    })
    if (pod.cityId) {
      fetchZonesForCity(pod.cityId)
    }
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this POD?')) return

    try {
      await deletePod(id)
      toast.success('POD deleted successfully')
      fetchPods()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete POD'
      toast.error(errorMsg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code || !formData.cityId || !formData.zoneId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      toast.error('Please provide valid latitude and longitude')
      return
    }

    try {
      if (editingPod?.id) {
        await updatePod(editingPod.id, formData)
        toast.success('POD updated successfully')
      } else {
        await createPod(formData)
        toast.success('POD created successfully')
      }
      setShowModal(false)
      fetchPods()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save POD'
      toast.error(errorMsg)
    }
  }

  const columns: Column<PodMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (pod) => (
        <span className="font-semibold text-primary-main">{pod.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (pod) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{pod.name}</span>
        </div>
      )
    },
    {
      key: 'cityName',
      header: 'City',
      render: (pod) => <span className="text-sm text-neutral-textSecondary">{pod.cityName || 'N/A'}</span>
    },
    {
      key: 'zoneName',
      header: 'Zone',
      render: (pod) => <span className="text-sm text-neutral-textSecondary">{pod.zoneName || 'N/A'}</span>
    },
    {
      key: 'serviceRadiusKm',
      header: 'Radius (km)',
      sortable: true,
      render: (pod) => <span className="text-sm">{pod.serviceRadiusKm || 0} km</span>
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (pod) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          pod.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {pod.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {pod.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (pod) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(pod)}
            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => pod.id && handleDelete(pod.id)}
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
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage PODs</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Create and manage POD master data</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add POD
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
            { key: 'podCode', label: 'POD Code' },
            { key: 'serviceRadiusKm', label: 'Radius' },
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
            data={pods}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No PODs found. Create your first POD!"
          />

          {pods.length > 0 && (
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
              {editingPod ? 'Edit POD' : 'Create New POD'}
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
                    placeholder="POD_CODE"
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
                  placeholder="POD Name"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cityId}
                    onChange={(e) => {
                      const cityId = Number(e.target.value)
                      setFormData({ ...formData, cityId, zoneId: 0 })
                      if (cityId > 0) {
                        fetchZonesForCity(cityId)
                      }
                    }}
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
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.zoneId}
                    onChange={(e) => setFormData({ ...formData, zoneId: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                    disabled={!formData.cityId || zones.length === 0}
                  >
                    <option value={0}>Select Zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="POD description..."
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                    placeholder="23.2599"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                    placeholder="77.4126"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Service Radius (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.serviceRadiusKm}
                    onChange={(e) => setFormData({ ...formData, serviceRadiusKm: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Max Providers</label>
                  <input
                    type="number"
                    value={formData.maxProviders || ''}
                    onChange={(e) => setFormData({ ...formData, maxProviders: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Max Workforce</label>
                  <input
                    type="number"
                    value={formData.maxWorkforce || ''}
                    onChange={(e) => setFormData({ ...formData, maxWorkforce: e.target.value ? Number(e.target.value) : undefined })}
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
                  {editingPod ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
