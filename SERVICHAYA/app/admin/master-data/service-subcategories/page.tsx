'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  // NOTE: Legacy sub-category master is deprecated in backend. We keep this page for future use,
  // but for MVP we only need categories. So we only load categories here and disable editing.
  getAllServiceCategories, type ServiceCategoryMasterDto
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, List, CheckCircle2, XCircle, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminServiceSubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<ServiceCategoryMasterDto[]>([])
  const [categories, setCategories] = useState<ServiceCategoryMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingSubCategory, setEditingSubCategory] = useState<ServiceCategoryMasterDto | null>(null)
  const [formData, setFormData] = useState<ServiceCategoryMasterDto>({
    code: '',
    name: '',
    description: '',
    parentId: undefined,
    iconUrl: '',
    displayOrder: 0,
    isFeatured: false,
    isActive: true
  })

  useEffect(() => {
    loadCategories()
    // Sub-category master is deprecated; do not call missing APIs to avoid build/runtime errors.
    // fetchSubCategories()
    setLoading(false)
  }, [currentPage, pageSize, sortKey, sortDirection])

  const loadCategories = async () => {
    try {
      const result = await getAllServiceCategories(0, 1000)
      setCategories(result.content || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  // Legacy fetch function kept for reference; currently unused
  const fetchSubCategories = useCallback(async () => {
    setSubCategories([])
    setTotalPages(0)
    setTotalElements(0)
  }, [currentPage, pageSize, sortKey, sortDirection])

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
    setCurrentPage(0)
  }

  const handleCreate = () => {
    setEditingSubCategory(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      parentId: undefined,
      iconUrl: '',
      displayOrder: 0,
      isFeatured: false,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (subCategory: ServiceCategoryMasterDto) => {
    setEditingSubCategory(subCategory)
    setFormData({
      ...subCategory,
      parentId: subCategory.parentId,
      displayOrder: subCategory.displayOrder || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (_id: number) => {
    toast.error('Service subcategory master is deprecated. Please manage hierarchy via Service Categories page.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      // Backend no longer supports separate sub-category master.
      toast.error('Service subcategory master is deprecated. Please use Service Categories for hierarchy.')
      setShowModal(false)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save service subcategory'
      toast.error(errorMsg)
    }
  }

  const columns: Column<ServiceCategoryMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (subCat) => (
        <span className="font-semibold text-primary-main">{subCat.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (subCat) => (
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{subCat.name}</span>
        </div>
      )
    },
    {
      key: 'categoryName',
      header: 'Category',
      render: (subCat) => (
        <span className="text-sm text-neutral-textSecondary">
          {subCat.parentId ? categories.find(c => c.id === subCat.parentId)?.name || 'N/A' : 'Root Category'}
        </span>
      )
    },
    {
      key: 'displayOrder',
      header: 'Order',
      sortable: true,
      render: (subCat) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-main/10 text-primary-main">
          {subCat.displayOrder || 0}
        </span>
      )
    },
    {
      key: 'isFeatured',
      header: 'Featured',
      sortable: true,
      render: (subCat) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          subCat.isFeatured 
            ? 'bg-warm-orange/20 text-warm-orange' 
            : 'bg-neutral-background text-neutral-textSecondary'
        }`}>
          {subCat.isFeatured && <Star className="w-3 h-3" />}
          {subCat.isFeatured ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (subCat) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          subCat.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {subCat.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {subCat.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (subCat) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(subCat)}
            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => subCat.id && handleDelete(subCat.id)}
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
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Service SubCategories</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Create and manage service subcategory master data</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add SubCategory
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
            { key: 'displayOrder', label: 'Order' },
            { key: 'isFeatured', label: 'Featured' },
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
            data={subCategories}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No service subcategories found. Create your first subcategory!"
          />

          {subCategories.length > 0 && (
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
              {editingSubCategory ? 'Edit Service SubCategory' : 'Create New Service SubCategory'}
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
                    placeholder="SUBCAT_CODE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder || 0}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  required
                >
                  <option value={0}>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="SubCategory Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="SubCategory description..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Icon URL</label>
                <input
                  type="url"
                  value={formData.iconUrl || ''}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  placeholder="https://example.com/icon.png or emoji"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured || false}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                  />
                  <span className="text-sm font-semibold text-neutral-textPrimary">Featured</span>
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
                  {editingSubCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
