'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Script from 'next/script'
import { getCurrentUser } from '@/lib/auth'
import { getJobById, type JobDto } from '@/lib/services/job'
import { getPaymentSchedule, type PaymentScheduleDto } from '@/lib/services/payment'
import { getBusinessRuleValue } from '@/lib/services/configuration'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui/Loader'
import api from '@/lib/api'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CustomerPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = Number(params.id)
  const paymentType = searchParams.get('type') || 'final' // 'upfront' or 'final'

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [job, setJob] = useState<JobDto | null>(null)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleDto | null>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [paymentProcessingDays, setPaymentProcessingDays] = useState<number>(2) // Default 2 days

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push(`/login?redirect=/customer/jobs/${jobId}/payment`)
      return
    }
    fetchData()
  }, [jobId, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [jobData, schedule, processingDaysRule] = await Promise.all([
        getJobById(jobId),
        getPaymentSchedule(jobId).catch(() => null),
        getBusinessRuleValue('PAYMENT_PROCESSING_DAYS').catch(() => null)
      ])
      setJob(jobData)
      setPaymentSchedule(schedule)
      
      // Parse payment processing days from business rule
      if (processingDaysRule) {
        try {
          const ruleData = JSON.parse(processingDaysRule)
          if (ruleData.value) {
            setPaymentProcessingDays(parseInt(ruleData.value) || 2)
          }
        } catch {
          // If not JSON, try direct parse
          const days = parseInt(processingDaysRule)
          if (!isNaN(days)) setPaymentProcessingDays(days)
        }
      }
      
      // Check if payment is already completed
      if (paymentType === 'final' && jobData.status === 'COMPLETED' && schedule?.finalPaid) {
        toast.success('Payment already completed')
        router.push(`/customer/jobs/${jobId}`)
      }
      if (paymentType === 'upfront' && schedule?.upfrontPaid) {
        toast.success('Upfront payment already completed')
        router.push(`/customer/jobs/${jobId}`)
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load payment details')
      router.push(`/customer/jobs/${jobId}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!job || !paymentSchedule) {
      toast.error('Payment information not available')
      return
    }

    // Determine which payment to process
    let amount: number
    let paymentDescription: string

    if (paymentType === 'upfront') {
      if (paymentSchedule.upfrontPaid) {
        toast.success('Upfront payment already completed')
        router.push(`/customer/jobs/${jobId}`)
        return
      }
      amount = paymentSchedule.upfrontAmount
      paymentDescription = `Upfront Payment (${paymentSchedule.upfrontPercentage || 0}%) for Job: ${job.jobCode}`
      
      // Validate upfront payment
      if (!amount || amount <= 0) {
        toast.error('Invalid upfront payment amount')
        return
      }
    } else {
      // Final payment
      if (paymentSchedule.finalPaid) {
        toast.success('Payment already completed')
        router.push(`/customer/jobs/${jobId}`)
        return
      }
      amount = paymentSchedule.finalAmount || paymentSchedule.totalAmount
      paymentDescription = `Final Payment for Job: ${job.jobCode}`
      
      // Validate final payment
      if (!amount || amount <= 0) {
        toast.error('Invalid payment amount')
        return
      }
    }

    try {
      setProcessing(true)
      
      // Create payment link/order via backend
      const response = await api.post(`/payments/create-link`, {
        jobId,
        amount: amount,
        paymentChannel: 'ONLINE',
        paymentType: paymentType // 'upfront' or 'final'
      })
      
      const { paymentLink, orderId, transactionCode } = response.data.data || {}

      if (paymentLink) {
        // Open payment link in new window
        window.open(paymentLink, '_blank')
        toast.success('Payment link opened in new window')
        // Poll for payment status
        checkPaymentStatus(transactionCode)
      } else if (orderId) {
        // Use Razorpay checkout
        if (!razorpayLoaded) {
          toast.error('Payment gateway is loading, please wait...')
          return
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          name: 'SERVICHAYA',
          description: paymentDescription,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              await api.post('/payments/confirm', null, {
                params: {
                  jobId,
                  transactionCode,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  paymentType: paymentType
                }
              })
              
              if (paymentType === 'upfront') {
                toast.success('Upfront payment successful! Provider has been notified.', { duration: 5000 })
              } else {
                toast.success('Payment successful! Job is now completed.', { duration: 5000 })
              }
              setProcessing(false)
              
              // Refresh data before redirecting
              await fetchData()
              
              // Small delay to show success message
              setTimeout(() => {
                router.push(`/customer/jobs/${jobId}`)
              }, 1500)
            } catch (error: any) {
              console.error('Payment verification failed:', error)
              toast.error('Payment verification failed. Please contact support.')
              setProcessing(false)
            }
          },
          prefill: {
            name: getCurrentUser()?.name || '',
            email: getCurrentUser()?.email || '',
            contact: getCurrentUser()?.mobile || '',
          },
          theme: {
            color: '#2563EB',
          },
          modal: {
            ondismiss: () => {
              setProcessing(false)
            }
          }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
        // Note: setProcessing(false) is called in the handler or modal.ondismiss
      } else {
        toast.error('Failed to initialize payment')
        setProcessing(false)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to process payment')
      setProcessing(false)
    }
  }

  const checkPaymentStatus = async (transactionCode: string) => {
    // Poll for payment status every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/payments/status`, {
          params: { transactionCode }
        })
        
        if (response.data.data?.status === 'COMPLETED') {
          clearInterval(interval)
          toast.success('Payment completed!')
          router.push(`/customer/jobs/${jobId}`)
        }
      } catch (error) {
        // Ignore errors during polling
      }
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
    }, 300000)
  }

  if (loading) return <PageLoader text="Loading payment details..." />

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p>Job not found</p>
        </div>
      </div>
    )
  }

  // Determine payment amount based on type (already calculated in handlePayment, but need for display)
  let amount: number
  let paymentLabel: string
  let canPay: boolean

  if (paymentType === 'upfront') {
    amount = paymentSchedule?.upfrontAmount || 0
    paymentLabel = 'Upfront Payment'
    canPay = job.status === 'PENDING_FOR_PAYMENT' && amount > 0 && !paymentSchedule?.upfrontPaid &&
      (paymentSchedule?.paymentType === 'PARTIAL' || paymentSchedule?.paymentType === 'FULL')
  } else {
    amount = paymentSchedule?.finalAmount || paymentSchedule?.totalAmount || job.finalPrice || 0
    paymentLabel = 'Final Payment'
    canPay = job.status === 'PAYMENT_PENDING' && amount > 0 && !paymentSchedule?.finalPaid
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => toast.error('Failed to load payment gateway')}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => router.push(`/customer/jobs/${jobId}`)}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Job Details
            </button>
            <h1 className="text-3xl font-bold text-white">Payment</h1>
            <p className="text-slate-300 mt-1">Job: {job.jobCode}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-300">
                  <span>Job Title:</span>
                  <span className="text-white font-semibold">{job.title}</span>
                </div>
                {paymentSchedule && (
                  <>
                    <div className="flex justify-between text-slate-300">
                      <span>Payment Type:</span>
                      <span className="text-white">{paymentSchedule.paymentType}</span>
                    </div>
                    {paymentType === 'upfront' && paymentSchedule.paymentType === 'PARTIAL' && (
                      <div className="flex justify-between text-slate-300">
                        <span>Upfront Percentage:</span>
                        <span className="text-white">{paymentSchedule.upfrontPercentage || 0}%</span>
                      </div>
                    )}
                    {paymentSchedule.upfrontPaid && (
                      <div className="flex justify-between text-slate-300">
                        <span>Upfront Paid:</span>
                        <span className="text-green-400">₹{paymentSchedule.upfrontAmount.toLocaleString()} ✓</span>
                      </div>
                    )}
                    {paymentSchedule.paymentType === 'PARTIAL' && (
                      <div className="flex justify-between text-slate-300">
                        <span>Total Amount:</span>
                        <span className="text-white">₹{paymentSchedule.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">{paymentLabel}:</span>
                    <span className="text-2xl font-bold text-primary-main">₹{amount.toLocaleString()}</span>
                  </div>
                  {paymentType === 'upfront' && paymentSchedule?.paymentType === 'PARTIAL' && (
                    <div className="text-xs text-slate-400 mt-1">
                      Remaining ₹{paymentSchedule.finalAmount.toLocaleString()} will be due after job completion
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!canPay && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    {paymentType === 'upfront' && (
                      <>
                        {job.status !== 'PENDING_FOR_PAYMENT' && (
                          <p>This job is not in PENDING_FOR_PAYMENT status. Current status: {job.status}</p>
                        )}
                        {paymentSchedule?.upfrontPaid && (
                          <p>Upfront payment has already been completed for this job.</p>
                        )}
                        {amount <= 0 && (
                          <p>No upfront payment amount available for this job.</p>
                        )}
                        {paymentSchedule?.paymentType === 'POST_WORK' && (
                          <p>This provider requires payment only after work completion.</p>
                        )}
                      </>
                    )}
                    {paymentType === 'final' && (
                      <>
                        {job.status !== 'PAYMENT_PENDING' && (
                          <p>This job is not in payment pending status. Current status: {job.status}</p>
                        )}
                        {paymentSchedule?.finalPaid && (
                          <p>Final payment has already been completed for this job.</p>
                        )}
                        {amount <= 0 && (
                          <p>No payment amount available for this job.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {canPay && (
              <div className="space-y-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <p className="font-semibold mb-1">Secure Payment</p>
                      <p>Your payment is processed securely through Razorpay. We support UPI, Cards, Net Banking, and Wallets.</p>
                      <p className="mt-2 text-xs text-blue-300">
                        Payment processing time: {paymentProcessingDays} business day{paymentProcessingDays !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || !razorpayLoaded}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <ButtonLoader />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay ₹{amount.toLocaleString()}
                    </>
                  )}
                </button>

                {!razorpayLoaded && (
                  <p className="text-xs text-slate-400 text-center">Loading payment gateway...</p>
                )}
              </div>
            )}

            {paymentType === 'upfront' && paymentSchedule?.upfrontPaid && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-semibold text-green-200">Upfront Payment Completed</p>
                    {paymentSchedule.upfrontPaymentDate && (
                      <p className="text-xs text-green-300 mt-1">
                        Paid on: {new Date(paymentSchedule.upfrontPaymentDate).toLocaleString()}
                      </p>
                    )}
                    {paymentSchedule.paymentType === 'PARTIAL' && (
                      <p className="text-xs text-green-300 mt-1">
                        Final payment of ₹{paymentSchedule.finalAmount.toLocaleString()} will be due after job completion.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {paymentType === 'final' && paymentSchedule?.finalPaid && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-semibold text-green-200">Payment Completed</p>
                    {paymentSchedule.finalPaymentDate && (
                      <p className="text-xs text-green-300 mt-1">
                        Paid on: {new Date(paymentSchedule.finalPaymentDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
