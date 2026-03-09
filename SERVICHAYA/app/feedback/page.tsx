'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Globe2,
  Laptop,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  User,
} from 'lucide-react'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'
import { submitPublicOpenPoint, uploadFeedbackFiles, type OpenPointType } from '@/lib/services/feedback'

type ImpactArea =
  | 'HOME_PAGE'
  | 'CUSTOMER_BOOKING'
  | 'PROVIDER_ONBOARDING'
  | 'PAYMENT'
  | 'MATCHING'
  | 'DASHBOARD'
  | 'OTHER'

const typeOptions: { value: OpenPointType; label: string; description: string }[] = [
  { value: 'FEATURE_REQUEST', label: 'New Feature', description: 'Something new you want us to add' },
  { value: 'FLOW_ISSUE', label: 'Flow / UX issue', description: 'Something confusing or hard to use' },
  { value: 'CHANGE_SUGGESTION', label: 'Change suggestion', description: 'Improve an existing screen or step' },
  { value: 'BUG', label: 'Bug / Problem', description: 'Something not working as expected' },
  { value: 'OTHER', label: 'Other', description: 'Anything else you want to tell us' },
]

const impactOptions: { value: ImpactArea; label: string }[] = [
  { value: 'HOME_PAGE', label: 'Home Page' },
  { value: 'CUSTOMER_BOOKING', label: 'Customer Booking Flow' },
  { value: 'PROVIDER_ONBOARDING', label: 'Provider Onboarding' },
  { value: 'PAYMENT', label: 'Payment / Billing' },
  { value: 'MATCHING', label: 'Matching / Provider Assignment' },
  { value: 'DASHBOARD', label: 'Dashboards' },
  { value: 'OTHER', label: 'Other' },
]

export default function FeedbackPage() {
  const pathname = usePathname()
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<number | null>(null)

  const [type, setType] = useState<OpenPointType>('FEATURE_REQUEST')
  const [impactArea, setImpactArea] = useState<ImpactArea>('OTHER')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [environment, setEnvironment] = useState<'PROD' | 'STAGE' | 'UAT' | 'LOCAL'>('LOCAL')
  const [reporterName, setReporterName] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [reporterMobile, setReporterMobile] = useState('')
  const [reporterRole, setReporterRole] = useState<'CUSTOMER' | 'PROVIDER' | 'OTHER'>('OTHER')
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([''])
  const [files, setFiles] = useState<File[]>([])

  const handleAttachmentChange = (index: number, value: string) => {
    setAttachmentUrls((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const addAttachmentField = () => {
    setAttachmentUrls((prev) => [...prev, ''])
  }

  const removeAttachmentField = (index: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (selected) {
      setFiles(Array.from(selected))
    } else {
      setFiles([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please add a short title')
      return
    }
    if (!description.trim()) {
      toast.error('Please describe your requirement or issue')
      return
    }

    try {
      setSubmitting(true)
      let cleanAttachmentUrls = attachmentUrls
        .map((u) => u.trim())
        .filter((u) => u.length > 0)

      // Upload local files if any, store them on server and get URLs
      if (files.length > 0) {
        const uploadedUrls = await uploadFeedbackFiles(files)
        cleanAttachmentUrls = [...cleanAttachmentUrls, ...uploadedUrls]
      }

      const result = await submitPublicOpenPoint({
        type,
        title: title.trim(),
        description: description.trim(),
        impactArea,
        url: typeof window !== 'undefined' ? window.location.origin + pathname : pathname,
        environment,
        clientInfo: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        reporterName: reporterName.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
        reporterMobile: reporterMobile.trim() || undefined,
        reporterRole,
        attachmentUrls: cleanAttachmentUrls.length > 0 ? cleanAttachmentUrls : undefined,
      })

      setSubmittedId(result.id)
      toast.success('Thank you, your feedback has been submitted')

      // Reset form but keep contact details for convenience
      setTitle('')
      setDescription('')
      setImpactArea('OTHER')
      setType('FEATURE_REQUEST')
      setAttachmentUrls([''])
      setFiles([])
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Could not submit feedback, please try again'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#010B2A] text-white">
      <header className="border-b border-white/10 glass-dark backdrop-blur-xl sticky top-0 z-30">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-light" />
              <h1 className="text-lg sm:text-xl font-semibold">Share Feedback / Report Issue</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-300">
            <Globe2 className="w-4 h-4" />
            <span>Help us improve SERVICHAYA experience for everyone</span>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl glass-dark border border-white/10 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-primary-light" />
                <div>
                  <h2 className="text-lg font-semibold">Tell us what you need</h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    This form is for new feature ideas, flow issues, change suggestions, or problems you face while using SERVICHAYA.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-main/30 text-[10px] font-bold text-primary-light">
                      1
                    </span>
                    Choose type
                  </label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={`text-left rounded-xl border px-3 py-2 text-xs sm:text-sm transition-all ${
                          type === opt.value
                            ? 'border-primary-main bg-primary-main/20 text-primary-light shadow-lg'
                            : 'border-white/10 bg-white/5 text-slate-200 hover:border-primary-main/60'
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[11px] text-slate-300 mt-1">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">Which area of platform?</label>
                    <select
                      value={impactArea}
                      onChange={(e) => setImpactArea(e.target.value as ImpactArea)}
                      className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                    >
                      {impactOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">Environment</label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                    >
                      <option value="PROD">Live / Production</option>
                      <option value="STAGE">Staging / UAT</option>
                      <option value="LOCAL">Local / Testing</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-main/30 text-[10px] font-bold text-primary-light">
                      2
                    </span>
                    Short title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Payment page is confusing, or Need recurring booking option"
                    className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-main/30 text-[10px] font-bold text-primary-light">
                      3
                    </span>
                    Please describe clearly <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Explain what you were trying to do, what happened, and what you expect. You can mention steps like 1-2-3."
                    className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                  />
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Please don’t share passwords or very sensitive personal data here.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-main/30 text-[10px] font-bold text-primary-light">
                        4
                      </span>
                      Attach screenshots or documents
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1">
                      You can upload screenshots or documents (max few files). They will be stored securely on our server.
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-200 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-main/80 file:text-white hover:file:bg-primary-main cursor-pointer"
                    />
                    {files.length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        Selected files: {files.map((f) => f.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">Attachment links (optional)</label>
                    <p className="text-[11px] text-slate-400 mb-1">
                      You can also paste links to screenshots or documents (Google Drive, Dropbox, etc.).
                    </p>
                    <div className="space-y-2">
                      {attachmentUrls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={url}
                            onChange={(e) => handleAttachmentChange(index, e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                          />
                          {attachmentUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAttachmentField(index)}
                              className="px-2 text-xs rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addAttachmentField}
                      className="mt-1 text-xs text-primary-light hover:text-primary-main"
                    >
                      + Add another link
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary-light" />
                    How can we contact you? <span className="text-slate-400 font-normal">(optional but helpful)</span>
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                    />
                    <input
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary-light" />
                      <input
                        value={reporterMobile}
                        onChange={(e) => setReporterMobile(e.target.value)}
                        placeholder="Mobile (optional)"
                        className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                      />
                    </div>
                    <div>
                      <select
                        value={reporterRole}
                        onChange={(e) => setReporterRole(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-main/60"
                      >
                        <option value="CUSTOMER">I am a Customer</option>
                        <option value="PROVIDER">I am a Provider</option>
                        <option value="OTHER">Other / Not sure</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Laptop className="w-3 h-3" />
                    <span>We use this only to improve SERVICHAYA. No spam.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-main to-primary-light px-5 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-primary-main/40 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <ButtonLoader size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {submittedId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div className="text-sm text-slate-100">
                  <p className="font-semibold">Thank you for helping us improve SERVICHAYA.</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Your reference ID is <span className="font-mono text-primary-light">OP-{submittedId}</span>. Our
                    team will review this and plan the next steps.
                  </p>
                </div>
              </motion.div>
            )}
          </section>

          <aside className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl glass-dark border border-white/10 p-4 sm:p-5"
            >
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-light" />
                Why your feedback matters
              </h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>We use this to plan our roadmap for Tier-2 / Tier-3 city users.</li>
                <li>It helps us simplify flows that feel complicated or slow.</li>
                <li>Feature ideas from real users get priority in our planning.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl glass-dark border border-primary-main/40 p-4 sm:p-5"
            >
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary-light">
                <CheckCircle2 className="w-4 h-4" />
                Good examples
              </h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>“On mobile, the home page banner hides important buttons.”</li>
                <li>“During job creation, I am not sure which category to select for AC repair.”</li>
                <li>“Payment success message is not clear, I am afraid of double payment.”</li>
              </ul>
            </motion.div>
          </aside>
        </motion.div>
      </main>
    </div>
  )
}

