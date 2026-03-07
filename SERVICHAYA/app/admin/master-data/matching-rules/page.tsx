'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllMatchingRules, createMatchingRule, updateMatchingRule, deleteMatchingRule,
  type MatchingRuleMasterDto 
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, Edit, Trash2, Scale, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const RULE_TYPES = [
  'SKILL_MATCH',
  'DISTANCE',
  'RATING',
  'SUBSCRIPTION_TIER',
  'ACCEPTANCE_RATE',
  'RESPONSE_TIME',
  'JOB_HISTORY'
]

export default function AdminMatchingRulesPage() {
  const [rules, setRules] = useState<MatchingRuleMasterDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortKey, setSortKey] = useState<string>('priorityOrder')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<MatchingRuleMasterDto | null>(null)
  const [formData, setFormData] = useState<MatchingRuleMasterDto>({
    ruleCode: '',
    ruleName: '',
    ruleType: 'SKILL_MATCH',
    weightPercentage: 0,
    calculationLogic: '',
    priorityOrder: 0,
    isActive: true
  })

  useEffect(() => {
    fetchRules()
  }, [currentPage, pageSize, sortKey, sortDirection])

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllMatchingRules(currentPage, pageSize, sortKey, sortDirection)
      setRules(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch matching rules:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load matching rules'
      toast.error(errorMsg)
      setRules([])
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
    setEditingRule(null)
    setFormData({
      ruleCode: '',
      ruleName: '',
      ruleType: 'SKILL_MATCH',
      weightPercentage: 0,
      calculationLogic: '',
      priorityOrder: 0,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (rule: MatchingRuleMasterDto) => {
    setEditingRule(rule)
    setFormData({
      ...rule,
      weightPercentage: rule.weightPercentage || 0,
      priorityOrder: rule.priorityOrder || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this matching rule?')) return

    try {
      await deleteMatchingRule(id)
      toast.success('Matching rule deleted successfully')
      fetchRules()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete matching rule'
      toast.error(errorMsg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.ruleName || !formData.ruleCode || !formData.ruleType) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.weightPercentage < 0 || formData.weightPercentage > 100) {
      toast.error('Weight percentage must be between 0 and 100')
      return
    }

    try {
      if (editingRule?.id) {
        await updateMatchingRule(editingRule.id, formData)
        toast.success('Matching rule updated successfully')
      } else {
        await createMatchingRule(formData)
        toast.success('Matching rule created successfully')
      }
      setShowModal(false)
      fetchRules()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save matching rule'
      toast.error(errorMsg)
    }
  }

  const columns: Column<MatchingRuleMasterDto>[] = [
    {
      key: 'ruleCode',
      header: 'Rule Code',
      sortable: true,
      render: (rule) => (
        <span className="font-semibold text-primary-main">{rule.ruleCode}</span>
      )
    },
    {
      key: 'ruleName',
      header: 'Rule Name',
      sortable: true,
      render: (rule) => (
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{rule.ruleName}</span>
        </div>
      )
    },
    {
      key: 'ruleType',
      header: 'Type',
      sortable: true,
      render: (rule) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-main/10 text-primary-main">
          {rule.ruleType}
        </span>
      )
    },
    {
      key: 'weightPercentage',
      header: 'Weight %',
      sortable: true,
      render: (rule) => (
        <span className="text-sm font-semibold">{rule.weightPercentage || 0}%</span>
      )
    },
    {
      key: 'priorityOrder',
      header: 'Priority',
      sortable: true,
      render: (rule) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-green/20 text-accent-green">
          {rule.priorityOrder || 0}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (rule) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          rule.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {rule.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {rule.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (rule) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(rule)}
            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => rule.id && handleDelete(rule.id)}
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
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Matching Rules</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Create and manage matching algorithm rules</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Rule
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
            { key: 'ruleName', label: 'Rule Name' },
            { key: 'ruleCode', label: 'Rule Code' },
            { key: 'ruleType', label: 'Type' },
            { key: 'weightPercentage', label: 'Weight %' },
            { key: 'priorityOrder', label: 'Priority' },
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
            data={rules}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No matching rules found. Create your first rule!"
          />

          {rules.length > 0 && (
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
              {editingRule ? 'Edit Matching Rule' : 'Create New Matching Rule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Rule Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ruleCode}
                    onChange={(e) => setFormData({ ...formData, ruleCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                    placeholder="RULE_CODE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Rule Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                  >
                    {RULE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ruleName}
                  onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  required
                  placeholder="Rule Name"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Weight Percentage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.weightPercentage}
                    onChange={(e) => setFormData({ ...formData, weightPercentage: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                    Priority Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priorityOrder || 0}
                    onChange={(e) => setFormData({ ...formData, priorityOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Calculation Logic (JSON)</label>
                <textarea
                  value={formData.calculationLogic || ''}
                  onChange={(e) => setFormData({ ...formData, calculationLogic: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none font-mono text-sm"
                  rows={4}
                  placeholder='{"min": 0, "max": 100, "factor": 1.0}'
                />
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
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
