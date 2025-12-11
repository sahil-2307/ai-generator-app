import { NextRequest, NextResponse } from 'next/server'
import { getSignedDownloadUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      )
    }

    // Generate a signed URL that's valid for 1 hour
    const signedUrl = await getSignedDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      signedUrl
    })

  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}