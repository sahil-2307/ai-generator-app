import { NextRequest, NextResponse } from 'next/server'
import { supabase, createUserProfile } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        await createUserProfile(data.user)
      }
    }
  }

  // Redirect back to the main page
  return NextResponse.redirect(`${origin}/`)
}