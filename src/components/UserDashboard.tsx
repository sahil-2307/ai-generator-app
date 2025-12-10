'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'
import type { User } from '@/lib/supabase'
import PricingModal from './PricingModal'

interface UserDashboardProps {
  onPurchase: (planType: string) => Promise<void>
}

export default function UserDashboard({ onPurchase }: UserDashboardProps) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPricing, setShowPricing] = useState(false)

  useEffect(() => {
    loadUser()

    // Listen for auth state changes and refresh user data
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Add a small delay to ensure any backend updates are completed
        setTimeout(() => {
          loadUser()
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
      }
    })

    // Listen for storage changes (cross-tab communication for payment success)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data_refresh' && e.newValue && user) {
        loadUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check for refresh trigger on component mount
    if (localStorage.getItem('user_data_refresh') && user) {
      loadUser()
      localStorage.removeItem('user_data_refresh')
    }

    // Also refresh when the component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadUser()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const handleFocus = () => {
      if (user) {
        loadUser()
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        const { data, error } = await getUserProfile(currentUser.id)
        if (!error && data) {
          setUserProfile(data)
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-border/20">
        <div className="animate-pulse">
          <div className="h-4 bg-muted/20 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-muted/20 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-border/20 hover:border-violet-500/30 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{user.email}</h3>
              <p className="text-sm text-muted-foreground">
                {userProfile?.subscription_status === 'premium' ? 'Premium Member' : 'Free Tier'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">💎</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {userProfile?.credits_remaining || 0}
                </p>
                <p className="text-sm text-muted-foreground">Credits Left</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🎨</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {userProfile?.total_creations || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Created</p>
              </div>
            </div>
          </div>
        </div>

        {(userProfile?.credits_remaining || 0) === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-semibold text-foreground">Out of Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Purchase more credits to continue creating amazing content
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPricing(true)}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
            >
              Get More Credits
            </button>
          </motion.div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowPricing(true)}
            className="flex-1 py-3 bg-muted/20 text-foreground rounded-xl font-medium hover:bg-muted/40 transition-all duration-300"
          >
            Buy Credits
          </button>
          <button
            onClick={loadUser}
            className="px-4 py-3 bg-muted/20 text-foreground rounded-xl font-medium hover:bg-muted/40 transition-all duration-300"
          >
            🔄
          </button>
        </div>

        {userProfile?.last_creation_at && (
          <div className="mt-4 pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              Last creation: {new Date(userProfile.last_creation_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </motion.div>

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPurchase={onPurchase}
      />
    </>
  )
}