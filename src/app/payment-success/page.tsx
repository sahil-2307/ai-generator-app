'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    loadPaymentDetails()
  }, [orderId])

  const loadPaymentDetails = async () => {
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }
      setUser(currentUser)

      if (orderId) {
        // Get payment details
        const { data: payment, error } = await supabase
          .from('payments')
          .select('*')
          .eq('cashfree_order_id', orderId)
          .single()

        if (!error && payment) {
          setPaymentData(payment)

          // Automatically add credits if payment exists and not completed
          if (payment.status === 'pending') {
            try {
              const response = await fetch('/api/add-credits', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId,
                  userId: currentUser.id,
                }),
              })

              const result = await response.json()
              console.log('Credit addition result:', result)

              // Refresh payment data after adding credits
              if (result.success) {
                const { data: updatedPayment } = await supabase
                  .from('payments')
                  .select('*')
                  .eq('cashfree_order_id', orderId)
                  .single()

                if (updatedPayment) {
                  setPaymentData(updatedPayment)
                }

                // Trigger global refresh for all components
                localStorage.setItem('user_data_refresh', Date.now().toString())
              }
            } catch (error) {
              console.error('Error adding credits:', error)
            }
          }
        }
      }

      // Get updated user profile
      const { data: profile } = await getUserProfile(currentUser.id)
      setUserProfile(profile)

    } catch (error) {
      console.error('Error loading payment details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-white">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">TheAIVault</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
            <p className="text-xl text-gray-600 mb-2">
              Thank you for your purchase. Your credits have been added to your account.
            </p>
            {paymentData && (
              <p className="text-sm text-gray-500">
                Order ID: {paymentData.cashfree_order_id}
              </p>
            )}
          </motion.div>

          {/* Payment Details */}
          {paymentData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 rounded-2xl p-8 mb-8 max-w-2xl mx-auto"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Purchase Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="font-medium text-gray-700 mb-2">Plan Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium capitalize">{paymentData.plan_id} Pack</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credits:</span>
                      <span className="font-medium">{paymentData.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">₹{paymentData.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="font-medium text-gray-700 mb-2">Account Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Premium</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Credits:</span>
                      <span className="font-medium">{userProfile?.credits_remaining || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Creations:</span>
                      <span className="font-medium">{userProfile?.total_creations || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/video"
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
            >
              Create Video
            </Link>
            <Link
              href="/image"
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
            >
              Generate Image
            </Link>
            <Link
              href="/text"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              Write with AI
            </Link>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-500 text-sm mb-4">
              Your credits never expire and can be used for any type of AI creation.
            </p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </motion.div>

          {/* Confetti Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed inset-0 pointer-events-none overflow-hidden"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  y: -100,
                  x: Math.random() * window.innerWidth,
                  rotate: 0
                }}
                animate={{
                  opacity: [0, 1, 0],
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                style={{
                  background: `linear-gradient(45deg, ${
                    ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981'][Math.floor(Math.random() * 4)]
                  }, ${
                    ['#A78BFA', '#F472B6', '#22D3EE', '#34D399'][Math.floor(Math.random() * 4)]
                  })`
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}