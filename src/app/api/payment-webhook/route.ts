import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
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
  basic: { credits: 5, price: 99 },
  pro: { credits: 12, price: 199 },
  premium: { credits: 30, price: 399 }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify Cashfree webhook signature
    const signature = request.headers.get('x-cashfree-signature')
    const timestamp = request.headers.get('x-cashfree-timestamp')

    if (!signature || !timestamp) {
      console.error('Missing webhook signature or timestamp')
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    // Verify signature (optional but recommended for production)
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET
    if (webhookSecret) {
      const expectedSignature = createHash('sha256')
        .update(timestamp + JSON.stringify(body))
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const { data } = body
    const { order } = data

    console.log('Payment webhook received:', {
      orderId: order.order_id,
      status: order.order_status,
      amount: order.order_amount
    })

    // Only process successful payments
    if (order.order_status === 'PAID') {
      // Get payment record from database
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('cashfree_order_id', order.order_id)
        .single()

      if (paymentError || !payment) {
        console.error('Payment record not found:', order.order_id)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('cashfree_order_id', order.order_id)

      // Add credits to user account
      const plan = pricingPlans[payment.plan_id as keyof typeof pricingPlans]
      if (plan) {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('credits_remaining')
          .eq('id', payment.user_id)
          .single()

        if (!userError && user) {
          const newCredits = user.credits_remaining + plan.credits
          await supabaseAdmin
            .from('users')
            .update({
              credits_remaining: newCredits,
              subscription_status: newCredits > 1 ? 'premium' : 'free'
            })
            .eq('id', payment.user_id)

          console.log('Credits updated:', {
            userId: payment.user_id,
            oldCredits: user.credits_remaining,
            addedCredits: plan.credits,
            newCredits
          })
        }
      }
    } else if (order.order_status === 'FAILED' || order.order_status === 'CANCELLED') {
      // Update payment status to failed
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('cashfree_order_id', order.order_id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}