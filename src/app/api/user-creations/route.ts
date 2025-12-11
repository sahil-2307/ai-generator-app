import { NextRequest, NextResponse } from 'next/server'
import { getUserCreations } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') as 'video' | 'image' | 'text' | null

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: creations, error } = await getUserCreations(userId, type || undefined)

    if (error) {
      console.error('Error fetching user creations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch creations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: creations || []
    })

  } catch (error) {
    console.error('User creations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}