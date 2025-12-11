'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'
import type { User } from '@/lib/supabase'
import Link from 'next/link'
import {
  User as UserIcon,
  CreditCard,
  BarChart3,
  RefreshCw,
  LogOut,
  ChevronDown,
  Coins,
  Calendar,
  AlertTriangle,
  Crown,
  Gallery
} from 'lucide-react'

interface UserDropdownProps {
  onPurchase: (planType: string) => Promise<void>
  onShowPricing: () => void
  refreshTrigger?: number
}

export default function UserDropdown({ onPurchase, onShowPricing, refreshTrigger }: UserDropdownProps) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

    return () => subscription.unsubscribe()
  }, [])

  // Refresh user data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadUser()
    }
  }, [refreshTrigger])

  // Also refresh when the component becomes visible (like when user returns from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadUser()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also listen for page focus to refresh data
    const handleFocus = () => {
      if (user) {
        loadUser()
      }
    }

    window.addEventListener('focus', handleFocus)

    // Listen for storage changes (cross-tab communication for payment success)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data_refresh' && e.newValue && user) {
        loadUser()
        // Clear the trigger
        localStorage.removeItem('user_data_refresh')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check for refresh trigger on component mount
    if (localStorage.getItem('user_data_refresh') && user) {
      loadUser()
      localStorage.removeItem('user_data_refresh')
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200 shadow-sm bg-white"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-semibold text-slate-800">
            {user.email?.split('@')[0]}
          </div>
          <div className={`text-xs flex items-center gap-1 ${(userProfile?.credits_remaining || 0) <= 0 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
            <Coins className="w-3 h-3" />
            {userProfile?.credits_remaining ?? '?'} credits
            {userProfile ? '' : ' (loading...)'}
            {(userProfile?.credits_remaining || 0) <= 0 && userProfile && <AlertTriangle className="w-3 h-3 text-red-500" />}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Optional for extra coverage */}
            <div className="fixed inset-0 z-[9998]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/50 z-[9999] overflow-hidden"
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
            >
            {/* User Info Header */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 border-b border-gray-100/70">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-base">{user.email}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {userProfile?.subscription_status === 'premium' ? (
                      <>
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-600 font-medium">Premium Member</span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-4 h-4" />
                        <span>Free Tier</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Coins className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        {userProfile?.credits_remaining || 0}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">Credits Left</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100/50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        {userProfile?.total_creations || 0}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">Total Created</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Out of Credits Warning */}
            {(userProfile?.credits_remaining || 0) === 0 && (
              <div className="px-5 pb-4">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="font-semibold text-red-800">Credits Depleted</div>
                  </div>
                  <div className="text-sm text-red-700 mb-4">
                    Purchase additional credits to continue creating with our AI tools
                  </div>
                  <button
                    onClick={() => {
                      onShowPricing()
                      setIsOpen(false)
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Purchase Credits
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-5 space-y-2 border-t border-gray-100/70">
              <Link
                href="/gallery"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Gallery className="w-4 h-4" />
                View Gallery
              </Link>
              <button
                onClick={() => {
                  onShowPricing()
                  setIsOpen(false)
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Purchase Credits
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    loadUser()
                    setIsOpen(false)
                  }}
                  className="py-2.5 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={handleSignOut}
                  className="py-2.5 px-3 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Last Creation */}
            {userProfile?.last_creation_at && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <Calendar className="w-3 h-3" />
                  <span>Last creation: {new Date(userProfile.last_creation_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}