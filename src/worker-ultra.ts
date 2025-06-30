import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import extensionRoutes from './api/extensions-simple'
import authRoutes from './api/auth-v2'
import searchRoutes from './api/search'
import mcpRoutes from './api/mcp-simple'
import featuredRoutes from './api/featured'
import memoryRoutes from './api/memory'
import usersRoutes from './api/users-v2'
import githubRoutes from './api/github-oauth'
import analyticsRoutes from './api/analytics'
import newsRoutes from './api/news-v2'
import socialRoutes from './api/social-share'

// Ultra-simple Cloudflare Worker with just 2 services!
export interface Env {
  // KV Namespace for caching (optional)
  CACHE?: KVNamespace
  
  // Just Supabase credentials - that's it!
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_KEY: string
  
  // GitHub OAuth (optional for downloads)
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GITHUB_REDIRECT_URI?: string
  
  // OpenRouter API key for AI services
  OPENROUTER_API_KEY?: string
}

const app = new Hono<{ Bindings: Env }>()

// Global middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow any Cloudflare Pages deployment, localhost, and the main domain
    const allowed = [
      'https://cldcde.cc',
      'http://localhost:3000',
      'http://localhost:5173'
    ]
    
    if (!origin || allowed.includes(origin)) return origin
    
    // Allow any *.pages.dev subdomain
    if (origin.endsWith('.pages.dev') || origin.endsWith('.cldcde.pages.dev')) {
      return origin
    }
    
    return null
  },
  credentials: true
}))
app.use('*', logger())

// Error handling with Supabase logging
app.onError((err, c) => {
  console.error('Worker error:', err)
  
  // Log to Supabase (you could create an errors table)
  // This replaces Sentry
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString()
  }
  
  // In production, you'd insert this into an errors table
  console.log('Error logged:', errorLog)
  
  return c.json({
    error: 'Internal server error',
    message: err.message
  }, 500)
})

// Health check - now just 2 services!
app.get('/health', async (c) => {
  const services = {
    worker: 'healthy',
    cache: 'checking',
    supabase: 'checking',
    env: {
      hasUrl: !!c.env.SUPABASE_URL,
      hasAnon: !!c.env.SUPABASE_ANON_KEY,
      hasService: !!c.env.SUPABASE_SERVICE_KEY
    }
  }

  // Check KV Cache (if available)
  if (c.env.CACHE) {
    try {
      await c.env.CACHE.get('health-check')
      services.cache = 'healthy'
    } catch {
      services.cache = 'unhealthy'
    }
  } else {
    services.cache = 'not-configured'
  }

  // Check Supabase
  try {
    const response = await fetch(`${c.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY
      }
    })
    services.supabase = response.ok ? 'healthy' : 'unhealthy'
  } catch {
    services.supabase = 'unhealthy'
  }

  const allHealthy = services.worker === 'healthy' && services.cache === 'healthy' && services.supabase === 'healthy'

  return c.json({ 
    status: allHealthy ? 'healthy' : 'degraded',
    services: {
      worker: services.worker,
      cache: services.cache,
      supabase: services.supabase
    },
    env: services.env,
    timestamp: new Date().toISOString(),
    message: 'Ultra-simple architecture: Just Supabase + Cloudflare!'
  })
})

// API info
app.get('/api', (c) => {
  return c.json({
    name: 'cldcde.cc API',
    version: '3.0.0',
    description: 'Ultra-simplified: Just Supabase + Cloudflare',
    services: {
      database: 'Supabase PostgreSQL',
      auth: 'Supabase Auth',
      realtime: 'Supabase Realtime',
      search: 'Supabase Full-text Search',
      storage: 'Supabase Storage',
      hosting: 'Cloudflare Workers',
      cache: 'Cloudflare KV',
      cdn: 'Cloudflare Network'
    },
    endpoints: {
      auth: '/api/auth',
      extensions: '/api/extensions',
      mcp: '/api/mcp',
      users: '/api/users',
      forums: '/api/forums',
      news: '/api/news',
      search: '/api/search'
    }
  })
})

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/extensions', extensionRoutes)
app.route('/api/mcp', mcpRoutes)
app.route('/api/search', searchRoutes)
app.route('/api/featured', featuredRoutes)
app.route('/api/memory', memoryRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/github', githubRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/news', newsRoutes)
app.route('/api/social', socialRoutes)

// Beautiful ASCII art for the home page
const asciiArt = `
╔═╗ ╦   ╔═╗ ╦ ╦ ╔╦╗ ╔═╗     ╔═╗ ╔═╗ 
║   ║   ╠═╣ ║ ║ ║║║ ╠═      ║   ║   
╚═╝ ╚═╝ ╩ ╩ ╚═╝ ╚╩╝ ╚═╝     ╚═╝ ╚═╝ 
`

// Serve static files (SPA fallback)
app.get('*', async (c) => {
  // In production, this would serve from Cloudflare Pages
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>cldcde.cc - Claude Code Extensions</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0a0a0a;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .terminal {
          border: 2px solid #00ff00;
          padding: 3rem;
          border-radius: 8px;
          max-width: 800px;
          width: 100%;
          background: rgba(0, 255, 0, 0.02);
          box-shadow: 0 0 40px rgba(0, 255, 0, 0.2);
        }
        pre {
          font-size: 0.8rem;
          line-height: 1.2;
          margin-bottom: 2rem;
          color: #00ff00;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        }
        h1 { 
          margin-bottom: 1rem;
          font-size: 2rem;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
        }
        p { 
          margin: 0.5rem 0;
          opacity: 0.9;
        }
        .links {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(0, 255, 0, 0.3);
        }
        a { 
          color: #00ff00;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.3s ease;
        }
        a:hover {
          border-bottom-color: #00ff00;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.8);
        }
        .status {
          margin-top: 2rem;
          font-size: 0.9rem;
          opacity: 0.7;
        }
        .ultra {
          color: #ff00ff;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
        }
      </style>
    </head>
    <body>
      <div class="terminal">
        <pre>${asciiArt}</pre>
        <h1>Claude Code Extensions Platform</h1>
        <p>The ultimate resource for Claude Code extensions, MCP tools, and community.</p>
        <p class="ultra">✨ Ultra-simplified architecture: Just 2 services!</p>
        
        <div class="links">
          <p>📡 API: <a href="/api">/api</a></p>
          <p>🏥 Health: <a href="/health">/health</a></p>
          <p>🔍 Search: <a href="/api/search/popular">/api/search/popular</a></p>
        </div>
        
        <div class="status">
          <p>Status: Operational</p>
          <p>Architecture: Supabase + Cloudflare</p>
          <p>Services: 2 (down from 10+)</p>
          <p>Complexity: Minimal</p>
          <p>Cost: ~$0-50/month</p>
        </div>
      </div>
    </body>
    </html>
  `)
})

export default app