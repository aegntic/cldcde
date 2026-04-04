import { Hono } from 'hono'
import { z } from 'zod'
import { innovationTracker } from '../agents/github-innovation-tracker.js'
import { runQuery } from '../db/neo4j.js'

const app = new Hono()

// Get top innovative projects
app.get('/top', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20')
    const projects = await innovationTracker.getTopInnovativeProjects(limit)
    
    return c.json({
      success: true,
      projects,
      count: projects.length
    })
  } catch (error) {
    console.error('Error fetching top innovative projects:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch innovative projects' 
    }, 500)
  }
})

// Trigger innovation scan (admin only)
app.post('/scan', async (c) => {
  try {
    // In production, this should be protected by admin authentication
    // For now, we'll check for a simple API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, 401)
    }

    // Run scan asynchronously
    innovationTracker.runInnovationScan().catch(console.error)
    
    return c.json({
      success: true,
      message: 'Innovation scan started'
    })
  } catch (error) {
    console.error('Error starting innovation scan:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to start innovation scan' 
    }, 500)
  }
})

// Get innovation metrics for a specific project
app.get('/project/:githubId', async (c) => {
  try {
    const githubId = parseInt(c.req.param('githubId'))
    
    const query = `
      MATCH (p:Project {githubId: $githubId})
      RETURN p
    `
    
    const result = await runQuery(query, { githubId })
    
    if (result.records.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Project not found' 
      }, 404)
    }
    
    const project = result.records[0].get('p').properties
    
    return c.json({
      success: true,
      project: {
        ...project,
        metrics: JSON.parse(project.metrics || '{}')
      }
    })
  } catch (error) {
    console.error('Error fetching project metrics:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch project metrics' 
    }, 500)
  }
})

// Search innovative projects
app.get('/search', async (c) => {
  try {
    const searchQuery = c.req.query('q') || ''
    const minScore = parseInt(c.req.query('minScore') || '30')
    const limit = parseInt(c.req.query('limit') || '20')
    
    const query = `
      MATCH (p:Project)
      WHERE p.innovationScore >= $minScore
      AND (
        toLower(p.name) CONTAINS toLower($search)
        OR toLower(p.description) CONTAINS toLower($search)
        OR toLower(p.owner) CONTAINS toLower($search)
        OR ANY(topic IN p.topics WHERE toLower(topic) CONTAINS toLower($search))
      )
      RETURN p
      ORDER BY p.innovationScore DESC, p.stars DESC
      LIMIT $limit
    `
    
    const result = await runQuery(query, { 
      minScore, 
      search: searchQuery,
      limit 
    })
    
    const projects = result.records.map(record => {
      const props = record.get('p').properties
      return {
        ...props,
        metrics: JSON.parse(props.metrics || '{}')
      }
    })
    
    return c.json({
      success: true,
      projects,
      count: projects.length,
      query: searchQuery
    })
  } catch (error) {
    console.error('Error searching innovative projects:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to search projects' 
    }, 500)
  }
})

// Get trending innovative projects
app.get('/trending', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7')
    const limit = parseInt(c.req.query('limit') || '10')
    
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)
    
    const query = `
      MATCH (p:Project)
      WHERE p.lastUpdated > $since
      AND p.innovationScore > 40
      RETURN p
      ORDER BY p.innovationScore DESC, p.stars DESC
      LIMIT $limit
    `
    
    const result = await runQuery(query, { 
      since: daysAgo.toISOString(),
      limit 
    })
    
    const projects = result.records.map(record => {
      const props = record.get('p').properties
      return {
        ...props,
        metrics: JSON.parse(props.metrics || '{}')
      }
    })
    
    return c.json({
      success: true,
      projects,
      count: projects.length,
      period: `${days} days`
    })
  } catch (error) {
    console.error('Error fetching trending projects:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch trending projects' 
    }, 500)
  }
})

// Get innovation statistics
app.get('/stats', async (c) => {
  try {
    const query = `
      MATCH (p:Project)
      WITH 
        COUNT(p) as totalProjects,
        AVG(p.innovationScore) as avgScore,
        MAX(p.innovationScore) as maxScore,
        COUNT(CASE WHEN p.innovationScore > 60 THEN 1 END) as highlyInnovative,
        COUNT(CASE WHEN p.innovationScore > 40 AND p.innovationScore <= 60 THEN 1 END) as innovative,
        COUNT(CASE WHEN p.innovationScore <= 40 THEN 1 END) as standard
      RETURN {
        total: totalProjects,
        averageScore: avgScore,
        maxScore: maxScore,
        distribution: {
          highlyInnovative: highlyInnovative,
          innovative: innovative,
          standard: standard
        }
      } as stats
    `
    
    const result = await runQuery(query)
    const stats = result.records[0].get('stats')
    
    return c.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching innovation stats:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    }, 500)
  }
})

export { app as innovationRoutes }