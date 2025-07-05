import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './src/api/auth'
import { extensionRoutes } from './src/api/extensions'
import { userRoutes } from './src/api/users'
import { mcpRoutes } from './src/api/mcp'
import { featuredRoutes } from './src/api/featured'
import monitoring from './src/api/monitoring'
import cron from './src/agents/cron-handler'
import { innovationRoutes } from './src/api/innovation'
import { initDatabase } from './src/db/neo4j'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://cldcde.cc', 'https://www.cldcde.cc'],
  credentials: true,
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

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

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/extensions', extensionRoutes)
app.route('/api/users', userRoutes)
app.route('/api/mcp', mcpRoutes)
app.route('/api/featured', featuredRoutes)
app.route('/api/monitoring', monitoring)
app.route('/api/cron', cron)
app.route('/api/innovation', innovationRoutes)

// Serve React app for all other routes
app.get('*', serveStatic({ path: './dist/index.html' }))

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500)
})

// Initialize database and start server
const start = async () => {
  try {
    // Skip database initialization for now to test frontend
    console.log('📊 Skipping database connection for frontend testing')
    
    const port = process.env.PORT || 3000
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 CLDCDE.CC Platform Starting...                             ║
║                                                                ║
║  🌐 Server: http://localhost:${port}                              ║
║  📊 Database: Skipped (Frontend Test Mode)                    ║
║  ⚡ Runtime: Bun ${Bun.version}                                   ║
║  🎯 Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                                ║
║  Ready to test Retro Futuristic Hologram theme! 🤖            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `)
    
    Bun.serve({
      port,
      fetch: app.fetch,
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

start()

export default app
