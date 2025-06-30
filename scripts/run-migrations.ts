#!/usr/bin/env bun

import { D1Database } from '@cloudflare/workers-types'
import { createD1Client } from '../src/db/d1'
import * as fs from 'fs/promises'
import * as path from 'path'

interface Migration {
  id: number
  name: string
  applied_at: string
}

class MigrationRunner {
  constructor(private db: D1Database) {}

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    const client = createD1Client(this.db)
    
    console.log('🔄 Running database migrations...')

    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable(client)

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations(client)
      const appliedIds = new Set(appliedMigrations.map(m => m.id))

      // Get migration files
      const migrationsDir = path.join(process.cwd(), 'migrations')
      const files = await fs.readdir(migrationsDir)
      const migrationFiles = files
        .filter(f => f.endsWith('.sql'))
        .sort()

      let migrationsRun = 0

      for (const file of migrationFiles) {
        const migrationId = parseInt(file.split('_')[0])
        
        if (isNaN(migrationId)) {
          console.warn(`⚠️  Skipping invalid migration file: ${file}`)
          continue
        }

        if (appliedIds.has(migrationId)) {
          console.log(`✓ Migration ${file} already applied`)
          continue
        }

        // Read and run migration
        const filePath = path.join(migrationsDir, file)
        const sql = await fs.readFile(filePath, 'utf-8')

        console.log(`📝 Running migration: ${file}`)
        
        try {
          await this.executeMigration(client, sql)
          
          // Record migration
          await client.insert('migrations', {
            id: migrationId,
            name: file,
            applied_at: new Date().toISOString()
          })

          console.log(`✅ Migration ${file} completed`)
          migrationsRun++
        } catch (error) {
          console.error(`❌ Migration ${file} failed:`, error)
          throw error
        }
      }

      console.log(`\n✅ Migrations complete. ${migrationsRun} migrations run.`)
    } catch (error) {
      console.error('❌ Migration runner failed:', error)
      throw error
    }
  }

  /**
   * Rollback the last migration
   */
  async rollbackMigration(): Promise<void> {
    const client = createD1Client(this.db)
    
    console.log('⏪ Rolling back last migration...')

    try {
      const lastMigration = await client.rawFirst<Migration>(
        'SELECT * FROM migrations ORDER BY id DESC LIMIT 1'
      )

      if (!lastMigration) {
        console.log('No migrations to rollback')
        return
      }

      // Look for rollback file
      const rollbackFile = lastMigration.name.replace('.sql', '.rollback.sql')
      const rollbackPath = path.join(process.cwd(), 'migrations', rollbackFile)

      try {
        const rollbackSql = await fs.readFile(rollbackPath, 'utf-8')
        
        console.log(`📝 Rolling back: ${lastMigration.name}`)
        await this.executeMigration(client, rollbackSql)
        
        // Remove migration record
        await client.delete('migrations', { id: lastMigration.id })
        
        console.log(`✅ Rollback completed: ${lastMigration.name}`)
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(`❌ No rollback file found: ${rollbackFile}`)
          console.error('Please create a rollback file or manually revert the changes')
        }
        throw error
      }
    } catch (error) {
      console.error('❌ Rollback failed:', error)
      throw error
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<void> {
    const client = createD1Client(this.db)

    try {
      await this.createMigrationsTable(client)

      const appliedMigrations = await this.getAppliedMigrations(client)
      const migrationsDir = path.join(process.cwd(), 'migrations')
      const files = await fs.readdir(migrationsDir)
      const migrationFiles = files
        .filter(f => f.endsWith('.sql') && !f.includes('.rollback'))
        .sort()

      console.log('\n📊 Migration Status\n')
      console.log('Applied migrations:')
      
      if (appliedMigrations.length === 0) {
        console.log('  (none)')
      } else {
        for (const migration of appliedMigrations) {
          console.log(`  ✅ ${migration.name} (applied: ${migration.applied_at})`)
        }
      }

      const appliedIds = new Set(appliedMigrations.map(m => m.id))
      const pendingMigrations = migrationFiles.filter(file => {
        const id = parseInt(file.split('_')[0])
        return !isNaN(id) && !appliedIds.has(id)
      })

      console.log('\nPending migrations:')
      if (pendingMigrations.length === 0) {
        console.log('  (none)')
      } else {
        for (const file of pendingMigrations) {
          console.log(`  ⏳ ${file}`)
        }
      }
    } catch (error) {
      console.error('❌ Failed to get migration status:', error)
      throw error
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(name: string): Promise<void> {
    if (!name) {
      throw new Error('Migration name is required')
    }

    const timestamp = Date.now()
    const fileName = `${timestamp}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.sql`
    const rollbackFileName = fileName.replace('.sql', '.rollback.sql')
    const migrationsDir = path.join(process.cwd(), 'migrations')

    await fs.mkdir(migrationsDir, { recursive: true })

    const migrationPath = path.join(migrationsDir, fileName)
    const rollbackPath = path.join(migrationsDir, rollbackFileName)

    const migrationTemplate = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
`

    const rollbackTemplate = `-- Rollback for: ${name}
-- Created: ${new Date().toISOString()}

-- Add your rollback SQL here
`

    await fs.writeFile(migrationPath, migrationTemplate)
    await fs.writeFile(rollbackPath, rollbackTemplate)

    console.log(`✅ Created migration files:`)
    console.log(`  📄 ${fileName}`)
    console.log(`  📄 ${rollbackFileName}`)
  }

  // Private helper methods

  private async createMigrationsTable(client: ReturnType<typeof createD1Client>): Promise<void> {
    await client.raw(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `)
  }

  private async getAppliedMigrations(client: ReturnType<typeof createD1Client>): Promise<Migration[]> {
    return client.rawAll<Migration>('SELECT * FROM migrations ORDER BY id')
  }

  private async executeMigration(client: ReturnType<typeof createD1Client>, sql: string): Promise<void> {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    // Execute statements in a transaction
    await client.transaction(async (tx) => {
      for (const statement of statements) {
        await client.raw(statement + ';')
      }
    })
  }
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2)
  const command = args[0]

  const printUsage = () => {
    console.log(`
D1 Migration Runner

Usage:
  bun run run-migrations.ts migrate
  bun run run-migrations.ts rollback
  bun run run-migrations.ts status
  bun run run-migrations.ts create <name>

Commands:
  migrate     Run all pending migrations
  rollback    Rollback the last migration
  status      Show migration status
  create      Create a new migration file
`)
  }

  if (!command) {
    printUsage()
    process.exit(1)
  }

  // This is a CLI tool that would need to be integrated with your D1 database
  console.log('Note: This CLI tool needs to be integrated with wrangler to access D1')
  
  if (command === 'create') {
    const name = args[1]
    if (!name) {
      console.error('❌ Migration name is required')
      process.exit(1)
    }
    
    // Can create migration files without D1 connection
    const runner = new MigrationRunner(null as any)
    runner.createMigration(name).catch(console.error)
  }
}

// Export for use with wrangler
export default {
  async fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    const runner = new MigrationRunner(env.DB)

    try {
      if (pathname === '/migrations/run') {
        await runner.runMigrations()
        return new Response('Migrations completed successfully', { status: 200 })
      }

      if (pathname === '/migrations/rollback') {
        await runner.rollbackMigration()
        return new Response('Rollback completed successfully', { status: 200 })
      }

      if (pathname === '/migrations/status') {
        // Capture console output
        const output: string[] = []
        const originalLog = console.log
        console.log = (...args) => output.push(args.join(' '))
        
        await runner.getStatus()
        
        console.log = originalLog
        
        return new Response(output.join('\n'), {
          headers: { 'Content-Type': 'text/plain' }
        })
      }

      return new Response('Not found', { status: 404 })
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 })
    }
  }
}

export { MigrationRunner }