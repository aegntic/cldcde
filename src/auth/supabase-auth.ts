import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

export interface AuthEnv {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_KEY: string
}

/**
 * Create Supabase client for auth operations
 */
export function createAuthClient(env: AuthEnv, useServiceKey = false) {
  const key = useServiceKey ? env.SUPABASE_SERVICE_KEY : env.SUPABASE_ANON_KEY
  
  return createClient<Database>(env.SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: !useServiceKey,
      persistSession: !useServiceKey
    }
  })
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyAuth(
  authHeader: string | null,
  env: AuthEnv
): Promise<{ user: any; error: any }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createAuthClient(env, true) // Use service key for verification

  const { data: { user }, error } = await supabase.auth.getUser(token)

  return { user, error }
}

/**
 * Auth middleware for Hono
 */
export function authMiddleware(env: AuthEnv) {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization')
    const { user, error } = await verifyAuth(authHeader, env)

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Add user to context
    c.set('user', user)
    await next()
  }
}

/**
 * Optional auth middleware - doesn't fail if no auth
 */
export function optionalAuthMiddleware(env: AuthEnv) {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization')
    
    if (authHeader) {
      const { user } = await verifyAuth(authHeader, env)
      if (user) {
        c.set('user', user)
      }
    }
    
    await next()
  }
}

/**
 * Auth service for user operations
 */
export class AuthService {
  private supabase: SupabaseClient<Database>

  constructor(private env: AuthEnv) {
    this.supabase = createAuthClient(env)
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, username: string) {
    // Create auth user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password
    })

    if (authError) {
      return { data: null, error: authError }
    }

    if (!authData.user) {
      return { data: null, error: { message: 'User creation failed' } }
    }

    // Create profile
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        email
      })
      .select()
      .single()

    if (profileError) {
      // Rollback auth user if profile creation fails
      await this.supabase.auth.admin.deleteUser(authData.user.id)
      return { data: null, error: profileError }
    }

    return {
      data: {
        user: authData.user,
        session: authData.session,
        profile
      },
      error: null
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { data: null, error }
    }

    // Get profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return {
      data: {
        ...data,
        profile
      },
      error: null
    }
  }

  /**
   * Logout user
   */
  async logout() {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  /**
   * Get current user
   */
  async getCurrentUser(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token)
    
    if (error || !user) {
      return { data: null, error }
    }

    // Get profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      data: {
        user,
        profile
      },
      error: null
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.env.SUPABASE_URL}/auth/callback?next=/reset-password`
    })

    return { error }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    })

    return { error }
  }

  /**
   * OAuth login
   */
  async loginWithOAuth(provider: 'github' | 'google') {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${this.env.SUPABASE_URL}/auth/callback`
      }
    })

    return { data, error }
  }
}