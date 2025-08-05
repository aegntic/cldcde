#!/usr/bin/env bun

import { D1Database } from '@cloudflare/workers-types'
import { createD1Client } from '../src/db/d1'

// This script is meant to be run with wrangler
// Usage: wrangler d1 execute cldcde-content --local --file=./scripts/seed-d1.ts

interface SeedData {
  forums: Array<{
    title: string
    slug: string
    description: string
    category: string
  }>
  posts: Array<{
    forum_slug: string
    user_id: string
    title: string
    content: string
    is_pinned?: boolean
  }>
  comments: Array<{
    post_index: number
    user_id: string
    content: string
  }>
  news: Array<{
    title: string
    slug: string
    content: string
    excerpt: string
    author_id: string
    tags: string[]
    featured_image?: string
  }>
  reviews: Array<{
    extension_id: string
    user_id: string
    rating: number
    content: string
  }>
}

const seedData: SeedData = {
  forums: [
    {
      title: 'General Discussion',
      slug: 'general',
      description: 'General discussion about Claude extensions and development',
      category: 'general'
    },
    {
      title: 'Extension Development',
      slug: 'extension-dev',
      description: 'Technical discussions about building Claude extensions',
      category: 'development'
    },
    {
      title: 'MCP Servers',
      slug: 'mcp-servers',
      description: 'Discuss Model Context Protocol servers and integrations',
      category: 'technical'
    },
    {
      title: 'Feature Requests',
      slug: 'feature-requests',
      description: 'Request new features for extensions or the platform',
      category: 'feedback'
    },
    {
      title: 'Bug Reports',
      slug: 'bug-reports',
      description: 'Report bugs and issues with extensions',
      category: 'support'
    }
  ],
  posts: [
    {
      forum_slug: 'general',
      user_id: 'user-1',
      title: 'Welcome to Claude Extensions Community!',
      content: 'Welcome everyone! This is the official community forum for Claude extensions. Feel free to share your experiences, ask questions, and help others.',
      is_pinned: true
    },
    {
      forum_slug: 'extension-dev',
      user_id: 'user-2',
      title: 'Best practices for Claude CLI extensions',
      content: 'I\'ve been developing extensions for a few months now and wanted to share some best practices:\n\n1. Always validate input parameters\n2. Use proper error handling\n3. Follow the official style guide\n4. Test thoroughly before publishing\n\nWhat are your best practices?'
    },
    {
      forum_slug: 'mcp-servers',
      user_id: 'user-3',
      title: 'New filesystem MCP server with safety features',
      content: 'Just released an enhanced filesystem MCP server with built-in safety checks. It prevents accidental deletion of system files and has batch processing capabilities. Check it out!'
    },
    {
      forum_slug: 'feature-requests',
      user_id: 'user-4',
      title: 'Request: Extension marketplace ratings',
      content: 'It would be great to have a rating system for extensions so users can quickly identify high-quality extensions. Maybe with verified reviews?'
    },
    {
      forum_slug: 'bug-reports',
      user_id: 'user-5',
      title: 'Issue with cldism extension on Windows',
      content: 'The cldism extension seems to have issues on Windows 11. The parallel processing feature doesn\'t work correctly. Anyone else experiencing this?'
    }
  ],
  comments: [
    {
      post_index: 0,
      user_id: 'user-2',
      content: 'Excited to be part of this community! Looking forward to sharing and learning.'
    },
    {
      post_index: 1,
      user_id: 'user-1',
      content: 'Great tips! I would add: always include comprehensive documentation with examples.'
    },
    {
      post_index: 1,
      user_id: 'user-3',
      content: 'Don\'t forget about proper versioning and changelog maintenance!'
    },
    {
      post_index: 2,
      user_id: 'user-4',
      content: 'This looks amazing! The safety features are exactly what I needed.'
    },
    {
      post_index: 3,
      user_id: 'user-5',
      content: '+1 for this feature. Reviews would help a lot in choosing extensions.'
    }
  ],
  news: [
    {
      title: 'Claude Extensions Platform Launches',
      slug: 'claude-extensions-platform-launches',
      content: 'We\'re excited to announce the official launch of Claude Extensions Platform! This platform serves as a central hub for discovering, sharing, and collaborating on Claude CLI extensions and MCP servers.\n\n## Key Features\n\n- Comprehensive extension catalog\n- Community forums for discussion\n- Detailed documentation and guides\n- User reviews and ratings\n- Secure installation scripts\n\n## What\'s Next\n\nWe have ambitious plans for the platform, including:\n- Extension analytics dashboard\n- Automated testing framework\n- Visual extension builder\n- Integration marketplace\n\nJoin us in building the future of AI-assisted development!',
      excerpt: 'The official Claude Extensions Platform is now live, providing a central hub for extensions and MCP servers.',
      author_id: 'admin',
      tags: ['announcement', 'platform', 'launch'],
      featured_image: '/images/launch-banner.jpg'
    },
    {
      title: 'Introducing MCP Server Development Kit',
      slug: 'mcp-server-development-kit',
      content: 'Today we\'re releasing the MCP Server Development Kit (SDK) to make it easier than ever to build custom Model Context Protocol servers.\n\n## Features\n\n- TypeScript-first design\n- Built-in testing utilities\n- Comprehensive documentation\n- Example implementations\n- Hot reload during development\n\n## Getting Started\n\n```bash\nbun add @cldcde/mcp-sdk\n```\n\nCheck out our documentation for detailed guides and tutorials.',
      excerpt: 'New SDK makes building MCP servers easier with TypeScript support and testing utilities.',
      author_id: 'admin',
      tags: ['mcp', 'development', 'sdk', 'release']
    },
    {
      title: 'Community Spotlight: Top Extensions of the Month',
      slug: 'top-extensions-january-2024',
      content: 'Let\'s celebrate the amazing work from our community! Here are the top extensions for this month:\n\n## 1. Claude CLI Shortcuts\nDeveloped by @iamcatface, this extension has revolutionized how developers interact with Claude CLI.\n\n## 2. Cldism Development System\nAn innovative approach to parallel development that\'s changing how we think about AI-assisted coding. Use cldism, cldism-list, and cldism-show commands.\n\n## 3. AI Video Recording Tools\nPerfect for content creators documenting their development process.\n\nCongratulations to all developers!',
      excerpt: 'Highlighting the most popular and innovative extensions from our community.',
      author_id: 'admin',
      tags: ['community', 'spotlight', 'extensions']
    }
  ],
  reviews: [
    {
      extension_id: 'claude-shortcuts',
      user_id: 'user-2',
      rating: 5,
      content: 'Absolutely essential extension! The shortcuts save me hours every day. The auto-execute feature is a game-changer.'
    },
    {
      extension_id: 'claude-shortcuts',
      user_id: 'user-3',
      rating: 4,
      content: 'Great extension overall. Would love to see more customization options for the shortcuts.'
    },
    {
      extension_id: 'cldism',
      user_id: 'user-1',
      rating: 5,
      content: 'Mind-blowing approach to development. The parallel processing really helps explore different solutions quickly.'
    },
    {
      extension_id: 'ai-video-recording',
      user_id: 'user-4',
      rating: 4,
      content: 'Perfect for creating tutorials. The automatic editing features work well most of the time.'
    },
    {
      extension_id: 'claude-mcp-filesystem',
      user_id: 'user-5',
      rating: 5,
      content: 'The safety features give me confidence when giving Claude file system access. Batch operations are super fast!'
    }
  ]
}

async function seedDatabase(db: D1Database) {
  const client = createD1Client(db)
  
  console.log('🌱 Starting database seed...')

  try {
    // Seed forums
    console.log('📁 Seeding forums...')
    const forumIds: Record<string, number> = {}
    
    for (const forum of seedData.forums) {
      const result = await client.insert(
        'forums',
        forum,
        ['id', 'slug']
      )
      
      if (result) {
        forumIds[result.slug] = result.id
        
        // Initialize forum stats
        await client.insert('forum_stats', {
          forum_id: result.id,
          post_count: 0,
          comment_count: 0,
          last_post_at: null
        })
      }
    }

    // Seed posts
    console.log('📝 Seeding posts...')
    const postIds: number[] = []
    
    for (const post of seedData.posts) {
      const forumId = forumIds[post.forum_slug]
      if (!forumId) continue

      const { forum_slug, ...postData } = post
      const result = await client.insert(
        'posts',
        {
          ...postData,
          forum_id: forumId,
          views: Math.floor(Math.random() * 100),
          is_pinned: postData.is_pinned || false,
          is_locked: false
        },
        ['id']
      )
      
      if (result) {
        postIds.push(result.id)
        
        // Update forum stats
        await client.raw(`
          UPDATE forum_stats 
          SET 
            post_count = post_count + 1,
            last_post_at = CURRENT_TIMESTAMP
          WHERE forum_id = ?
        `, [forumId])
      }
    }

    // Seed comments
    console.log('💬 Seeding comments...')
    for (const comment of seedData.comments) {
      const postId = postIds[comment.post_index]
      if (!postId) continue

      const { post_index, ...commentData } = comment
      await client.insert('comments', {
        ...commentData,
        post_id: postId,
        is_edited: false
      })
      
      // Get forum_id for stats update
      const post = await client.query()
        .select(['forum_id'])
        .from('posts')
        .where('id = ?', postId)
        .first<{ forum_id: number }>()
      
      if (post) {
        await client.raw(`
          UPDATE forum_stats 
          SET comment_count = comment_count + 1
          WHERE forum_id = ?
        `, [post.forum_id])
      }
    }

    // Seed news
    console.log('📰 Seeding news articles...')
    for (const article of seedData.news) {
      await client.insert('news', {
        ...article,
        tags: JSON.stringify(article.tags),
        views: Math.floor(Math.random() * 500),
        is_published: true,
        published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    // Seed reviews
    console.log('⭐ Seeding reviews...')
    for (const review of seedData.reviews) {
      const result = await client.insert(
        'reviews',
        {
          ...review,
          is_verified_purchase: true,
          helpful_count: Math.floor(Math.random() * 20)
        },
        ['id', 'extension_id', 'rating']
      )
      
      if (result) {
        // Update extension stats
        const existing = await client.query()
          .select()
          .from('extension_stats')
          .where('extension_id = ?', result.extension_id)
          .first<{ review_count: number; total_rating: number }>()
        
        if (existing) {
          const newCount = existing.review_count + 1
          const newTotal = existing.total_rating + result.rating
          await client.update(
            'extension_stats',
            {
              review_count: newCount,
              total_rating: newTotal,
              average_rating: newTotal / newCount
            },
            { extension_id: result.extension_id }
          )
        } else {
          await client.insert('extension_stats', {
            extension_id: result.extension_id,
            review_count: 1,
            total_rating: result.rating,
            average_rating: result.rating
          })
        }
      }
    }

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Export for use with wrangler
export default {
  async fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
    try {
      await seedDatabase(env.DB)
      return new Response('Database seeded successfully!', { status: 200 })
    } catch (error) {
      return new Response(`Error seeding database: ${error}`, { status: 500 })
    }
  }
}