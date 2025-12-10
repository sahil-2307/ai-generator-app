import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations (server-side only)
const createSupabaseAdmin = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Only create admin client on server side
export const supabaseAdmin = typeof window === 'undefined' ? createSupabaseAdmin() : null

// Database types for TypeScript
export interface User {
  id: string
  email: string
  created_at: string
  subscription_status: 'free' | 'premium' | 'pro'
  credits_remaining: number
  total_creations: number
  last_creation_at?: string
}

export interface Creation {
  id: string
  user_id: string
  type: 'video' | 'image' | 'text'
  prompt: string
  result_url?: string
  metadata: any
  created_at: string
  cost_credits: number
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  cashfree_order_id: string
  created_at: string
  completed_at?: string
}

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (userId: string) => {
  // If we're on the client side, use the API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(`/api/user-profile?userId=${encodeURIComponent(userId)}`)
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: { message: errorData.error || 'Failed to fetch user profile' } }
      }
      const result = await response.json()
      return { data: result.data, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Network error fetching user profile' } }
    }
  }

  // Server-side: use admin client directly
  if (!supabaseAdmin) {
    return { data: null, error: { message: 'Supabase admin client not available on server' } }
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

export const createUserProfile = async (user: any) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      subscription_status: 'free',
      credits_remaining: 1, // 1 free creation
      total_creations: 0
    })
    .select()
    .single()

  return { data, error }
}

export const updateUserCredits = async (userId: string, creditsToAdd: number) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  // Use the database function for safe credit addition
  const { error } = await supabaseAdmin
    .rpc('add_user_credits', {
      p_user_id: userId,
      p_credits: creditsToAdd
    })

  if (error) {
    return { data: null, error }
  }

  // Get updated user data to return
  const { data, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error: fetchError }
}

export const logCreation = async (creation: Omit<Creation, 'id' | 'created_at'>) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  // Insert the creation record
  const { data, error } = await supabaseAdmin
    .from('creations')
    .insert(creation)
    .select()
    .single()

  if (error) {
    return { data, error }
  }

  // Update usage analytics using the database function
  const { error: analyticsError } = await supabaseAdmin
    .rpc('update_usage_analytics', {
      p_user_id: creation.user_id,
      p_type: creation.type,
      p_credits_used: creation.cost_credits || 1
    })

  if (analyticsError) {
    // Don't fail the creation if analytics update fails
  }

  return { data, error }
}

export const decrementUserCredits = async (userId: string) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  // Use the database function for safe credit decrementing
  const { data, error } = await supabaseAdmin
    .rpc('decrement_user_credits', {
      p_user_id: userId,
      p_credits: 1
    })

  if (error) {
    return { data: null, error }
  }

  if (!data) {
    return {
      data: null,
      error: { message: 'Insufficient credits' }
    }
  }

  // Get updated user data to return
  const { data: updatedUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data: updatedUser, error: fetchError }
}