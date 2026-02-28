import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseAnonClient, createSupabaseClient } from '../db/supabase'

const authRoutes = new Hono<{
  Bindings: {
    SUPABASE_URL?: string
    SUPABASE_ANON_KEY?: string
    SUPABASE_SERVICE_KEY?: string
  }
}>()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  full_name: z.string().optional(),
  mailingListOptIn: z.boolean().optional().default(true)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const hasAuthEnv = (env: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }) =>
  Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)

const getAuthClient = (env: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }) => {
  if (!hasAuthEnv(env)) {
    throw new Error('Auth service is temporarily unavailable.')
  }

  return createSupabaseAnonClient({
    SUPABASE_URL: env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY!
  })
}

const getServiceClient = (env: {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_KEY?: string
}) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return null
  }

  return createSupabaseClient({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY
  })
}

// Register endpoint
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = registerSchema.parse(body)

    const authClient = getAuthClient(c.env)
    const serviceClient = getServiceClient(c.env)

    // Register user with Supabase Auth
    const { data, error } = await authClient.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          username: validatedData.username,
          full_name: validatedData.full_name
        }
      }
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    // Create profile with mailing list preference
    if (data.user && serviceClient) {
      const { error: profileError } = await serviceClient
        .from('profiles')
        .insert({
          id: data.user.id,
          username: validatedData.username || null,
          full_name: validatedData.full_name,
          mailing_list_opt_in: validatedData.mailingListOptIn
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
      
      // Track mailing list consent if opted in
      if (validatedData.mailingListOptIn) {
        const consentText = 'User opted in to mailing list during registration. Agreed to receive occasional emails about new features, extensions, and community updates with promise of no spam or third-party data sales.'
        
        await serviceClient
          .from('mailing_list_consent')
          .insert({
            user_id: data.user.id,
            action: 'opt_in',
            consent_text: consentText,
            ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            user_agent: c.req.header('User-Agent')
          })
      }
    }

    return c.json({
      message: 'Registration successful!',
      user: data.user,
      token: data.session?.access_token,
      session: data.session
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ 
      error: 'Registration failed', 
      details: error.message || 'Unknown error'
    }, hasAuthEnv(c.env) ? 500 : 503)
  }
})

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = loginSchema.parse(body)

    const authClient = getAuthClient(c.env)

    const { data, error } = await authClient.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    })

    if (error) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    return c.json({
      user: data.user,
      token: data.session?.access_token,
      session: data.session
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ error: error.message || 'Login failed' }, hasAuthEnv(c.env) ? 500 : 503)
  }
})

// Get current user
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    const authClient = getAuthClient(c.env)
    const serviceClient = getServiceClient(c.env)
    const {
      data: { user },
      error
    } = await authClient.auth.getUser(token)

    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Get profile data
    const { data: profile } = serviceClient
      ? await serviceClient.from('profiles').select('*').eq('id', user.id).single()
      : { data: null }

    return c.json({
      user: {
        ...user,
        profile
      }
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Auth service is temporarily unavailable.' }, 503)
  }
})

// Logout endpoint
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const authClient = getAuthClient(c.env)
    await authClient.auth.getUser(token)

    return c.json({ message: 'Logout successful' })
  } catch (error: any) {
    return c.json({ error: error.message || 'Auth service is temporarily unavailable.' }, 503)
  }
})

// Request password reset
authRoutes.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json()
    const authClient = getAuthClient(c.env)

    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://cldcde.cc/settings?mode=reset-password'
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({ message: 'Password reset email sent' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reset email'
    return c.json({ error: message }, hasAuthEnv(c.env) ? 500 : 503)
  }
})

export default authRoutes
