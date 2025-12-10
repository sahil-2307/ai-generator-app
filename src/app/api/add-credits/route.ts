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

const pricingPlans = {
  basic: { credits: 5, price: 99, name: 'Basic Pack' },
  pro: { credits: 12, price: 199, name: 'Pro Pack' },
  premium: { credits: 30, price: 399, name: 'Premium Pack' }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json()

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Order ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get payment record from database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('cashfree_order_id', orderId)
      .eq('user_id', userId)
      .single()

    if (paymentError || !payment) {
      console.error('Payment record not found:', orderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if credits already added
    if (payment.status === 'completed') {
      return NextResponse.json({
        message: 'Credits already added',
        credits: payment.credits
      })
    }

    // Get plan details
    const plan = pricingPlans[payment.plan_id as keyof typeof pricingPlans]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get current user credits
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('credits_remaining')
      .eq('id', payment.user_id)
      .single()

    if (userError || !user) {
      console.error('User not found:', payment.user_id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add credits to user account
    const newCredits = user.credits_remaining + plan.credits
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        credits_remaining: newCredits,
        subscription_status: newCredits > 1 ? 'premium' : 'free'
      })
      .eq('id', payment.user_id)

    if (updateError) {
      console.error('Error updating user credits:', updateError)
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    console.log('Credits added manually:', {
      userId: payment.user_id,
      orderId,
      oldCredits: user.credits_remaining,
      addedCredits: plan.credits,
      newCredits
    })

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      oldCredits: user.credits_remaining,
      addedCredits: plan.credits,
      newCredits,
      plan: plan.name
    })

  } catch (error) {
    console.error('Add credits error:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}