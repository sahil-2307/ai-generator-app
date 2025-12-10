'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchase: (planType: string) => Promise<void>
}

const pricingPlans = [
  {
    id: 'basic',
    name: 'Basic Pack',
    price: 99,
    credits: 5,
    features: [
      '5 AI Creations',
      'HD Quality Videos',
      'Premium Images',
      'Basic Support',
      'Commercial License'
    ],
    popular: false,
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 199,
    credits: 12,
    features: [
      '12 AI Creations',
      '4K Quality Videos',
      'Ultra HD Images',
      'Priority Support',
      'Commercial License',
      'Advanced AI Models'
    ],
    popular: true,
    color: 'from-violet-600 to-purple-600'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    price: 399,
    credits: 30,
    features: [
      '30 AI Creations',
      '8K Quality Videos',
      'Ultra HD Images',
      'VIP Support',
      'Extended License',
      'Custom AI Training',
      'API Access'
    ],
    popular: false,
    color: 'from-pink-600 to-rose-600'
  }
]

export default function PricingModal({ isOpen, onClose, onPurchase }: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handlePurchase = async (planId: string) => {
    setLoading(planId)
    try {
      await onPurchase(planId)
    } catch (error) {
      console.error('Purchase failed:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border border-gray-200 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Unlock TheAIVault
                  </h2>
                  <p className="text-gray-600 mt-1">Choose your creative power level</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`relative bg-white border rounded-xl p-5 transition-all duration-200 ${
                      plan.popular
                        ? 'border-blue-500 shadow-lg shadow-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    } hover:shadow-md`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-5">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-bold mb-1 text-gray-900">
                        ₹{plan.price}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {plan.credits} AI Creations
                      </p>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePurchase(plan.id)}
                      disabled={loading === plan.id}
                      className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                        plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `Get ${plan.credits} Credits`
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  ✨ Secure payments powered by Cashfree • 256-bit SSL encryption
                </p>
                <p className="text-xs text-gray-500">
                  All plans include commercial licensing • No hidden fees • Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}