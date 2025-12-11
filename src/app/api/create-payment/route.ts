import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

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

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com'

const pricingPlans = {
  basic: { credits: 5, price: 99, name: 'Basic Pack' },
  pro: { credits: 12, price: 199, name: 'Pro Pack' },
  premium: { credits: 30, price: 399, name: 'Premium Pack' }
}

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Plan ID and User ID are required' },
        { status: 400 }
      )
    }

    const plan = pricingPlans[planId as keyof typeof pricingPlans]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get user email for payment processing
    // For now, we'll use a default email pattern since RLS prevents server-side user creation
    const userEmail = `user-${userId.substring(0, 8)}@example.com`
    const userData = { email: userEmail }

    console.log('Using email for payment:', userEmail)

    // Generate unique order ID
    const orderId = `theaivault_${Date.now()}_${uuidv4().split('-')[0]}`

    // Create Cashfree order with real user data
    const orderData = {
      order_id: orderId,
      order_amount: plan.price,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: userData.email.split('@')[0] || 'TheAIVault User',
        customer_email: userData.email,
        customer_phone: '9999999999' // Default phone, could be enhanced to collect this
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?orderId=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-webhook`,
        payment_methods: 'cc,dc,upi,nb'
      },
      order_note: `TheAIVault ${plan.name} - ${plan.credits} Credits`
    }

    // Debug: Log the API call
    console.log('Making Cashfree API call with:')
    console.log('App ID:', CASHFREE_APP_ID)
    console.log('Secret Key exists:', !!CASHFREE_SECRET_KEY)
    console.log('Secret Key length:', CASHFREE_SECRET_KEY?.length)
    console.log('Secret Key (first 10 chars):', CASHFREE_SECRET_KEY?.substring(0, 10))
    console.log('Base URL:', CASHFREE_BASE_URL)
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Order Data:', JSON.stringify(orderData, null, 2))

    // Check if required environment variables are present
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('Missing required Cashfree credentials')
      return NextResponse.json({
        paymentUrl: `/payment-demo?orderId=${orderId}&amount=${plan.price}&plan=${planId}`,
        orderId,
        amount: plan.price,
        demo: true,
        error: 'Missing Cashfree API credentials',
        details: 'CASHFREE_APP_ID or CASHFREE_SECRET_KEY not configured'
      })
    }

    // Make request to Cashfree
    const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/pg/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY
      },
      body: JSON.stringify(orderData)
    })

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text()
      console.error('Cashfree API Error:', errorText)
      console.error('Response status:', cashfreeResponse.status)
      console.error('Response headers:', Object.fromEntries(cashfreeResponse.headers))

      // Return a mock payment URL for demo purposes
      return NextResponse.json({
        paymentUrl: `/payment-demo?orderId=${orderId}&amount=${plan.price}&plan=${planId}`,
        orderId,
        amount: plan.price,
        demo: true,
        error: 'Cashfree API Error',
        details: errorText
      })
    }

    const cashfreeData = await cashfreeResponse.json()
    console.log('Cashfree API Response:', JSON.stringify(cashfreeData, null, 2))

    // Try to store payment record in Supabase
    try {
      const { error: paymentError } = await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: plan.price,
        currency: 'INR',
        status: 'pending',
        cashfree_order_id: orderId,
        plan_id: planId,
        credits: plan.credits
      })

      if (paymentError) {
        console.log('Could not store payment record:', paymentError)
        console.log('Proceeding with payment anyway...')
      } else {
        console.log('Payment record stored successfully')
      }
    } catch (error) {
      console.log('Error storing payment record:', error)
      console.log('Proceeding with payment anyway...')
    }

    // Return payment session data for client-side checkout
    return NextResponse.json({
      paymentSessionId: cashfreeData.payment_session_id,
      orderId,
      amount: plan.price,
      cfOrderId: cashfreeData.cf_order_id,
      orderStatus: cashfreeData.order_status
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}