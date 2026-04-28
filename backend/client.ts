import { createClient  } from '@supabase/supabase-js'

export function createSupabaseClient() {
  return createClient(
    "https://ilekzlddytmxmvejeysw.supabase.co",
    process.env.SUPABASE_API_SECRET!,
  )
}
