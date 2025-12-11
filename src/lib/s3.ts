import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'theaivault-generated-content'

export interface UploadResult {
  key: string
  url: string
  publicUrl: string
}

// Upload text content to S3
export async function uploadTextContent(
  userId: string,
  content: string,
  metadata: any = {}
): Promise<UploadResult> {
  const timestamp = Date.now()
  const key = `text/${userId}/${timestamp}.txt`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: 'text/plain',
    Metadata: {
      userId,
      type: 'text',
      createdAt: new Date().toISOString(),
      ...metadata,
    },
  })

  await s3Client.send(command)

  const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 }) // 1 hour

  return {
    key,
    url: signedUrl,
    publicUrl,
  }
}

// Upload image to S3
export async function uploadImageContent(
  userId: string,
  imageBuffer: Buffer,
  metadata: any = {}
): Promise<UploadResult> {
  const timestamp = Date.now()
  const key = `images/${userId}/${timestamp}.png`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: 'image/png',
    Metadata: {
      userId,
      type: 'image',
      createdAt: new Date().toISOString(),
      ...metadata,
    },
  })

  await s3Client.send(command)

  const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 }) // 1 hour

  return {
    key,
    url: signedUrl,
    publicUrl,
  }
}

// Upload video to S3
export async function uploadVideoContent(
  userId: string,
  videoBuffer: Buffer,
  metadata: any = {}
): Promise<UploadResult> {
  const timestamp = Date.now()
  const key = `videos/${userId}/${timestamp}.mp4`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: videoBuffer,
    ContentType: 'video/mp4',
    Metadata: {
      userId,
      type: 'video',
      createdAt: new Date().toISOString(),
      ...metadata,
    },
  })

  await s3Client.send(command)

  const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 }) // 1 hour

  return {
    key,
    url: signedUrl,
    publicUrl,
  }
}

// Upload any file URL to S3 (for external URLs like OpenAI generated images)
export async function uploadFromUrl(
  userId: string,
  fileUrl: string,
  fileType: 'text' | 'image' | 'video',
  metadata: any = {}
): Promise<UploadResult> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const timestamp = Date.now()

    let key: string
    let contentType: string

    switch (fileType) {
      case 'image':
        key = `images/${userId}/${timestamp}.png`
        contentType = 'image/png'
        break
      case 'video':
        key = `videos/${userId}/${timestamp}.mp4`
        contentType = 'video/mp4'
        break
      default:
        key = `text/${userId}/${timestamp}.txt`
        contentType = 'text/plain'
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        userId,
        type: fileType,
        originalUrl: fileUrl,
        createdAt: new Date().toISOString(),
        ...metadata,
      },
    })

    await s3Client.send(command)

    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }), { expiresIn: 3600 })

    return {
      key,
      url: signedUrl,
      publicUrl,
    }
  } catch (error) {
    console.error('Error uploading from URL:', error)
    throw error
  }
}

// Delete file from S3
export async function deleteContent(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

// Get signed URL for existing file
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Check if S3 is configured
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  )
}