import { createBrowserClient } from "@supabase/ssr";

export function createClient (){
  return createBrowserClient(
    // Vite uses import.meta.env for client-side variables prefixed with VITE_
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  )
}