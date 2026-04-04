import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Supabase client for server-side operations
export function createSupabaseClient(env: { 
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string 
}) {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
