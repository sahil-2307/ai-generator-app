import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getUserProfile, decrementUserCredits, logCreation } from '@/lib/supabase'

// Free sample images from Unsplash with different styles and sizes
const dummyImages = {
  'photorealistic': {
    '1024x1024': [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1520637836862-4d197d17c50a?w=1024&h=1024&fit=crop&crop=center',
    ],
    '1024x1792': [
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1024&h=1792&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1024&h=1792&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1792&fit=crop&crop=center',
    ],
    '1792x1024': [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1792&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1792&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1792&h=1024&fit=crop&crop=center',
    ]
  },
  'digital-art': {
    '1024x1024': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1024&h=1024&fit=crop&crop=center',
    ],
    '1024x1792': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1024&h=1792&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1024&h=1792&fit=crop&crop=center',
    ],
    '1792x1024': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1792&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1792&h=1024&fit=crop&crop=center',
    ]
  },
  'anime': {
    '1024x1024': [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1024&h=1024&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1024&h=1024&fit=crop&crop=center',
    ],
    '1024x1792': [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1024&h=1792&fit=crop&crop=center',
    ],
    '1792x1024': [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1792&h=1024&fit=crop&crop=center',
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, style, size, model, userId } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check user authentication and credits
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: userProfile, error: profileError } = await getUserProfile(userId)
    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user has credits
    if (userProfile.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue generating content.' },
        { status: 402 }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    try {
      // Try to generate with OpenAI DALL-E
      console.log('Making DALL-E API request:', {
        prompt: `${prompt} in ${style} style`,
        size,
        model
      })

      const dalleSize = size === '1024x1792' ? '1024x1792' :
                       size === '1792x1024' ? '1792x1024' : '1024x1024'

      const generateParams: any = {
        model: model === 'dalle-3' ? 'dall-e-3' : 'dall-e-2',
        prompt: `${prompt} in ${style} style`,
        size: dalleSize as any,
        n: 1,
      }

      // Only add quality parameter for DALL-E 3
      if (model === 'dalle-3') {
        generateParams.quality = 'hd'
      }

      const response = await openai.images.generate(generateParams)

      const imageUrl = response.data?.[0]?.url

      if (imageUrl) {
        // Decrement user credits after successful generation
        await decrementUserCredits(userId)
        await logCreation({
          user_id: userId,
          type: 'image',
          prompt,
          result_url: imageUrl,
          metadata: { style, size, model, generatedBy: 'OpenAI DALL-E' },
          cost_credits: 1
        })

        return NextResponse.json({
          imageUrl,
          downloadUrl: imageUrl,
          metadata: {
            prompt,
            style,
            size,
            model,
            generatedBy: 'OpenAI DALL-E',
          },
        })
      }

      throw new Error('No image URL in response')

    } catch (apiError) {
      console.error('DALL-E API call error:', apiError)

      // Decrement user credits even for demo mode
      await decrementUserCredits(userId)

      // Fallback to demo images with explanation
      const getPlaceholderImage = (style: string, size: string) => {
        const styleImages = dummyImages[style as keyof typeof dummyImages] || dummyImages.photorealistic
        const sizeImages = styleImages[size as keyof typeof styleImages] || styleImages['1024x1024']
        const randomImage = sizeImages[Math.floor(Math.random() * sizeImages.length)]
        return randomImage
      }

      const placeholderImage = getPlaceholderImage(style, size)

      await logCreation({
        user_id: userId,
        type: 'image',
        prompt,
        result_url: placeholderImage,
        metadata: { style, size, model, mode: 'demo', source: 'Unsplash (Free Stock Photos)' },
        cost_credits: 1
      })

      return NextResponse.json({
        imageUrl: placeholderImage,
        downloadUrl: placeholderImage,
        metadata: {
          prompt,
          style,
          size,
          model,
          note: `DEMO MODE: Sample ${style} image (${size}). DALL-E API may require valid API key or credits. Credits deducted.`,
          source: 'Unsplash (Free Stock Photos)',
        },
      })
    }

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}