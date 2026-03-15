'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getAllWorkflowAssignments,
  getAllWorkflowTemplates,
  createWorkflowAssignment,
  type JobWorkflowAssignmentDto,
  type JobWorkflowTemplateDto,
  getAllServiceCategories,
  type ServiceCategoryMasterDto,
} from '@/lib/services/admin'
import { getAllSubCategories, type ServiceSubCategory } from '@/lib/services/service'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'
import { Plus } from 'lucide-react'

export default function WorkflowAssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assignments, setAssignments] = useState<JobWorkflowAssignmentDto[]>([])
  const [templates, setTemplates] = useState<JobWorkflowTemplateDto[]>([])
  const [categories, setCategories] = useState<ServiceCategoryMasterDto[]>([])
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([])
  const [newAssignment, setNewAssignment] = useState<JobWorkflowAssignmentDto>({
    workflowTemplateId: 0,
    priority: 0,
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [assignResult, templateResult, categoryResult] = await Promise.all([
        getAllWorkflowAssignments(0, 100, 'priority', 'desc'),
        getAllWorkflowTemplates(0, 100, 'workflowCode', 'asc'),
        getAllServiceCategories(0, 200, 'name', 'asc'),
      ])
      setAssignments(assignResult.content || [])
      setTemplates(templateResult.content || [])
      setCategories(categoryResult.content || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadSubs = async () => {
      if (!newAssignment.serviceCategoryId) {
        // If no category selected, you can keep all featured/active subs or leave empty
        const all = await getAllSubCategories(undefined, true).catch(() => [])
        setSubCategories(all || [])
      } else {
        const byCategory = await getAllSubCategories(newAssignment.serviceCategoryId).catch(() => [])
        setSubCategories(byCategory || [])
      }
    }
    loadSubs()
  }, [newAssignment.serviceCategoryId])

  const filteredSubCategories = useMemo(() => subCategories, [subCategories])

  const handleCreate = async () => {
    if (!newAssignment.workflowTemplateId) {
      alert('Please select a workflow template')
      return
    }
    try {
      setSaving(true)
      await createWorkflowAssignment(newAssignment)
      setNewAssignment({
        workflowTemplateId: 0,
        priority: 0,
        isActive: true,
      })
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading workflow assignments..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Workflow Assignments</h1>
          <p className="text-sm text-neutral-textSecondary">
            Control which workflow runs for which Electronics / Electrical categories and subcategories.
          </p>
        </div>
      </div>

      {/* New Assignment Form */}
      <div className="rounded-xl border border-neutral-borderSubtle bg-neutral-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-textPrimary">Add Assignment</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Workflow Template</label>
            <select
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-2 py-1.5 text-sm"
              value={newAssignment.workflowTemplateId || 0}
              onChange={(e) =>
                setNewAssignment((prev) => ({ ...prev, workflowTemplateId: Number(e.target.value) || 0 }))
              }
            >
              <option value={0}>Select workflow</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.workflowCode} - {t.workflowName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Category</label>
            <select
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-2 py-1.5 text-sm"
              value={newAssignment.serviceCategoryId || 0}
              onChange={(e) => {
                const categoryId = Number(e.target.value) || 0
                setNewAssignment((prev) => ({
                  ...prev,
                  serviceCategoryId: categoryId || undefined,
                  serviceSubCategoryId: undefined,
                }))
              }}
            >
              <option value={0}>Any category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Sub Category</label>
            <select
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-2 py-1.5 text-sm"
              value={newAssignment.serviceSubCategoryId || 0}
              onChange={(e) => {
                const subId = Number(e.target.value) || 0
                setNewAssignment((prev) => ({
                  ...prev,
                  serviceSubCategoryId: subId || undefined,
                }))
              }}
            >
              <option value={0}>Any sub category</option>
              {filteredSubCategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Priority</label>
            <input
              type="number"
              value={newAssignment.priority ?? 0}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  priority: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-2 py-1.5 text-sm"
              placeholder="Higher value = higher priority"
            />
          </div>
        </div>
        <div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-main px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
          >
            {saving ? <ButtonLoader size="sm" /> : <Plus className="w-4 h-4" />}
            Add Assignment
          </button>
        </div>
      </div>

      {/* Existing assignments */}
      <div className="overflow-hidden rounded-xl border border-neutral-borderSubtle bg-neutral-surface">
        <table className="min-w-full divide-y divide-neutral-borderSubtle text-sm">
          <thead className="bg-neutral-backgroundSubtle">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Workflow</th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Category Id</th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Sub Category Id</th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Priority</th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-borderSubtle">
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-neutral-textPrimary">{a.workflowCode}</div>
                  <div className="text-[11px] text-neutral-textSecondary">ID: {a.workflowTemplateId}</div>
                </td>
                <td className="px-4 py-3 text-neutral-textPrimary">
                  {a.serviceCategoryId ?? <span className="text-neutral-textSecondary">Any</span>}
                </td>
                <td className="px-4 py-3 text-neutral-textPrimary">
                  {a.serviceSubCategoryId ?? <span className="text-neutral-textSecondary">Any</span>}
                </td>
                <td className="px-4 py-3 text-neutral-textPrimary">{a.priority ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-backgroundSubtle text-neutral-textSecondary'
                    }`}
                  >
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-textSecondary">
                  No assignments configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

