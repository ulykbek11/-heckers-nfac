import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  // username is stored in user_metadata during signUp

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Called from a Server Component – safe to ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the freshly authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if profile already exists (e.g. OAuth users)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          // Determine a safe username: prefer from metadata (email signUp),
          // fall back to email prefix, then random suffix
          const metaUsername: string =
            (user.user_metadata?.username as string) || ''
          const rawUsername =
            metaUsername ||
            (user.email ? user.email.split('@')[0] : `player_${Date.now()}`)

          // Make sure the username is unique
          const { data: taken } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', rawUsername)
            .maybeSingle()

          const finalUsername = taken
            ? `${rawUsername}_${Math.floor(Math.random() * 9000) + 1000}`
            : rawUsername

          const avatarUrl: string = (user.user_metadata?.avatar_url as string) || ''

          await supabase.from('profiles').insert({
            id: user.id,
            username: finalUsername,
            elo: 1200,
            coins: 100,
            streak_current: 0,
            avatar_url: avatarUrl || null,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=AuthError`)
}
