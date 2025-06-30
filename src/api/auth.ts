import { Hono } from 'hono'
import { jwt, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { runQuery, runTransaction } from '../db/neo4j'
import { invalidateOnLogin, invalidateOnProfileUpdate } from '../cache/invalidation'

const authRoutes = new Hono()

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Register endpoint
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUserResult = await runQuery(
      `MATCH (u:User) 
       WHERE u.email = $email OR u.username = $username 
       RETURN u.email as email, u.username as username`,
      { email: validatedData.email, username: validatedData.username }
    )

    if (existingUserResult.records.length > 0) {
      const existingUser = existingUserResult.records[0].toObject()
      return c.json({
        error: existingUser.email === validatedData.email 
          ? 'Email already registered' 
          : 'Username already taken'
      }, 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const result = await runTransaction(async (tx) => {
      return await tx.run(
        `CREATE (u:User {
          id: randomUUID(),
          username: $username,
          email: $email,
          password: $password,
          createdAt: datetime(),
          updatedAt: datetime(),
          isVerified: false,
          role: 'user',
          profile: {
            bio: '',
            website: '',
            github: '',
            twitter: ''
          }
        })
        RETURN u.id as id, u.username as username, u.email as email, u.createdAt as createdAt`,
        {
          username: validatedData.username,
          email: validatedData.email,
          password: hashedPassword
        }
      )
    })

    const user = result.records[0].toObject()

    // Generate JWT token
    const token = await sign({
      id: user.id,
      username: user.username,
      email: user.email,
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    }, JWT_SECRET)

    return c.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    }, 201)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }

    console.error('Registration error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = loginSchema.parse(body)

    // Find user
    const result = await runQuery(
      `MATCH (u:User) 
       WHERE u.email = $email 
       RETURN u.id as id, u.username as username, u.email as email, 
              u.password as password, u.role as role, u.createdAt as createdAt`,
      { email: validatedData.email }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const user = result.records[0].toObject()

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password)
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Update last login
    await runQuery(
      `MATCH (u:User) WHERE u.id = $id SET u.lastLogin = datetime()`,
      { id: user.id }
    )
    
    // Invalidate user-related caches
    await invalidateOnLogin(user.id, user.username)

    // Generate JWT token
    const token = await sign({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    }, JWT_SECRET)

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }

    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Middleware for protecting routes
authRoutes.use('/me/*', jwt({
  secret: JWT_SECRET,
}))

// Get current user
authRoutes.get('/me', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    
    const result = await runQuery(
      `MATCH (u:User) WHERE u.id = $id 
       RETURN u.id as id, u.username as username, u.email as email, 
              u.role as role, u.createdAt as createdAt, u.profile as profile,
              u.lastLogin as lastLogin`,
      { id: payload.id }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const user = result.records[0].toObject()
    return c.json({ user })

  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update user profile
authRoutes.put('/me/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const body = await c.req.json()

    const profileSchema = z.object({
      bio: z.string().max(500).optional(),
      website: z.string().url().optional().or(z.literal('')),
      github: z.string().max(100).optional(),
      twitter: z.string().max(100).optional()
    })

    const validatedData = profileSchema.parse(body)

    await runQuery(
      `MATCH (u:User) WHERE u.id = $id 
       SET u.profile = $profile, u.updatedAt = datetime()`,
      { 
        id: payload.id, 
        profile: validatedData 
      }
    )
    
    // Invalidate user profile cache
    const userResult = await runQuery(
      'MATCH (u:User) WHERE u.id = $id RETURN u.username as username',
      { id: payload.id }
    )
    if (userResult.records.length > 0) {
      const username = userResult.records[0].get('username')
      await invalidateOnProfileUpdate(username)
    }

    return c.json({ message: 'Profile updated successfully' })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }

    console.error('Profile update error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Refresh token
authRoutes.post('/refresh', jwt({ secret: JWT_SECRET }), async (c) => {
  try {
    const payload = c.get('jwtPayload')

    // Generate new token
    const newToken = await sign({
      id: payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    }, JWT_SECRET)

    return c.json({ token: newToken })

  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Logout (client-side token removal)
authRoutes.post('/logout', (c) => {
  return c.json({ message: 'Logout successful' })
})

export { authRoutes }
