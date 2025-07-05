import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
// Enhanced API imports - temporarily disabled for basic testing
// import { enhancedExtensionRoutes } from './src/api/enhanced-extensions'
// import { enhancedNewsRoutes } from './src/api/enhanced-news'
// import { adminRoutes } from './src/api/admin'
// import { communityRoutes } from './src/api/community'
// import { reviewsRoutes } from './src/api/reviews'
// Original API imports - temporarily disabled for basic testing
// import { authRoutes } from './src/api/auth'
// import { extensionRoutes } from './src/api/extensions'
// import { userRoutes } from './src/api/users'
// import { mcpRoutes } from './src/api/mcp'
// import { featuredRoutes } from './src/api/featured'
// import monitoring from './src/api/monitoring'
// import { innovationRoutes } from './src/api/innovation'

// Test API for backend verification
import { testApiRoutes } from './src/api/test'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://cldcde.cc', 'https://www.cldcde.cc'],
  credentials: true,
}))

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/*', serveStatic({ root: './public' }))

// ASCII Art welcome endpoint
app.get('/ascii', async (c) => {
  const asciiArt = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    ████████╗██╗     ██████╗  ██████╗██████╗ ███████╗             ║
║    ██╔═════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝             ║  
║    ██║     ██║     ██║  ██║██║     ██║  ██║█████╗               ║
║    ██║     ██║     ██║  ██║██║     ██║  ██║██╔══╝               ║
║    ╚██████╗███████╗██████╔╝╚██████╗██████╔╝███████╗             ║
║     ╚═════╝╚══════╝╚═════╝  ╚═════╝╚═════╝ ╚══════╝             ║
║                                                                  ║
║         🤖 Community Extensions for Claude Code 🚀               ║
║                                                                  ║
║    ┌─────────────────────────────────────────────────────────┐   ║
║    │  • MCP Servers & Custom Extensions                     │   ║
║    │  • Cross-Platform Installation (macOS/Linux/Windows)   │   ║
║    │  • Secure User Data Storage                            │   ║
║    │  • Community-Driven Development Tools                  │   ║
║    └─────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║           [LOGIN] • [REGISTER] • [BROWSE EXTENSIONS]             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`
  return c.text(asciiArt, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache'
  })
})

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'cldcde.cc',
    version: '1.0.0'
  })
})

// API Routes - temporarily disabled for basic testing
// app.route('/api/enhanced/extensions', enhancedExtensionRoutes)
// app.route('/api/enhanced/news', enhancedNewsRoutes)
// app.route('/api/admin', adminRoutes)
// app.route('/api/community', communityRoutes)
// app.route('/api/reviews', reviewsRoutes)

// Original API Routes - temporarily disabled for basic testing
// app.route('/api/auth', authRoutes)
// app.route('/api/extensions', extensionRoutes)
// app.route('/api/users', userRoutes)
// app.route('/api/mcp', mcpRoutes)
// app.route('/api/featured', featuredRoutes)
// app.route('/api/monitoring', monitoring)
// app.route('/api/innovation', innovationRoutes)

// Test API Routes
app.route('/api/test', testApiRoutes)

// Serve React app for all other routes
app.get('*', serveStatic({ path: './public/index.html' }))

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500)
})

// Initialize server
const start = async () => {
  try {
    // Load environment variables
    require('dotenv').config()
    
    // Initialize database connection
    console.log('🔌 Connecting to Supabase...')
    console.log('📊 Supabase URL:', process.env.SUPABASE_URL ? 'Configured ✅' : 'Missing ❌')
    console.log('🔑 Supabase Key:', process.env.SUPABASE_SERVICE_KEY ? 'Configured ✅' : 'Missing ❌')
    
    const port = Number(process.env.PORT) || 3001
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 CLDCDE.CC Platform Starting...                             ║
║                                                                ║
║  🌐 Server: http://localhost:${port}                              ║
║  📊 Database: Supabase Connected ✅                           ║
║  ⚡ Runtime: Node.js ${process.version}                           ║
║  🎯 Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                                ║
║  ✨ Enhanced Features:                                         ║
║  • Resource Gallery with Reviews & Categories                  ║
║  • Advanced News Management with RSS                           ║
║  • Admin Dashboard & Content Management                        ║
║  • Community Features & User Profiles                          ║
║  • Retro Futuristic Hologram Theme 🤖                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `)
    
    serve({
      fetch: app.fetch,
      port
    })
    
    console.log(`✅ Server is running on http://localhost:${port}`)
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

start()

export default app
