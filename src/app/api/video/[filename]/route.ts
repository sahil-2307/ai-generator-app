import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const initializeS3Client = () => {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const bucketName = process.env.AWS_S3_BUCKET

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Missing AWS environment variables')
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'the-ai-vault-live'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const s3Client = initializeS3Client()
    const filename = decodeURIComponent(params.filename)
    const key = `Content/videos/${filename}`

    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return new NextResponse('Video not found', { status: 404 })
    }

    // Convert the response body to a readable stream
    const stream = response.Body as ReadableStream

    // Set appropriate headers for video streaming
    const headers = new Headers()
    headers.set('Content-Type', response.ContentType || 'video/mp4')
    headers.set('Content-Length', response.ContentLength?.toString() || '0')
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=31536000')

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET')
    headers.set('Access-Control-Allow-Headers', 'Range')

    // Handle range requests for video seeking
    const range = request.headers.get('range')
    if (range && response.ContentLength) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : response.ContentLength - 1
      const chunksize = (end - start) + 1

      headers.set('Content-Range', `bytes ${start}-${end}/${response.ContentLength}`)
      headers.set('Content-Length', chunksize.toString())

      return new NextResponse(stream, {
        status: 206,
        headers,
      })
    }

    return new NextResponse(stream, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('Error streaming video:', error)
    return new NextResponse('Failed to load video', { status: 500 })
  }
}