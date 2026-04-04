import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

interface GitHubEnv extends Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  GITHUB_REDIRECT_URI: string
}

const githubRoutes = new Hono<{ Bindings: GitHubEnv }>()

// Initiate GitHub OAuth flow
githubRoutes.get('/auth', async (c) => {
  const downloadTarget = c.req.query('download_target') || ''
  const resourceId = c.req.query('resource_id') || ''
  
  // Store the intended download in session
  const state = btoa(JSON.stringify({
    download_target: downloadTarget,
    resource_id: resourceId,
    timestamp: Date.now()
  }))
  
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
  githubAuthUrl.searchParams.append('client_id', c.env.GITHUB_CLIENT_ID)
  githubAuthUrl.searchParams.append('redirect_uri', c.env.GITHUB_REDIRECT_URI)
  githubAuthUrl.searchParams.append('scope', 'public_repo user:follow')
  githubAuthUrl.searchParams.append('state', state)
  
  return c.redirect(githubAuthUrl.toString())
})

// GitHub OAuth callback
githubRoutes.get('/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    
    if (!code || !state) {
      return c.json({ error: 'Missing code or state' }, 400)
    }
    
    // Decode state to get download target
    const stateData = JSON.parse(atob(state))
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: c.env.GITHUB_REDIRECT_URI
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }
    
    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    const githubUser = await userResponse.json()
    
    // Execute the GitHub actions chain
    const results = await executeGitHubChain(tokenData.access_token, stateData.download_target)
    
    // Log the download with consent
    const supabase = createSupabaseClient(c.env)
    await supabase.from('download_logs').insert({
      user_github: githubUser.login,
      resource_id: stateData.resource_id,
      download_target: stateData.download_target,
      github_actions: results,
      consent_given: true,
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    })
    
    // Redirect to download
    return c.redirect(stateData.download_target)
    
  } catch (error: any) {
    console.error('GitHub OAuth error:', error)
    return c.redirect('/download-error?message=' + encodeURIComponent(error.message))
  }
})

// Execute GitHub action chain
async function executeGitHubChain(accessToken: string, downloadTarget: string) {
  const results = {
    followed_aegntic: false,
    starred_repo: false,
    errors: [] as string[]
  }
  
  try {
    // 1. Follow github.com/aegntic
    const followResponse = await fetch('https://api.github.com/user/following/aegntic', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (followResponse.status === 204) {
      results.followed_aegntic = true
    } else {
      results.errors.push('Failed to follow aegntic')
    }
    
    // 2. Star the target repository
    const repoMatch = downloadTarget.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (repoMatch) {
      const [, owner, repo] = repoMatch
      
      const starResponse = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (starResponse.status === 204) {
        results.starred_repo = true
      } else {
        results.errors.push(`Failed to star ${owner}/${repo}`)
      }
    }
    
  } catch (error: any) {
    results.errors.push(error.message)
  }
  
  return results
}

// Check if user has already authorized
githubRoutes.get('/status', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ authorized: false })
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabase = createSupabaseClient(c.env)
  
  const { data: { user } } = await supabase.auth.getUser(token)
  
  if (!user) {
    return c.json({ authorized: false })
  }
  
  // Check if user has GitHub connected
  const { data: profile } = await supabase
    .from('profiles')
    .select('github_token')
    .eq('id', user.id)
    .single()
  
  return c.json({ 
    authorized: !!profile?.github_token,
    user_id: user.id
  })
})

export default githubRoutes