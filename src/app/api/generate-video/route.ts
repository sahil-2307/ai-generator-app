import { NextRequest, NextResponse } from 'next/server'

// Cost optimization: Free video samples for demo purposes
const freeVideoSamples = {
  'cinematic': {
    '9:16': [
      'https://sample-videos.com/zip/10/mp4/SampleVideo_360x640_1mb.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    ],
    '16:9': [
      'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    ]
  },
  'dance': {
    '9:16': [
      'https://sample-videos.com/zip/10/mp4/SampleVideo_360x640_2mb.mp4',
    ],
    '16:9': [
      'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_2mb.mp4',
    ]
  },
  'default': {
    '9:16': [
      'https://sample-videos.com/zip/10/mp4/SampleVideo_360x640_1mb.mp4',
    ],
    '16:9': [
      'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
    ]
  }
}

import { getCurrentUser, getUserProfile, decrementUserCredits, logCreation } from '@/lib/supabase'

// Simple fallback usage tracking for non-authenticated users
let dailyUsage = {
  date: new Date().toDateString(),
  count: 0,
  maxDaily: 1 // Free tier: 1 video for non-authenticated users
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, storyType, aspectRatio, duration, model, useFreeMode } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Premium: Check user credits and authentication
    const user = await getCurrentUser()
    let userProfile = null
    let hasCredits = false

    if (user) {
      const { data, error } = await getUserProfile(user.id)
      if (!error && data) {
        userProfile = data
        hasCredits = data.credits_remaining > 0
      }
    } else {
      // Non-authenticated user - check daily limit
      const today = new Date().toDateString()
      if (dailyUsage.date !== today) {
        dailyUsage = { date: today, count: 0, maxDaily: 1 }
      }
      hasCredits = dailyUsage.count < dailyUsage.maxDaily
    }

    // Block generation if user has no credits and not using free mode
    if (!hasCredits && !useFreeMode) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue generating content.' },
        { status: 402 }
      )
    }

    // Force free mode if no credits or explicitly requested
    const shouldUseFreeMode = useFreeMode || !hasCredits

    if (shouldUseFreeMode) {
      // Return free sample video immediately
      const videoStyle = storyType || 'default'
      const videoAspectRatio = aspectRatio || '9:16'

      const styleVideos = freeVideoSamples[videoStyle as keyof typeof freeVideoSamples] || freeVideoSamples.default
      const aspectVideos = styleVideos[videoAspectRatio as keyof typeof styleVideos] || styleVideos['9:16']
      const randomVideo = aspectVideos[Math.floor(Math.random() * aspectVideos.length)]

      const usageMessage = user
        ? 'No credits remaining. Purchase more credits to generate AI videos.'
        : !hasCredits
          ? `Daily free limit reached (${dailyUsage.maxDaily} video). Please sign up for more creations.`
          : 'Free mode: Using sample video to save costs.'

      return NextResponse.json({
        videoUrl: randomVideo,
        downloadUrl: randomVideo,
        metadata: {
          prompt,
          storyType,
          aspectRatio,
          model,
          mode: 'free_sample',
          note: usageMessage,
          remainingFreeVideos: Math.max(0, dailyUsage.maxDaily - dailyUsage.count),
          source: 'Free sample videos'
        },
      })
    }

    // Google's Veo API is currently in limited preview and the exact endpoint structure
    // may vary. For now, we'll implement a working solution that can be easily updated
    // when the final API is available.

    try {
      // Note: Google Veo API is in limited preview and may not be fully functional
      // For now, we'll provide a demo response that works consistently

      console.log('Attempting Veo API generation for prompt:', prompt)

      // Check if we have a valid API key
      if (!process.env.VEO_API_KEY || process.env.VEO_API_KEY === 'demo_key') {
        console.log('No valid Veo API key - using demo mode')
        throw new Error('Demo mode: No valid Veo API key')
      }

      // Use the correct Google AI video generation endpoint
      const modelName = model === 'veo-3-ultra' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview'
      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predictLongRunning`

      const requestBody = {
        instances: [{
          prompt: `Create a ${storyType} style video: ${prompt}`
        }],
        parameters: {
          aspectRatio: aspectRatio || "9:16",
          negativePrompt: "blurry, low quality, distorted"
        }
      }

      console.log('Making Veo API request to:', apiEndpoint)

      const veoResponse = await fetch(`${apiEndpoint}?key=${process.env.VEO_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!veoResponse.ok) {
        const errorText = await veoResponse.text()
        console.error('Veo API Error:', errorText)

        // If the API call fails, return a helpful demo response immediately
        console.log('Veo API failed, providing demo video immediately')

        // Premium: Still decrement user credits since they attempted generation
        if (user && userProfile) {
          await decrementUserCredits(user.id)
          await logCreation({
            user_id: user.id,
            type: 'video',
            prompt,
            metadata: { storyType, aspectRatio, model, mode: 'demo_fallback', error: 'Veo API Error' },
            cost_credits: 1
          })
        } else {
          dailyUsage.count++
        }

        // Use more reliable video sources that are less likely to timeout
        const getPlaceholderVideo = (storyType: string, aspectRatio: string) => {
          // Use a single reliable source to avoid timeouts
          const reliableVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          return reliableVideo
        }

        const demoVideo = getPlaceholderVideo(storyType, aspectRatio)

        return NextResponse.json({
          videoUrl: demoVideo,
          downloadUrl: demoVideo,
          status: 'completed',
          metadata: {
            prompt,
            storyType,
            aspectRatio,
            model,
            mode: 'demo',
            note: `DEMO MODE: Sample ${storyType} video. Google Veo API is in limited preview. Credits were deducted for this generation attempt.`,
            remainingCredits: user ? Math.max(0, userProfile!.credits_remaining - 1) : Math.max(0, dailyUsage.maxDaily - dailyUsage.count),
          },
        })
      }

      const veoData = await veoResponse.json()
      console.log('Veo API Response:', JSON.stringify(veoData, null, 2))

      // Google's video API returns a long-running operation
      // We need to check if it's still processing or has completed
      if (veoData.name) {
        // This is a long-running operation
        const operationId = veoData.name

        // Premium: Decrement user credits for successful API calls
        if (user && userProfile) {
          await decrementUserCredits(user.id)
          await logCreation({
            user_id: user.id,
            type: 'video',
            prompt,
            metadata: { storyType, aspectRatio, model, operationId },
            cost_credits: 1
          })
        } else {
          // Non-authenticated user
          dailyUsage.count++
        }

        // For now, return operation info (in production, you'd poll for completion)
        return NextResponse.json({
          operationId,
          status: 'processing',
          message: `Video generation started. Operation ID: ${operationId}`,
          metadata: {
            prompt,
            storyType,
            duration,
            model,
            mode: 'ai_generated',
            note: user
              ? `Video is being generated. ${Math.max(0, userProfile!.credits_remaining - 1)} credits remaining.`
              : `Video is being generated. ${dailyUsage.maxDaily - dailyUsage.count} free videos remaining today.`,
            remainingCredits: user ? Math.max(0, userProfile!.credits_remaining - 1) : Math.max(0, dailyUsage.maxDaily - dailyUsage.count),
          },
        })
      }

      // If we get direct video data (unlikely but possible)
      const videoUrl = veoData.response?.predictions?.[0]?.videoUrl ||
                       veoData.predictions?.[0]?.videoUrl ||
                       veoData.videoUrl

      if (videoUrl) {
        return NextResponse.json({
          videoUrl: videoUrl,
          downloadUrl: videoUrl,
          metadata: {
            prompt,
            storyType,
            duration,
            model,
            generatedBy: 'Google Veo API',
          },
        })
      }

      // If no video URL found, something unexpected happened
      throw new Error('No video URL in response')

    } catch (apiError) {
      console.error('Veo API call error:', apiError)

      // Premium: Still decrement user credits since they attempted generation
      if (user && userProfile) {
        await decrementUserCredits(user.id)
        await logCreation({
          user_id: user.id,
          type: 'video',
          prompt,
          metadata: { storyType, aspectRatio, model, mode: 'demo_fallback', error: 'API Exception' },
          cost_credits: 1
        })
      } else {
        dailyUsage.count++
      }

      // Use reliable video source to avoid timeouts
      const getPlaceholderVideo = (storyType: string) => {
        // Use a single reliable source to avoid timeouts
        const reliableVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        return reliableVideo
      }

      const demoVideo = getPlaceholderVideo(storyType)

      return NextResponse.json({
        videoUrl: demoVideo,
        downloadUrl: demoVideo,
        status: 'completed',
        metadata: {
          prompt,
          storyType,
          aspectRatio,
          model,
          mode: 'demo',
          note: `DEMO MODE: Sample ${storyType} video. Veo API is in limited preview. Credits deducted for generation attempt.`,
          remainingCredits: user ? Math.max(0, userProfile!.credits_remaining - 1) : Math.max(0, dailyUsage.maxDaily - dailyUsage.count),
        },
      })
    }

  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}