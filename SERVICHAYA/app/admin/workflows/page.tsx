'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import { getAllWorkflowTemplates, deleteWorkflowTemplate, type JobWorkflowTemplateDto } from '@/lib/services/admin'
import { PageLoader } from '@/components/ui/Loader'

export default function WorkflowTemplatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<JobWorkflowTemplateDto[]>([])

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const result = await getAllWorkflowTemplates(0, 100, 'workflowCode', 'asc')
      setTemplates(result.content || [])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (!confirm('Are you sure you want to delete this workflow template?')) return
    await deleteWorkflowTemplate(id)
    await loadTemplates()
  }

  if (loading) {
    return <PageLoader text="Loading workflows..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Job Workflows</h1>
          <p className="text-sm text-neutral-textSecondary">
            Define reusable job workflows and attach them to Electronics / Electrical categories.
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/workflows/template/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-main px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-borderSubtle bg-neutral-surface">
        <table className="min-w-full divide-y divide-neutral-borderSubtle text-sm">
          <thead className="bg-neutral-backgroundSubtle">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-textSecondary">Active</th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-textSecondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-borderSubtle">
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono text-xs text-neutral-textPrimary">{t.workflowCode}</td>
                <td className="px-4 py-3 text-neutral-textPrimary">
                  <div className="font-semibold">{t.workflowName}</div>
                  {t.description && (
                    <div className="text-xs text-neutral-textSecondary line-clamp-1">{t.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-backgroundSubtle text-neutral-textSecondary'
                    }`}
                  >
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/workflows/template/${t.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-borderSubtle px-2 py-1 text-xs text-neutral-textPrimary hover:bg-neutral-backgroundSubtle"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-textSecondary">
                  No workflows defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

