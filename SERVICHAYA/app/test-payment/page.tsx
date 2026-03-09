'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, CreditCard, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'
import Link from 'next/link'
import toast from 'react-hot-toast'

function TestPaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const jobId = Number(searchParams.get('jobId') || '0')
  const transactionCode = searchParams.get('transactionCode') || ''
  const amount = searchParams.get('amount') || ''

  const [loading, setLoading] = useState(false)

  const isValid = jobId > 0 && transactionCode.length > 0

  const handleResult = async (result: 'success' | 'failed') => {
    if (!isValid) {
      toast.error('Invalid test payment link')
      return
    }

    try {
      setLoading(true)
      if (result === 'success') {
        // In test mode, backend skips signature verification and treats this as success
        await api.post('/payments/confirm', null, {
          params: {
            jobId,
            transactionCode,
          },
        })
        toast.success('Test payment marked as SUCCESS')
      } else {
        await api.post('/payments/test/fail', null, {
          params: {
            jobId,
            transactionCode,
          },
        })
        toast.success('Test payment marked as FAILED')
      }

      // Redirect back to customer job page
      router.push(`/customer/jobs/${jobId}`)
    } catch (error: any) {
      console.error('Test payment error:', error)
      toast.error(error?.response?.data?.message || 'Could not update test payment')
    } finally {
      setLoading(false)
    }
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl bg-slate-900/80 border border-red-500/30 p-8 text-center text-white shadow-2xl">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-semibold mb-2">Invalid test payment link</h1>
          <p className="text-slate-300 text-sm mb-6">
            jobId or transactionCode is missing. Please generate a new test payment from the app.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary-light hover:text-primary-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-3xl bg-slate-900/80 border border-slate-700 p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-light" />
            Test Payment Sandbox
          </h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/40">
            TEST MODE
          </span>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Use this screen to simulate payment result while gateway integration is in progress.
        </p>

        <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4 mb-6 text-sm space-y-2">
          <div className="flex justify-between text-slate-300">
            <span>Job ID</span>
            <span className="font-semibold text-white">#{jobId}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Transaction</span>
            <span className="font-mono text-xs text-primary-light">{transactionCode}</span>
          </div>
          {amount && (
            <div className="flex justify-between text-slate-300">
              <span>Amount</span>
              <span className="font-semibold text-white">₹{Number(amount).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            disabled={loading}
            onClick={() => handleResult('success')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/30"
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Mark as SUCCESS
              </>
            )}
          </button>

          <button
            disabled={loading}
            onClick={() => handleResult('failed')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition-all shadow-lg shadow-red-500/30"
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Mark as FAILED
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          This screen is only available while <span className="font-semibold text-amber-300">TEST_PAYMENT_MODE</span>{' '}
          feature flag is enabled.
        </p>
      </motion.div>
    </div>
  )
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading test payment..." />}>
      <TestPaymentPageContent />
    </Suspense>
  )
}

