// Ultra-simple configuration - just 2 services!
export const config = {
  // API Configuration
  api: {
    // Always use the deployed API for now since we're testing
    baseUrl: 'https://cldcde-api.aegntic.workers.dev/api'
  },
  
  // Supabase Configuration
  supabase: {
    url: 'https://giuyocjmgwzfbkammehu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdXlvY2ptZ3d6ZmJrYW1tZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExOTk3MjIsImV4cCI6MjA2Njc3NTcyMn0.7p1hDET8h3ABpoOle21o1nyUq89lCWacgSz2OKc-xjE'
  },
  
  // App Configuration
  app: {
    name: 'cldcde.cc',
    tagline: 'Public catalog. Private vault.',
    description: 'Agent skill marketplace for Claude Code, Cursor, Codex, and other coding agents. Free public catalog, Stripe-gated Pro vault.'
  }
}