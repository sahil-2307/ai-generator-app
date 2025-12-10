import { NextRequest, NextResponse } from 'next/server'

// Simple usage tracking (matches the one in generate-video)
let dailyUsage = {
  date: new Date().toDateString(),
  count: 0,
  maxDaily: 10
}

export async function GET(request: NextRequest) {
  try {
    // Reset usage if it's a new day
    const today = new Date().toDateString()
    if (dailyUsage.date !== today) {
      dailyUsage = { date: today, count: 0, maxDaily: 10 }
    }

    return NextResponse.json({
      remainingFreeVideos: Math.max(0, dailyUsage.maxDaily - dailyUsage.count),
      usedVideos: dailyUsage.count,
      maxDaily: dailyUsage.maxDaily,
      date: dailyUsage.date,
      isLimitReached: dailyUsage.count >= dailyUsage.maxDaily
    })
  } catch (error) {
    console.error('Usage info error:', error)
    return NextResponse.json(
      { error: 'Failed to get usage information' },
      { status: 500 }
    )
  }
}