import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoUrl = searchParams.get('url')

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Add API key to the Google AI video URL
    const authenticatedUrl = `${videoUrl}&key=${process.env.VEO_API_KEY}`

    // Fetch the video from Google AI
    const response = await fetch(authenticatedUrl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Video fetch error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: response.status })
    }

    // Get the video data
    const videoBuffer = await response.arrayBuffer()

    // Return the video with proper headers
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
        'Content-Length': response.headers.get('Content-Length') || videoBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Video proxy error:', error)
    return NextResponse.json({ error: 'Failed to proxy video' }, { status: 500 })
  }
}