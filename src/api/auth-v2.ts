import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'

const authRoutes = new Hono<{ Bindings: { SUPABASE_URL: string, SUPABASE_ANON_KEY: string } }>()

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

// Register endpoint
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = registerSchema.parse(body)
    
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_ANON_KEY
    })

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
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
    if (data.user) {
      const { error: profileError } = await supabase
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
        
        await supabase
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
    }, 500)
  }
})

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = loginSchema.parse(body)
    
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_ANON_KEY
    })

    const { data, error } = await supabase.auth.signInWithPassword({
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
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Get current user
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No authorization token' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createSupabaseClient({
    SUPABASE_URL: c.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: c.env.SUPABASE_ANON_KEY
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return c.json({
    user: {
      ...user,
      profile
    }
  })
})

// Logout endpoint
authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No authorization token' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createSupabaseClient({
    SUPABASE_URL: c.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: c.env.SUPABASE_ANON_KEY
  })

  await supabase.auth.signOut()

  return c.json({ message: 'Logout successful' })
})

// Request password reset
authRoutes.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json()
    
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_ANON_KEY
    })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${c.env.SUPABASE_URL}/auth/reset-password`
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({ message: 'Password reset email sent' })
  } catch (error) {
    return c.json({ error: 'Failed to send reset email' }, 500)
  }
})

export default authRoutes