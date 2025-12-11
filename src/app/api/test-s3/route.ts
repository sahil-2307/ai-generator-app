import { NextRequest, NextResponse } from 'next/server'
import { isS3Configured } from '@/lib/s3'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing S3 configuration...')
    console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID)
    console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY)
    console.log('AWS_S3_BUCKET exists:', !!process.env.AWS_S3_BUCKET)
    console.log('AWS_REGION exists:', !!process.env.AWS_REGION)
    console.log('isS3Configured():', isS3Configured())

    if (!isS3Configured()) {
      return NextResponse.json({
        success: false,
        error: 'S3 not configured - missing required environment variables',
        configuration: {
          AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
          AWS_S3_BUCKET: !!process.env.AWS_S3_BUCKET,
          AWS_REGION: !!process.env.AWS_REGION,
        }
      })
    }

    // Test S3 connection
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    console.log('Testing S3 connection...')
    const listCommand = new ListBucketsCommand({})
    const buckets = await s3Client.send(listCommand)

    const targetBucket = process.env.AWS_S3_BUCKET
    const bucketExists = buckets.Buckets?.some(bucket => bucket.Name === targetBucket)

    return NextResponse.json({
      success: true,
      configuration: {
        AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
        AWS_REGION: process.env.AWS_REGION,
      },
      connection: {
        success: true,
        totalBuckets: buckets.Buckets?.length || 0,
        targetBucket,
        bucketExists,
        availableBuckets: buckets.Buckets?.map(b => b.Name) || []
      }
    })
  } catch (error: any) {
    console.error('S3 Test Error:', error)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)

    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      configuration: {
        AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
        AWS_REGION: process.env.AWS_REGION,
      },
      fullError: {
        message: error?.message,
        code: error?.code,
        name: error?.name
      }
    }, { status: 500 })
  }
}