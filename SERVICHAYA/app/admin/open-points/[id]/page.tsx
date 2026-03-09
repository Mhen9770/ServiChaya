'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'
import { getAdminOpenPointById, updateAdminOpenPoint, type PublicOpenPointResponse, type OpenPointPriority, type OpenPointStatus } from '@/lib/services/feedback'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Edit3, ExternalLink, MessageCircle, Sparkles, User, Phone, Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'

function OpenPointDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [point, setPoint] = useState<PublicOpenPointResponse | null>(null)
  const [status, setStatus] = useState<OpenPointStatus | ''>('')
  const [priority, setPriority] = useState<OpenPointPriority | ''>('')
  const [internalNotes, setInternalNotes] = useState('')

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const buildAttachmentUrl = (fileUrl: string) => {
    if (!fileUrl) return '#'
    if (fileUrl.startsWith('http')) return fileUrl
    return `${backendBaseUrl}${fileUrl}`
  }

  const isImage = (url: string) => {
    const clean = url.split('?')[0].toLowerCase()
    return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.gif') || clean.endsWith('.webp')
  }

  useEffect(() => {
    if (!id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const load = async () => {
    try {
      setLoading(true)
      const data = await getAdminOpenPointById(id)
      setPoint(data)
      setStatus(data.status)
      setPriority(data.priority)
      setInternalNotes('')
    } catch (error: any) {
      console.error('Failed to load open point', error)
      toast.error(error?.response?.data?.message || 'Failed to load open point')
      router.push('/admin/open-points')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!point) return
    try {
      setSaving(true)
      const updated = await updateAdminOpenPoint(point.id, {
        status: status || undefined,
        priority: priority || undefined,
        internalNotes: internalNotes || undefined,
      })
      setPoint(updated)
      toast.success('Open point updated')
      setInternalNotes('')
    } catch (error: any) {
      console.error('Failed to update open point', error)
      toast.error(error?.response?.data?.message || 'Failed to update open point')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !point) {
    return <PageLoader text="Loading open point..." />
  }

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/open-points"
            className="inline-flex items-center gap-1 text-xs text-neutral-textSecondary hover:text-primary-main"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to list
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary-main" />
            <h1 className="text-xl font-bold text-neutral-textPrimary font-display">
              Open Point OP-{point.id}
            </h1>
          </div>
          <p className="text-xs text-neutral-textSecondary">
            {point.type.replace('_', ' ')} •{' '}
            {point.createdAt ? new Date(point.createdAt).toLocaleString() : 'Created time not available'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="rounded-2xl border border-neutral-border bg-white p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-textPrimary mb-1">{point.title}</h2>
                <p className="text-sm text-neutral-textSecondary whitespace-pre-wrap">{point.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-neutral-textSecondary">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Type: {point.type.replace('_', ' ')}
              </span>
              {point.impactArea && (
                <span className="px-2 py-0.5 rounded-full bg-primary-main/5 text-primary-main border border-primary-main/20">
                  Impact: {point.impactArea.replace('_', ' ')}
                </span>
              )}
              {point.environment && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Env: {point.environment}
                </span>
              )}
              {point.clientInfo && (
                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 max-w-full truncate">
                  Device: {point.clientInfo}
                </span>
              )}
            </div>
            {point.url && (
              <div className="flex items-center gap-2 text-xs text-neutral-textSecondary">
                <ExternalLink className="w-3 h-3" />
                <a
                  href={point.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-primary-main break-all"
                >
                  {point.url}
                </a>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-textPrimary mb-2">Attachments</h3>
            {point.attachments && point.attachments.length > 0 ? (
              <ul className="space-y-3 text-xs">
                {point.attachments.map((a) => {
                  const href = buildAttachmentUrl(a.fileUrl)
                  const image = isImage(a.fileUrl)
                  return (
                    <li key={a.id} className="flex items-center gap-3 border-b last:border-b-0 pb-2">
                      {image && (
                        <a href={href} target="_blank" rel="noreferrer" className="shrink-0">
                          <img
                            src={href}
                            alt={a.fileName || 'attachment'}
                            className="w-12 h-12 rounded-md object-cover border border-neutral-border"
                          />
                        </a>
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-main hover:text-primary-dark truncate inline-flex items-center gap-1 w-full"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate">{a.fileName || a.fileUrl}</span>
                        </a>
                        {a.fileSize && (
                          <p className="text-[11px] text-neutral-textSecondary mt-0.5">
                            {(a.fileSize / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-xs text-neutral-textSecondary">No attachments provided.</p>
            )}
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-neutral-border bg-white p-4 space-y-2">
            <h3 className="text-sm font-semibold text-neutral-textPrimary mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-main" />
              Reporter
            </h3>
            {point.reporterName || point.reporterEmail || point.reporterMobile ? (
              <div className="space-y-1 text-xs text-neutral-textSecondary">
                {point.reporterName && (
                  <p className="font-semibold text-neutral-textPrimary">{point.reporterName}</p>
                )}
                {point.reporterRole && (
                  <p className="text-[11px] uppercase tracking-wide text-neutral-textSecondary">
                    {point.reporterRole}
                  </p>
                )}
                {point.reporterEmail && (
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${point.reporterEmail}`} className="hover:text-primary-main">
                      {point.reporterEmail}
                    </a>
                  </p>
                )}
                {point.reporterMobile && (
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{point.reporterMobile}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-textSecondary">
                No contact details provided. This might be an anonymous public submission.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-textPrimary mb-1 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary-main" />
              Status & Priority
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-neutral-textSecondary">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OpenPointStatus)}
                className="w-full rounded-lg border border-neutral-border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-main/50"
              >
                <option value="NEW">New</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-textSecondary">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OpenPointPriority)}
                className="w-full rounded-lg border border-neutral-border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-main/50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-textSecondary">Internal notes</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="Notes for internal team, decisions, links to specs, etc."
                className="w-full rounded-lg border border-neutral-border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-main/50"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-main text-white text-xs font-semibold px-3 py-2 hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <ButtonLoader size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
              Save changes
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p>
              Be careful while marking as <strong>Completed</strong> or <strong>Rejected</strong>. These should reflect
              the real decision after product discussion.
            </p>
          </div>

          <div className="rounded-2xl border border-primary-main/30 bg-primary-main/5 p-3 text-xs text-neutral-textSecondary flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary-main mt-0.5" />
            <p>
              You can use this page in review meetings to quickly walk through high-priority open points from real
              users and decide which ones to move to roadmap.
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  )
}

export default function OpenPointDetailsPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading open point..." />}>
      <OpenPointDetailsContent />
    </Suspense>
  )
}

