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

// Multi-tier video generation helper functions
async function tryVeoGeneration(prompt: string, storyType: string, aspectRatio: string, model: string) {
  try {
    console.log('VEO 3.0 API - Premium tier generation')

    // Use the latest VEO 3.1 API endpoint
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/veo-3-1:generateContent`

    const requestBody = {
      contents: [{
        parts: [{
          text: `Generate a ${storyType} style video: ${prompt}`
        }]
      }],
      generationConfig: {
        aspectRatio: aspectRatio || "9:16",
        videoDuration: "8s"
      }
    }

    const veoResponse = await fetch(`${apiEndpoint}?key=${process.env.VEO_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!veoResponse.ok) {
      console.error('VEO API Error:', await veoResponse.text())
      return { success: false }
    }

    const veoData = await veoResponse.json()

    if (veoData.candidates?.[0]?.content?.parts?.[0]?.fileData?.videoUri) {
      return {
        success: true,
        data: {
          videoUrl: veoData.candidates[0].content.parts[0].fileData.videoUri,
          downloadUrl: veoData.candidates[0].content.parts[0].fileData.videoUri,
          metadata: {
            prompt,
            storyType,
            aspectRatio,
            model,
            provider: 'veo-3.1',
            quality: 'premium'
          }
        }
      }
    }

    return { success: false }
  } catch (error) {
    console.error('VEO generation error:', error)
    return { success: false }
  }
}

async function tryPikaGeneration(prompt: string, storyType: string, aspectRatio: string) {
  try {
    console.log('Pika Labs API - Budget tier generation')

    // Pika Labs API endpoint (replace with actual when available)
    const requestBody = {
      prompt: `${storyType} style: ${prompt}`,
      aspect_ratio: aspectRatio === '9:16' ? 'vertical' : 'horizontal',
      duration: 8
    }

    // Note: This is a placeholder - replace with actual Pika API endpoint
    const pikaResponse = await fetch('https://api.pikalabs.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PIKA_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!pikaResponse.ok) {
      console.error('Pika API Error:', await pikaResponse.text())
      return { success: false }
    }

    const pikaData = await pikaResponse.json()

    if (pikaData.video_url) {
      return {
        success: true,
        data: {
          videoUrl: pikaData.video_url,
          downloadUrl: pikaData.video_url,
          metadata: {
            prompt,
            storyType,
            aspectRatio,
            provider: 'pika-labs',
            quality: 'standard',
            cost_per_video: '$0.011' // ~15 credits at $8/700 credits
          }
        }
      }
    }

    return { success: false }
  } catch (error) {
    console.error('Pika generation error:', error)
    return { success: false }
  }
}

async function tryHaiperGeneration(prompt: string, storyType: string, aspectRatio: string) {
  try {
    console.log('Haiper AI API - Standard tier generation')

    // Haiper AI API endpoint (replace with actual when available)
    const requestBody = {
      text: `Create ${storyType} video: ${prompt}`,
      ratio: aspectRatio || '9:16',
      duration: 8
    }

    // Note: This is a placeholder - replace with actual Haiper API endpoint
    const haiperResponse = await fetch('https://api.haiper.ai/v1/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HAIPER_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!haiperResponse.ok) {
      console.error('Haiper API Error:', await haiperResponse.text())
      return { success: false }
    }

    const haiperData = await haiperResponse.json()

    if (haiperData.video_url) {
      return {
        success: true,
        data: {
          videoUrl: haiperData.video_url,
          downloadUrl: haiperData.video_url,
          metadata: {
            prompt,
            storyType,
            aspectRatio,
            provider: 'haiper-ai',
            quality: 'good',
            cost_estimate: '$0.33' // ~$10/30 videos
          }
        }
      }
    }

    return { success: false }
  } catch (error) {
    console.error('Haiper generation error:', error)
    return { success: false }
  }
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

    // Multi-tier AI video generation: VEO 3.0 → Pika Labs → Haiper AI → Demo fallback
    // This provides scalable, cost-effective video generation

    try {
      console.log('Starting multi-tier video generation for prompt:', prompt)

      // Tier 1: Try VEO 3.0 for premium users (if available)
      if (model === 'veo-3-ultra' && process.env.VEO_API_KEY && process.env.VEO_API_KEY !== 'demo_key') {
        console.log('Attempting VEO 3.0 generation (Premium tier)')

        const veoResult = await tryVeoGeneration(prompt, storyType, aspectRatio, model)
        if (veoResult.success) {
          // Premium: Decrement user credits for successful API calls
          if (user && userProfile) {
            await decrementUserCredits(user.id)
            await logCreation({
              user_id: user.id,
              type: 'video',
              prompt,
              metadata: { storyType, aspectRatio, model, provider: 'veo', ...veoResult.data?.metadata },
              cost_credits: 1
            })
          } else {
            dailyUsage.count++
          }
          return NextResponse.json(veoResult.data)
        }
      }

      // Tier 2: Try Pika Labs (most cost-effective)
      if (process.env.PIKA_API_KEY) {
        console.log('Attempting Pika Labs generation (Budget tier)')

        const pikaResult = await tryPikaGeneration(prompt, storyType, aspectRatio)
        if (pikaResult.success) {
          // Decrement user credits
          if (user && userProfile) {
            await decrementUserCredits(user.id)
            await logCreation({
              user_id: user.id,
              type: 'video',
              prompt,
              metadata: { storyType, aspectRatio, model, provider: 'pika', ...pikaResult.data?.metadata },
              cost_credits: 1
            })
          } else {
            dailyUsage.count++
          }
          return NextResponse.json(pikaResult.data)
        }
      }

      // Tier 3: Try Haiper AI (mid-range option)
      if (process.env.HAIPER_API_KEY) {
        console.log('Attempting Haiper AI generation (Standard tier)')

        const haiperResult = await tryHaiperGeneration(prompt, storyType, aspectRatio)
        if (haiperResult.success) {
          // Decrement user credits
          if (user && userProfile) {
            await decrementUserCredits(user.id)
            await logCreation({
              user_id: user.id,
              type: 'video',
              prompt,
              metadata: { storyType, aspectRatio, model, provider: 'haiper', ...haiperResult.data?.metadata },
              cost_credits: 1
            })
          } else {
            dailyUsage.count++
          }
          return NextResponse.json(haiperResult.data)
        }
      }

      // All APIs failed - use demo fallback
      console.log('All video APIs failed, using demo fallback')
      throw new Error('All video generation APIs unavailable')

    } catch (apiError) {
      console.error('Multi-tier API call error:', apiError)

      // Premium: Still decrement user credits since they attempted generation
      if (user && userProfile) {
        await decrementUserCredits(user.id)
        await logCreation({
          user_id: user.id,
          type: 'video',
          prompt,
          metadata: { storyType, aspectRatio, model, mode: 'demo_fallback', error: 'All APIs Failed' },
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
          mode: 'demo_fallback',
          note: `DEMO MODE: All video APIs unavailable. Sample ${storyType} video provided. Credits deducted for generation attempt.`,
          providers_tried: ['VEO 3.0', 'Pika Labs', 'Haiper AI'],
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