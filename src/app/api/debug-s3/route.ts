import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      AWS_REGION: process.env.AWS_REGION ? '✅ Set' : '❌ Missing',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ? '✅ Set' : '❌ Missing',
    }

    // Show values (safely)
    const envValues = {
      AWS_REGION: process.env.AWS_REGION || 'Not set',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'Not set',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'Not set',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set (hidden)' : 'Not set'
    }

    // Test basic AWS SDK import
    let awsTest = 'Unknown'
    try {
      const { S3Client } = await import('@aws-sdk/client-s3')
      awsTest = '✅ AWS SDK imported successfully'
    } catch (error) {
      awsTest = `❌ AWS SDK import failed: ${error}`
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: 'production',
      status: 'Debug info',
      environmentVariables: envCheck,
      environmentValues: envValues,
      awsSDK: awsTest,
      suggestions: {
        missingVars: Object.entries(envCheck)
          .filter(([key, value]) => value.includes('Missing'))
          .map(([key]) => key),
        nextSteps: [
          'Check Vercel Dashboard → Project → Settings → Environment Variables',
          'Ensure all AWS variables are set for Production environment',
          'Check S3 bucket permissions and access point configuration',
          'Verify IAM user has S3 ListObjects permission'
        ]
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}