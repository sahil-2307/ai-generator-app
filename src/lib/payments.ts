export const handlePaymentFlow = async (planType: string, user: any, createUserProfile: (user: any) => Promise<void>) => {
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    // Ensure user profile exists before payment
    await createUserProfile(user)

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

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Payment creation failed:', errorData)
      throw new Error('Failed to create payment. Please try again.')
    }

    const data = await response.json()
    console.log('Payment response:', data)

    if (data.demo || data.error) {
      // Handle demo mode or API errors
      console.log('Payment in demo mode:', data)
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank')
      } else {
        throw new Error('Payment system is currently in demo mode. Please try again later.')
      }
      return
    }

    if (data.paymentSessionId) {
      // Determine correct Cashfree URL based on environment
      const isProduction = typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        !window.location.hostname.includes('127.0.0.1')

      const cashfreeCheckoutUrl = isProduction
        ? 'https://payments.cashfree.com/pg/view/sessions/checkout'
        : 'https://sandbox.cashfree.com/pg/view/sessions/checkout'

      console.log('Opening Cashfree checkout:', cashfreeCheckoutUrl)

      // Create a form to POST to Cashfree checkout
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = cashfreeCheckoutUrl
      form.target = '_blank'

      const sessionInput = document.createElement('input')
      sessionInput.type = 'hidden'
      sessionInput.name = 'payment_session_id'
      sessionInput.value = data.paymentSessionId

      form.appendChild(sessionInput)
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    } else {
      console.error('No payment session ID received:', data)
      throw new Error('Failed to initialize payment. Please try again.')
    }
  } catch (error) {
    console.error('Payment creation failed:', error)
    throw error
  }
}