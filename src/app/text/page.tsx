'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCurrentUser } from '@/lib/supabase'
import TextGeneration from '@/components/TextGeneration'
import UserDropdown from '@/components/UserDropdown'
import AuthModal from '@/components/AuthModal'
import PricingModal from '@/components/PricingModal'
import Link from 'next/link'

export default function TextPage() {
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    getCurrentUser().then(setUser)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (event === 'SIGNED_IN' && session?.user) {
          setShowAuth(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleGenerationComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePurchase = async (planType: string) => {
    if (!user) {
      setShowAuth(true)
      return
    }

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planType,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.paymentSessionId) {
        // Create a form to POST to Cashfree checkout
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = 'https://sandbox.cashfree.com/pg/view/sessions/checkout'
        form.target = '_blank'

        const sessionInput = document.createElement('input')
        sessionInput.type = 'hidden'
        sessionInput.name = 'payment_session_id'
        sessionInput.value = data.paymentSessionId

        form.appendChild(sessionInput)
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)
      }
    } catch (error) {
      console.error('Payment creation failed:', error)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm relative z-40">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-white">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  TheAIVault
                </h1>
                <p className="text-xs text-gray-600">Text Generation</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <UserDropdown onPurchase={handlePurchase} onShowPricing={() => setShowPricing(true)} refreshTrigger={refreshTrigger} />
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <TextGeneration onGenerationComplete={handleGenerationComplete} />
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false)
        }}
      />

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPurchase={handlePurchase}
      />
    </main>
  )
}