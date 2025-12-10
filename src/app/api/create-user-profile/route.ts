import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user profile already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return NextResponse.json({
        message: 'User profile already exists',
        user: existingUser
      })
    }

    // Create user profile
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email || `user-${userId.substring(0, 8)}@example.com`,
        subscription_status: 'free',
        credits_remaining: 1, // 1 free creation
        total_creations: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user profile:', createError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: createError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User profile created successfully',
      user: newUser
    })

  } catch (error) {
    console.error('User profile creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}