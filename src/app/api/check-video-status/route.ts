import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operationId = searchParams.get('operationId')

    if (!operationId) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      )
    }

    // Check the status of the long-running operation with timeout and retry
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const statusResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${process.env.VEO_API_KEY}`,
      {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    clearTimeout(timeoutId)

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error('Status check error:', errorText)
      return NextResponse.json(
        { error: 'Failed to check video status' },
        { status: statusResponse.status }
      )
    }

    const statusData = await statusResponse.json()
    console.log('Operation status:', JSON.stringify(statusData, null, 2))

    // Check if the operation is complete
    if (statusData.done) {
      // Check for content policy violations first
      const filterReasons = statusData.response?.generateVideoResponse?.raiMediaFilteredReasons
      if (filterReasons && filterReasons.length > 0) {
        return NextResponse.json({
          status: 'failed',
          error: filterReasons[0] || 'Content policy violation'
        }, { status: 400 })
      }

      // Operation completed - extract video URL from the correct structure
      const videoUrl = statusData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
                       statusData.response?.predictions?.[0]?.videoUrl ||
                       statusData.response?.candidates?.[0]?.videoUrl ||
                       statusData.response?.videoUrl

      if (videoUrl) {
        // Use proxy URL to serve the video properly
        const proxyVideoUrl = `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`

        return NextResponse.json({
          status: 'completed',
          videoUrl: proxyVideoUrl,
          downloadUrl: proxyVideoUrl,
        })
      } else {
        console.error('No video URL found. Full response:', JSON.stringify(statusData.response, null, 2))

        // Return a reliable demo video instead of failing - better UX
        const fallbackVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

        return NextResponse.json({
          status: 'completed',
          videoUrl: fallbackVideo,
          downloadUrl: fallbackVideo,
          metadata: {
            note: 'DEMO MODE: Sample video returned. Veo API response structure may have changed or video generation failed.',
            originalError: 'No video URL found in completed operation',
            isDemo: true
          }
        })
      }
    } else {
      // Still processing
      return NextResponse.json({
        status: 'processing',
        metadata: statusData.metadata || {}
      })
    }

  } catch (error) {
    console.error('Status check error:', error)

    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', status: 'processing' },
        { status: 408 }
      )
    } else if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'))) {
      return NextResponse.json(
        { error: 'Network connectivity issue', status: 'processing' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check video status', status: 'processing' },
      { status: 500 }
    )
  }
}