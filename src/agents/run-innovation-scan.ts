#!/usr/bin/env bun

import { innovationTracker } from './github-innovation-tracker.js'
import { initDatabase, closeDatabase } from '../db/neo4j.js'

// Command line runner for the innovation tracker
async function main() {
  console.log('GitHub Innovation Tracker - Manual Run')
  console.log('=====================================\n')

  try {
    // Initialize database connection
    console.log('Connecting to database...')
    await initDatabase()

    // Parse command line arguments
    const args = process.argv.slice(2)
    const command = args[0] || 'scan'

    switch (command) {
      case 'scan':
        console.log('Running full innovation scan...\n')
        await innovationTracker.runInnovationScan()
        break

      case 'trending':
        console.log('Fetching trending repositories...\n')
        const trending = await innovationTracker.findTrendingRepositories()
        console.log(`Found ${trending.length} trending repositories:`)
        trending.forEach(repo => {
          console.log(`- ${repo.full_name} (★ ${repo.stargazers_count})`)
        })
        break

      case 'top':
        console.log('Fetching top innovative projects...\n')
        const limit = parseInt(args[1]) || 10
        const topProjects = await innovationTracker.getTopInnovativeProjects(limit)
        console.log(`Top ${limit} innovative projects:`)
        topProjects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.fullName} (Score: ${project.innovationScore})`)
          console.log(`   ${project.description || 'No description'}`)
          console.log(`   ★ ${project.stars} | Owner: ${project.owner}`)
          console.log(`   ${project.url}\n`)
        })
        break

      case 'monitor':
        const username = args[1]
        if (!username) {
          console.error('Error: Username required for monitor command')
          console.log('Usage: bun run src/agents/run-innovation-scan.ts monitor <username>')
          process.exit(1)
        }
        console.log(`Monitoring contributor: ${username}\n`)
        const repos = await innovationTracker.monitorContributor(username)
        console.log(`Found ${repos.length} relevant repositories:`)
        repos.forEach(repo => {
          console.log(`- ${repo.name}: ${repo.description || 'No description'}`)
        })
        break

      case 'search':
        console.log('Searching for innovative projects...\n')
        const projects = await innovationTracker.searchInnovativeProjects()
        console.log(`Found ${projects.length} innovative projects`)
        
        // Calculate and display scores for top 10
        const scoredProjects = []
        for (const project of projects.slice(0, 10)) {
          const metrics = await innovationTracker.calculateInnovationScore(project)
          scoredProjects.push({ project, metrics })
        }
        
        // Sort by score and display
        scoredProjects.sort((a, b) => b.metrics.total - a.metrics.total)
        console.log('\nTop innovative projects found:')
        scoredProjects.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.project.full_name} (Score: ${item.metrics.total.toFixed(1)})`)
          console.log(`   ${item.project.description || 'No description'}`)
          console.log(`   Metrics:`)
          console.log(`   - Stars: ${item.metrics.stars.toFixed(1)}/25`)
          console.log(`   - Recent Activity: ${item.metrics.recentActivity.toFixed(1)}/25`)
          console.log(`   - Code Complexity: ${item.metrics.codeComplexity.toFixed(1)}/20`)
          console.log(`   - Unique Approach: ${item.metrics.uniqueApproach.toFixed(1)}/20`)
          console.log(`   - Community: ${item.metrics.communityEngagement.toFixed(1)}/15`)
          console.log(`   - Technical Depth: ${item.metrics.technicalDepth.toFixed(1)}/15`)
        })
        break

      case 'help':
      default:
        console.log('Available commands:')
        console.log('  scan             - Run full innovation scan (default)')
        console.log('  trending         - Find trending repositories')
        console.log('  top [limit]      - Show top innovative projects')
        console.log('  monitor <user>   - Monitor a specific contributor')
        console.log('  search           - Search and score innovative projects')
        console.log('  help             - Show this help message')
        break
    }

    console.log('\nOperation completed successfully')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    // Close database connection
    await closeDatabase()
  }
}

// Run the main function
main().catch(console.error)