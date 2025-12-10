'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getUserProfile, getCurrentUser } from '@/lib/supabase'

interface CreditConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  contentType: 'video' | 'image' | 'text'
  prompt: string
}

export default function CreditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  contentType,
  prompt
}: CreditConfirmationModalProps) {
  const [userCredits, setUserCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadUserCredits()
    }
  }, [isOpen])

  const loadUserCredits = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const { data } = await getUserProfile(user.id)
        if (data) {
          setUserCredits(data.credits_remaining)
        }
      }
    } catch (error) {
      console.error('Error loading user credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const getContentIcon = () => {
    switch (contentType) {
      case 'video': return '🎬'
      case 'image': return '🖼️'
      case 'text': return '📝'
      default: return '🎨'
    }
  }

  const getContentTypeText = () => {
    switch (contentType) {
      case 'video': return 'video'
      case 'image': return 'image'
      case 'text': return 'text content'
      default: return 'content'
    }
  }

  const truncatedPrompt = prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{getContentIcon()}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirm Generation
              </h2>
              <p className="text-gray-600 text-sm">
                Are you sure you want to generate this {getContentTypeText()}?
              </p>
            </div>

            {/* Prompt Preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">Your prompt:</div>
              <div className="text-sm text-gray-600 italic">"{truncatedPrompt}"</div>
            </div>

            {/* Credit Information */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">💎</span>
                  <span className="font-medium text-orange-800">Credit Cost</span>
                </div>
                <span className="text-xl font-bold text-orange-600">1 Credit</span>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="text-sm">Loading balance...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current balance:</span>
                  <span className="font-medium text-gray-800">{userCredits} credits</span>
                </div>
              )}

              {!loading && userCredits > 0 && (
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-orange-200">
                  <span className="text-gray-600">After generation:</span>
                  <span className="font-medium text-green-600">{userCredits - 1} credits</span>
                </div>
              )}

              {!loading && userCredits <= 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm font-medium">⚠️ Insufficient Credits</div>
                  <div className="text-red-600 text-xs mt-1">
                    You need to purchase credits to continue generating content.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || userCredits <= 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : userCredits <= 0 ? 'No Credits' : 'Generate'}
              </button>
            </div>

            {!loading && userCredits > 0 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Credits are automatically deducted upon successful generation
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}