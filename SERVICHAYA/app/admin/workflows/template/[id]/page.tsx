'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, Upload } from 'lucide-react'
import {
  createWorkflowStep,
  createWorkflowTemplate,
  getWorkflowSteps,
  getAllWorkflowTemplates,
  updateWorkflowTemplate,
  type JobWorkflowStepTemplateDto,
  type JobWorkflowTemplateDto,
} from '@/lib/services/admin'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'

export default function WorkflowTemplateDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = params.id === 'new'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<JobWorkflowTemplateDto>({
    workflowCode: '',
    workflowName: '',
    description: '',
    isActive: true,
  })
  const [steps, setSteps] = useState<JobWorkflowStepTemplateDto[]>([])
  const [savingSteps, setSavingSteps] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)
      if (!isNew) {
        const templatesResult = await getAllWorkflowTemplates(0, 100)
        const existing = templatesResult.content.find((t) => t.id === Number(params.id))
        if (existing) {
          setTemplate(existing)
          const stepList = await getWorkflowSteps(existing.id!)
          setSteps(stepList)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      setSaving(true)
      let saved: JobWorkflowTemplateDto
      if (template.id) {
        saved = await updateWorkflowTemplate(template.id, template)
      } else {
        saved = await createWorkflowTemplate(template)
      }
      setTemplate(saved)
      if (isNew) {
        router.replace(`/admin/workflows/template/${saved.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddStep = async () => {
    if (!template.id) {
      alert('Please save the workflow template before adding steps.')
      return
    }
    const nextOrder = (steps[steps.length - 1]?.stepOrder || 0) + 1
    const created = await createWorkflowStep(template.id, {
      workflowTemplateId: template.id,
      stepOrder: nextOrder,
      stepCode: `STEP_${nextOrder}`,
      stepType: 'STATUS_CHANGE',
      statusValue: '',
      isMandatory: true,
      autoAdvance: false,
    } as JobWorkflowStepTemplateDto)
    setSteps([...steps, created])
  }

  const handleSaveSteps = async () => {
    if (!template.id || steps.length === 0) return
    try {
      setSavingSteps(true)
      // Persist all existing steps with ids
      for (const step of steps) {
        if (step.id) {
          await import('@/lib/services/admin')
            .then(({ updateWorkflowStep }) => updateWorkflowStep(step.id!, step))
        }
      }
      await loadData()
    } finally {
      setSavingSteps(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading workflow..." />
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/workflows')}
        className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-neutral-textPrimary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to workflows
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">
            {isNew ? 'New Workflow' : template.workflowName}
          </h1>
          {!isNew && (
            <p className="text-xs font-mono text-neutral-textSecondary">Code: {template.workflowCode}</p>
          )}
        </div>
        <button
          onClick={handleSaveTemplate}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-main px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
        >
          {saving ? <ButtonLoader size="sm" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.5fr]">
        {/* Template details */}
        <div className="rounded-xl border border-neutral-borderSubtle bg-neutral-surface p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Workflow Code</label>
            <input
              type="text"
              value={template.workflowCode}
              onChange={(e) => setTemplate((prev) => ({ ...prev, workflowCode: e.target.value }))}
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-3 py-2 text-sm"
              placeholder="ELECTRONICS_SIMPLE"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Workflow Name</label>
            <input
              type="text"
              value={template.workflowName}
              onChange={(e) => setTemplate((prev) => ({ ...prev, workflowName: e.target.value }))}
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-3 py-2 text-sm"
              placeholder="Electronics - Simple Service"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Description</label>
            <textarea
              value={template.description}
              onChange={(e) => setTemplate((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-background px-3 py-2 text-sm"
              placeholder="Short description of when to use this workflow"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={template.isActive ?? true}
              onChange={(e) => setTemplate((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="text-sm text-neutral-textPrimary">
              Active
            </label>
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-xl border border-neutral-borderSubtle bg-neutral-surface p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-textPrimary">Steps</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-borderSubtle px-2 py-1 text-xs text-neutral-textPrimary hover:bg-neutral-backgroundSubtle"
              >
                <Plus className="w-3 h-3" />
                Add Step
              </button>
              <button
                type="button"
                onClick={handleSaveSteps}
                disabled={savingSteps}
                className="inline-flex items-center gap-1 rounded-md border border-primary-main px-2 py-1 text-xs text-primary-main hover:bg-primary-main/10 disabled:opacity-60"
              >
                {savingSteps ? <ButtonLoader size="sm" /> : <Upload className="w-3 h-3" />}
                Save Steps
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="rounded-lg border border-neutral-borderSubtle bg-neutral-backgroundSubtle px-3 py-2 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-surface text-xs font-semibold text-neutral-textSecondary">
                    {step.stepOrder}
                  </span>
                  <input
                    type="text"
                    value={step.stepCode}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s) => (s.id === step.id ? { ...s, stepCode: e.target.value } : s)),
                      )
                    }
                    className="flex-1 rounded-md border border-neutral-borderSubtle bg-neutral-surface px-2 py-1 text-xs"
                  />
                  <select
                    value={step.stepType}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s) => (s.id === step.id ? { ...s, stepType: e.target.value } : s)),
                      )
                    }
                    className="rounded-md border border-neutral-borderSubtle bg-neutral-surface px-2 py-1 text-xs"
                  >
                    <option value="STATUS_CHANGE">STATUS_CHANGE</option>
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="VISIT">VISIT</option>
                    <option value="CANCEL">CANCEL</option>
                    <option value="REFUND">REFUND</option>
                    <option value="RESCHEDULE">RESCHEDULE</option>
                    <option value="NOTIFICATION">NOTIFICATION</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-textSecondary mb-0.5">
                      Status Value
                    </label>
                    <input
                      type="text"
                      value={step.statusValue || ''}
                      onChange={(e) =>
                        setSteps((prev) =>
                          prev.map((s) => (s.id === step.id ? { ...s, statusValue: e.target.value } : s)),
                        )
                      }
                      className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-surface px-2 py-1 text-xs"
                      placeholder="PENDING / MATCHING / IN_PROGRESS / ..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-textSecondary mb-0.5">
                      Payment Type
                    </label>
                    <input
                      type="text"
                      value={step.paymentType || ''}
                      onChange={(e) =>
                        setSteps((prev) =>
                          prev.map((s) => (s.id === step.id ? { ...s, paymentType: e.target.value } : s)),
                        )
                      }
                      className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-surface px-2 py-1 text-xs"
                      placeholder="PARTIAL / FULL / POST_WORK"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-textSecondary mb-0.5">
                    Config JSON
                  </label>
                  <textarea
                    value={step.configJson || ''}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s) => (s.id === step.id ? { ...s, configJson: e.target.value } : s)),
                      )
                    }
                    rows={2}
                    className="w-full rounded-md border border-neutral-borderSubtle bg-neutral-surface px-2 py-1 text-xs font-mono"
                    placeholder='{"refundPolicyCode":"ELEC_STD_CANCEL"}'
                  />
                </div>
              </div>
            ))}
            {steps.length === 0 && (
              <p className="text-xs text-neutral-textSecondary">No steps yet. Add at least one to make workflow usable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

