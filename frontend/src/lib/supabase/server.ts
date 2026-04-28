import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'

export function createClient(request: Request) {
  const supabaseUrl = process.env.BUN_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase env vars: BUN_PUBLIC_SUPABASE_URL and BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required')
  }

  const headers = new Headers()

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '') as {
            name: string
            value: string
          }[]
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
          )
        },
      },
    }
  )

  return { supabase, headers }
}
