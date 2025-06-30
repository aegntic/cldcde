import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

interface SocialEnv extends Env {
  X_API_KEY?: string
  X_API_SECRET?: string
  X_BEARER_TOKEN?: string
  LINKEDIN_CLIENT_ID?: string
  LINKEDIN_CLIENT_SECRET?: string
}

const socialRoutes = new Hono<{ Bindings: SocialEnv }>()

// Share tracking schema
const shareSchema = z.object({
  news_id: z.string().uuid(),
  platform: z.enum(['x', 'linkedin', 'copy', 'email']),
  consent_given: z.boolean().default(true)
})

// Track share and generate share URL
socialRoutes.post('/share', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = shareSchema.parse(body)
    
    const supabase = createSupabaseClient(c.env)
    
    // Get user if authenticated
    let userId = null
    const authHeader = c.req.header('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }
    
    // Get the news item
    const { data: news } = await supabase
      .from('news_updates')
      .select('title, slug, summary')
      .eq('id', validatedData.news_id)
      .single()
    
    if (!news) {
      return c.json({ error: 'News not found' }, 404)
    }
    
    // Generate share URL based on platform
    const shareUrl = generateShareUrl(validatedData.platform, news, c.env.SUPABASE_URL)
    
    // Log the share
    const { data: shareLog, error } = await supabase
      .from('share_logs')
      .insert({
        news_id: validatedData.news_id,
        user_id: userId,
        platform: validatedData.platform,
        share_url: shareUrl,
        consent_given: validatedData.consent_given,
        auto_follow_target: getAutoFollowTarget(validatedData.platform),
        ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        user_agent: c.req.header('User-Agent')
      })
      .select()
      .single()
    
    if (error) {
      console.error('Share log error:', error)
    }
    
    // Increment share count
    await supabase.rpc('increment_news_shares', { p_news_id: validatedData.news_id })
    
    // Return share data
    return c.json({
      share_url: shareUrl,
      share_id: shareLog?.id,
      platform: validatedData.platform,
      auto_follow: getAutoFollowTarget(validatedData.platform)
    })
    
  } catch (error: any) {
    console.error('Share error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ error: 'Failed to create share' }, 500)
  }
})

// X (Twitter) OAuth flow
socialRoutes.get('/x/auth', async (c) => {
  const shareId = c.req.query('share_id')
  const newsId = c.req.query('news_id')
  
  if (!shareId || !newsId) {
    return c.json({ error: 'Missing parameters' }, 400)
  }
  
  // Store state for callback
  const state = btoa(JSON.stringify({
    share_id: shareId,
    news_id: newsId,
    timestamp: Date.now()
  }))
  
  // X OAuth 2.0 URL
  const xAuthUrl = new URL('https://twitter.com/i/oauth2/authorize')
  xAuthUrl.searchParams.append('response_type', 'code')
  xAuthUrl.searchParams.append('client_id', c.env.X_API_KEY || '')
  xAuthUrl.searchParams.append('redirect_uri', `${c.env.SUPABASE_URL}/api/social/x/callback`)
  xAuthUrl.searchParams.append('scope', 'tweet.read tweet.write users.read follows.write')
  xAuthUrl.searchParams.append('state', state)
  xAuthUrl.searchParams.append('code_challenge', 'challenge')
  xAuthUrl.searchParams.append('code_challenge_method', 'plain')
  
  return c.redirect(xAuthUrl.toString())
})

// X OAuth callback
socialRoutes.get('/x/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    
    if (!code || !state) {
      return c.json({ error: 'Missing code or state' }, 400)
    }
    
    const stateData = JSON.parse(atob(state))
    const supabase = createSupabaseClient(c.env)
    
    // Exchange code for token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${c.env.X_API_KEY}:${c.env.X_API_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${c.env.SUPABASE_URL}/api/social/x/callback`,
        code_verifier: 'challenge'
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }
    
    // Auto-follow @aegnt_catface
    await autoFollowX(tokenData.access_token, 'aegnt_catface')
    
    // Post the share
    const { data: shareLog } = await supabase
      .from('share_logs')
      .select('share_url')
      .eq('id', stateData.share_id)
      .single()
    
    if (shareLog) {
      await postToX(tokenData.access_token, shareLog.share_url)
    }
    
    // Update share log
    await supabase
      .from('share_logs')
      .update({
        auto_follow_executed: true,
        auto_follow_result: { success: true, platform: 'x' }
      })
      .eq('id', stateData.share_id)
    
    // Redirect to news page
    const { data: news } = await supabase
      .from('news_updates')
      .select('slug')
      .eq('id', stateData.news_id)
      .single()
    
    return c.redirect(`/news/${news?.slug}?shared=x`)
    
  } catch (error: any) {
    console.error('X callback error:', error)
    return c.redirect('/share-error?platform=x')
  }
})

// LinkedIn OAuth flow
socialRoutes.get('/linkedin/auth', async (c) => {
  const shareId = c.req.query('share_id')
  const newsId = c.req.query('news_id')
  
  if (!shareId || !newsId) {
    return c.json({ error: 'Missing parameters' }, 400)
  }
  
  const state = btoa(JSON.stringify({
    share_id: shareId,
    news_id: newsId,
    timestamp: Date.now()
  }))
  
  const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  linkedinAuthUrl.searchParams.append('response_type', 'code')
  linkedinAuthUrl.searchParams.append('client_id', c.env.LINKEDIN_CLIENT_ID || '')
  linkedinAuthUrl.searchParams.append('redirect_uri', `${c.env.SUPABASE_URL}/api/social/linkedin/callback`)
  linkedinAuthUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social')
  linkedinAuthUrl.searchParams.append('state', state)
  
  return c.redirect(linkedinAuthUrl.toString())
})

// LinkedIn OAuth callback
socialRoutes.get('/linkedin/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    
    if (!code || !state) {
      return c.json({ error: 'Missing code or state' }, 400)
    }
    
    const stateData = JSON.parse(atob(state))
    const supabase = createSupabaseClient(c.env)
    
    // Exchange code for token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${c.env.SUPABASE_URL}/api/social/linkedin/callback`,
        client_id: c.env.LINKEDIN_CLIENT_ID || '',
        client_secret: c.env.LINKEDIN_CLIENT_SECRET || ''
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }
    
    // Auto-connect with Mattae Cooper
    await autoConnectLinkedIn(tokenData.access_token, 'mattae-cooper')
    
    // Post the share
    const { data: shareLog } = await supabase
      .from('share_logs')
      .select('share_url')
      .eq('id', stateData.share_id)
      .single()
    
    if (shareLog) {
      await postToLinkedIn(tokenData.access_token, shareLog.share_url)
    }
    
    // Update share log
    await supabase
      .from('share_logs')
      .update({
        auto_follow_executed: true,
        auto_follow_result: { success: true, platform: 'linkedin' }
      })
      .eq('id', stateData.share_id)
    
    // Redirect to news page
    const { data: news } = await supabase
      .from('news_updates')
      .select('slug')
      .eq('id', stateData.news_id)
      .single()
    
    return c.redirect(`/news/${news?.slug}?shared=linkedin`)
    
  } catch (error: any) {
    console.error('LinkedIn callback error:', error)
    return c.redirect('/share-error?platform=linkedin')
  }
})

// Helper functions
function generateShareUrl(platform: string, news: any, baseUrl: string): string {
  const newsUrl = `${baseUrl}/news/${news.slug}`
  const text = `${news.title} - ${news.summary}`
  
  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(newsUrl)}&via=cldcde_cc`
    
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(newsUrl)}`
    
    case 'email':
      return `mailto:?subject=${encodeURIComponent(news.title)}&body=${encodeURIComponent(`${text}\n\n${newsUrl}`)}`
    
    case 'copy':
    default:
      return newsUrl
  }
}

function getAutoFollowTarget(platform: string): string | null {
  switch (platform) {
    case 'x':
      return '@aegnt_catface'
    case 'linkedin':
      return 'Mattae Cooper'
    default:
      return null
  }
}

async function autoFollowX(accessToken: string, username: string) {
  try {
    // Get user ID
    const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    const userData = await userResponse.json()
    
    if (userData.data?.id) {
      // Follow user
      await fetch(`https://api.twitter.com/2/users/${userData.data.id}/following`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: userData.data.id
        })
      })
    }
  } catch (error) {
    console.error('X auto-follow error:', error)
  }
}

async function autoConnectLinkedIn(accessToken: string, profileId: string) {
  try {
    // LinkedIn connection API would go here
    // Note: LinkedIn has restrictions on automated connections
    console.log('LinkedIn auto-connect:', profileId)
  } catch (error) {
    console.error('LinkedIn auto-connect error:', error)
  }
}

async function postToX(accessToken: string, text: string) {
  try {
    await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })
  } catch (error) {
    console.error('X post error:', error)
  }
}

async function postToLinkedIn(accessToken: string, url: string) {
  try {
    // Get user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    const profile = await profileResponse.json()
    
    // Post share
    await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: `urn:li:person:${profile.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: 'Check out this update from cldcde.cc!'
            },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              originalUrl: url
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    })
  } catch (error) {
    console.error('LinkedIn post error:', error)
  }
}

export default socialRoutes