'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllServiceSkills, createServiceSkill, updateServiceSkill, deleteServiceSkill,
  type ServiceSkillMasterDto 
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/ui/Pagination'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, Wrench, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminServiceSkillsPage() {
  const [skills, setSkills] = useState<ServiceSkillMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState<ServiceSkillMasterDto | null>(null)
  const [formData, setFormData] = useState<ServiceSkillMasterDto>({
    code: '',
    name: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    fetchSkills()
  }, [currentPage, pageSize, sortKey, sortDirection])

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllServiceSkills(currentPage, pageSize, sortKey, sortDirection)
      setSkills(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch service skills:', error)
      toast.error(error.response?.data?.message || 'Failed to load service skills')
      setSkills([])
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
    setEditingSkill(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (skill: ServiceSkillMasterDto) => {
    setEditingSkill(skill)
    setFormData({ ...skill })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service skill?')) return

    try {
      await deleteServiceSkill(id)
      toast.success('Service skill deleted successfully')
      fetchSkills()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete service skill')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingSkill?.id) {
        await updateServiceSkill(editingSkill.id, formData)
        toast.success('Service skill updated successfully')
      } else {
        await createServiceSkill(formData)
        toast.success('Service skill created successfully')
      }
      setShowModal(false)
      fetchSkills()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save service skill')
    }
  }

  const columns: Column<ServiceSkillMasterDto>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (skill) => (
        <span className="font-semibold text-primary-main">{skill.code}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (skill) => (
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{skill.name}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (skill) => (
        <span className="text-sm text-neutral-textSecondary line-clamp-2">
          {skill.description || 'N/A'}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (skill) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          skill.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {skill.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {skill.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (skill) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(skill)}
            className="p-1.5 rounded-lg hover:bg-neutral-background transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-primary-main" />
          </button>
          <button
            onClick={() => skill.id && handleDelete(skill.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ]

  if (loading && skills.length === 0) {
    return <SkeletonTable rows={10} cols={5} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary">Service Skills</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">Manage service skill master data</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-6">
        <DataTable
          data={skills}
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
                {editingSkill ? 'Edit Service Skill' : 'Add New Service Skill'}
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

                <div className="col-span-2">
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
                  {editingSkill ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
