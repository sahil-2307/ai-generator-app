import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function GET(request: NextRequest) {
  try {
    console.log('Testing OpenAI API configuration...')
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length)
    console.log('API Key starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-'))
    console.log('First 20 chars:', process.env.OPENAI_API_KEY?.substring(0, 20))

    // Test 1: List models
    console.log('Testing model listing...')
    const models = await openai.models.list()
    console.log('Available models count:', models.data?.length)

    // Test 2: Simple text completion
    console.log('Testing text completion...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "API works!"' }],
      max_tokens: 10,
    })
    const text = completion.choices[0]?.message?.content
    console.log('Text response:', text)

    // Test 3: DALL-E image generation
    console.log('Testing DALL-E image generation...')
    const imageResponse = await openai.images.generate({
      model: 'dall-e-2',
      prompt: 'A simple test image of a red circle',
      n: 1,
      size: '256x256',
    })
    const imageUrl = imageResponse.data?.[0]?.url
    console.log('Image generated:', !!imageUrl)

    return NextResponse.json({
      success: true,
      tests: {
        apiKey: {
          exists: !!process.env.OPENAI_API_KEY,
          length: process.env.OPENAI_API_KEY?.length,
          validFormat: process.env.OPENAI_API_KEY?.startsWith('sk-'),
        },
        models: {
          success: true,
          count: models.data?.length,
        },
        textCompletion: {
          success: true,
          response: text,
        },
        imageGeneration: {
          success: true,
          imageUrl: imageUrl,
        },
      },
    })
  } catch (error: any) {
    console.error('OpenAI API Test Error:', error)
    console.error('Error message:', error?.message)
    console.error('Error response:', error?.response?.data)
    console.error('Error status:', error?.response?.status)
    console.error('Error code:', error?.code)

    let errorDetails = 'Unknown error'
    if (error?.response?.data?.error) {
      errorDetails = error.response.data.error.message || error.response.data.error
    } else if (error?.message) {
      errorDetails = error.message
    }

    return NextResponse.json({
      success: false,
      error: errorDetails,
      apiKey: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length,
        validFormat: process.env.OPENAI_API_KEY?.startsWith('sk-'),
      },
      fullError: {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
      },
    }, { status: 500 })
  }
}