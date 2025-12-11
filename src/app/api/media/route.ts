import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// Initialize S3 client with error handling
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
const IMAGES_PREFIX = 'Content/images/'
const VIDEOS_PREFIX = 'Content/videos/'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables first
    const s3Client = initializeS3Client()

    // Function to list objects from S3 folder
    const listS3Objects = async (prefix: string, type: 'video' | 'image') => {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })

      const response = await s3Client.send(command)

      return (response.Contents || [])
        .filter(obj => obj.Key && obj.Key !== prefix) // Exclude folder itself
        .map(obj => {
          const filename = obj.Key!.split('/').pop() || obj.Key!
          const ext = filename.split('.').pop()?.toLowerCase() || ''

          return {
            filename,
            url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
            type,
            size: obj.Size || 0,
            modified: obj.LastModified?.toISOString() || new Date().toISOString(),
            extension: `.${ext}`,
            key: obj.Key
          }
        })
    }

    // Fetch images and videos from S3
    const [images, videos] = await Promise.all([
      listS3Objects(IMAGES_PREFIX, 'image'),
      listS3Objects(VIDEOS_PREFIX, 'video')
    ])

    // Combine and sort by modification date
    const mediaFiles = [...images, ...videos]
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())

    return NextResponse.json({
      files: mediaFiles,
      total: mediaFiles.length,
      videos: videos.length,
      images: images.length,
      source: 'S3',
      bucket: BUCKET_NAME,
      folders: {
        images: IMAGES_PREFIX,
        videos: VIDEOS_PREFIX
      }
    })

  } catch (error) {
    console.error('Error fetching S3 media files:', error)

    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: 'Failed to fetch media files from S3',
        details: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          hasAwsRegion: !!process.env.AWS_REGION,
          hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          hasAwsBucket: !!process.env.AWS_S3_BUCKET,
          bucketName: process.env.AWS_S3_BUCKET || 'Not set'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}