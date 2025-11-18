#!/usr/bin/env bun

import { D1Database } from '@cloudflare/workers-types'
import { createD1Client } from '../src/db/d1'
import * as fs from 'fs/promises'
import * as path from 'path'

interface BackupOptions {
  tables?: string[]
  outputDir?: string
  format?: 'json' | 'sql'
  compress?: boolean
}

interface TableInfo {
  name: string
  sql: string
}

interface BackupMetadata {
  version: string
  timestamp: string
  tables: string[]
  rowCounts: Record<string, number>
  checksum?: string
}

class D1BackupService {
  constructor(private db: D1Database) {}

  /**
   * Create a full backup of the database
   */
  async createBackup(options: BackupOptions = {}): Promise<string> {
    const {
      tables = [],
      outputDir = './backups',
      format = 'sql',
      compress = true
    } = options

    const client = createD1Client(this.db)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `d1-backup-${timestamp}`

    console.log(`📦 Starting backup: ${backupName}`)

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true })

      // Get all tables if none specified
      const tablesToBackup = tables.length > 0 
        ? tables 
        : await this.getAllTables(client)

      if (format === 'sql') {
        await this.createSQLBackup(client, tablesToBackup, outputDir, backupName, compress)
      } else {
        await this.createJSONBackup(client, tablesToBackup, outputDir, backupName, compress)
      }

      console.log(`✅ Backup completed: ${backupName}`)
      return path.join(outputDir, backupName + (compress ? '.gz' : ''))
    } catch (error) {
      console.error(`❌ Backup failed: ${error}`)
      throw error
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string, options: { tables?: string[] } = {}): Promise<void> {
    const client = createD1Client(this.db)
    const { tables = [] } = options

    console.log(`🔄 Starting restore from: ${backupPath}`)

    try {
      const isCompressed = backupPath.endsWith('.gz')
      let content: string

      if (isCompressed) {
        // Decompress using Bun's built-in gzip support
        const compressed = await fs.readFile(backupPath)
        content = await new Response(
          new Response(compressed).body?.pipeThrough(new DecompressionStream('gzip'))
        ).text()
      } else {
        content = await fs.readFile(backupPath, 'utf-8')
      }

      if (backupPath.includes('.json')) {
        await this.restoreFromJSON(client, content, tables)
      } else {
        await this.restoreFromSQL(client, content, tables)
      }

      console.log('✅ Restore completed successfully')
    } catch (error) {
      console.error(`❌ Restore failed: ${error}`)
      throw error
    }
  }

  /**
   * Create incremental backup (changes since last backup)
   */
  async createIncrementalBackup(
    lastBackupTimestamp: string,
    options: BackupOptions = {}
  ): Promise<string> {
    const client = createD1Client(this.db)
    const { outputDir = './backups' } = options
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `d1-incremental-${timestamp}`

    console.log(`📦 Starting incremental backup since: ${lastBackupTimestamp}`)

    try {
      await fs.mkdir(outputDir, { recursive: true })
      const backupPath = path.join(outputDir, `${backupName}.json`)

      const incrementalData: Record<string, any[]> = {}

      // Get tables with timestamp columns
      const tablesWithTimestamps = [
        'forums', 'posts', 'comments', 'news', 'reviews'
      ]

      for (const table of tablesWithTimestamps) {
        const changes = await client.rawAll(
          `SELECT * FROM ${table} WHERE updated_at > ? OR created_at > ?`,
          [lastBackupTimestamp, lastBackupTimestamp]
        )

        if (changes.length > 0) {
          incrementalData[table] = changes
          console.log(`  📝 ${table}: ${changes.length} changes`)
        }
      }

      // Save incremental backup
      const metadata: BackupMetadata = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables: Object.keys(incrementalData),
        rowCounts: Object.fromEntries(
          Object.entries(incrementalData).map(([table, rows]) => [table, rows.length])
        )
      }

      const backup = {
        metadata,
        since: lastBackupTimestamp,
        data: incrementalData
      }

      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2))

      console.log(`✅ Incremental backup completed: ${backupName}`)
      return backupPath
    } catch (error) {
      console.error(`❌ Incremental backup failed: ${error}`)
      throw error
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    console.log(`🔍 Verifying backup: ${backupPath}`)

    try {
      const isCompressed = backupPath.endsWith('.gz')
      let content: string

      if (isCompressed) {
        const compressed = await fs.readFile(backupPath)
        content = await new Response(
          new Response(compressed).body?.pipeThrough(new DecompressionStream('gzip'))
        ).text()
      } else {
        content = await fs.readFile(backupPath, 'utf-8')
      }

      if (backupPath.includes('.json')) {
        const backup = JSON.parse(content)
        
        // Verify structure
        if (!backup.metadata || !backup.data) {
          throw new Error('Invalid backup structure')
        }

        // Verify data integrity
        for (const [table, rows] of Object.entries(backup.data as Record<string, any[]>)) {
          if (!Array.isArray(rows)) {
            throw new Error(`Invalid data for table ${table}`)
          }
        }

        console.log('✅ Backup verification passed')
        return true
      } else {
        // Basic SQL validation
        if (!content.includes('CREATE TABLE') && !content.includes('INSERT INTO')) {
          throw new Error('Invalid SQL backup')
        }

        console.log('✅ Backup verification passed')
        return true
      }
    } catch (error) {
      console.error(`❌ Backup verification failed: ${error}`)
      return false
    }
  }

  /**
   * List available backups
   */
  async listBackups(backupDir = './backups'): Promise<Array<{
    name: string
    path: string
    size: number
    created: Date
    type: 'full' | 'incremental'
  }>> {
    try {
      const files = await fs.readdir(backupDir)
      const backups = []

      for (const file of files) {
        if (file.startsWith('d1-backup-') || file.startsWith('d1-incremental-')) {
          const filePath = path.join(backupDir, file)
          const stats = await fs.stat(filePath)
          
          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            type: file.includes('incremental') ? 'incremental' as const : 'full' as const
          })
        }
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime())
    } catch (error) {
      console.error(`Error listing backups: ${error}`)
      return []
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(
    backupDir = './backups',
    retentionDays = 30,
    keepMinimum = 5
  ): Promise<number> {
    console.log(`🧹 Cleaning up backups older than ${retentionDays} days`)

    try {
      const backups = await this.listBackups(backupDir)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      // Sort by date and keep minimum number
      const sortedBackups = backups.sort((a, b) => b.created.getTime() - a.created.getTime())
      const backupsToDelete = sortedBackups
        .slice(keepMinimum)
        .filter(backup => backup.created < cutoffDate)

      let deletedCount = 0
      for (const backup of backupsToDelete) {
        await fs.unlink(backup.path)
        console.log(`  🗑️  Deleted: ${backup.name}`)
        deletedCount++
      }

      console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups`)
      return deletedCount
    } catch (error) {
      console.error(`❌ Cleanup failed: ${error}`)
      return 0
    }
  }

  // Private helper methods

  private async getAllTables(client: ReturnType<typeof createD1Client>): Promise<string[]> {
    const tables = await client.rawAll<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    )
    return tables.map(t => t.name)
  }

  private async createSQLBackup(
    client: ReturnType<typeof createD1Client>,
    tables: string[],
    outputDir: string,
    backupName: string,
    compress: boolean
  ): Promise<void> {
    let sql = '-- D1 Database Backup\n'
    sql += `-- Created: ${new Date().toISOString()}\n`
    sql += '-- Version: 1.0\n\n'
    sql += 'PRAGMA foreign_keys = OFF;\n\n'

    // Get table schemas
    for (const table of tables) {
      const schema = await client.rawFirst<TableInfo>(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      )

      if (schema) {
        sql += `-- Table: ${table}\n`
        sql += `DROP TABLE IF EXISTS ${table};\n`
        sql += schema.sql + ';\n\n'

        // Get table data
        const rows = await client.rawAll(`SELECT * FROM ${table}`)
        
        if (rows.length > 0) {
          const columns = Object.keys(rows[0])
          
          for (const row of rows) {
            const values = columns.map(col => {
              const value = row[col]
              if (value === null) return 'NULL'
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
              if (typeof value === 'boolean') return value ? '1' : '0'
              return value
            })

            sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
          }
          sql += '\n'
        }
      }
    }

    // Get indexes
    const indexes = await client.rawAll<TableInfo>(
      `SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL`
    )

    if (indexes.length > 0) {
      sql += '-- Indexes\n'
      for (const index of indexes) {
        sql += index.sql + ';\n'
      }
      sql += '\n'
    }

    // Get triggers
    const triggers = await client.rawAll<TableInfo>(
      `SELECT sql FROM sqlite_master WHERE type='trigger'`
    )

    if (triggers.length > 0) {
      sql += '-- Triggers\n'
      for (const trigger of triggers) {
        sql += trigger.sql + ';\n'
      }
      sql += '\n'
    }

    // Get views
    const views = await client.rawAll<TableInfo>(
      `SELECT sql FROM sqlite_master WHERE type='view'`
    )

    if (views.length > 0) {
      sql += '-- Views\n'
      for (const view of views) {
        sql += view.sql + ';\n'
      }
    }

    sql += '\nPRAGMA foreign_keys = ON;\n'

    // Save to file
    const filePath = path.join(outputDir, `${backupName}.sql${compress ? '.gz' : ''}`)
    
    if (compress) {
      const compressed = new Response(sql).body?.pipeThrough(new CompressionStream('gzip'))
      if (compressed) {
        const buffer = await new Response(compressed).arrayBuffer()
        await fs.writeFile(filePath, Buffer.from(buffer))
      }
    } else {
      await fs.writeFile(filePath, sql)
    }
  }

  private async createJSONBackup(
    client: ReturnType<typeof createD1Client>,
    tables: string[],
    outputDir: string,
    backupName: string,
    compress: boolean
  ): Promise<void> {
    const data: Record<string, any[]> = {}
    const rowCounts: Record<string, number> = {}

    for (const table of tables) {
      const rows = await client.rawAll(`SELECT * FROM ${table}`)
      data[table] = rows
      rowCounts[table] = rows.length
      console.log(`  📊 ${table}: ${rows.length} rows`)
    }

    const metadata: BackupMetadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables,
      rowCounts
    }

    const backup = { metadata, data }
    const json = JSON.stringify(backup, null, 2)

    const filePath = path.join(outputDir, `${backupName}.json${compress ? '.gz' : ''}`)

    if (compress) {
      const compressed = new Response(json).body?.pipeThrough(new CompressionStream('gzip'))
      if (compressed) {
        const buffer = await new Response(compressed).arrayBuffer()
        await fs.writeFile(filePath, Buffer.from(buffer))
      }
    } else {
      await fs.writeFile(filePath, json)
    }
  }

  private async restoreFromSQL(
    client: ReturnType<typeof createD1Client>,
    sql: string,
    tables: string[]
  ): Promise<void> {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // If specific tables requested, filter statements
    const filteredStatements = tables.length > 0
      ? statements.filter(stmt => {
          return tables.some(table => 
            stmt.includes(`CREATE TABLE ${table}`) ||
            stmt.includes(`INSERT INTO ${table}`) ||
            stmt.includes(`CREATE INDEX`) && stmt.includes(`ON ${table}`)
          )
        })
      : statements

    // Execute statements in batches
    const batchSize = 100
    for (let i = 0; i < filteredStatements.length; i += batchSize) {
      const batch = filteredStatements.slice(i, i + batchSize)
      const preparedStatements = batch.map(stmt => client.prepare(stmt + ';'))
      
      await client.batch(preparedStatements)
      console.log(`  ⚡ Executed ${Math.min(i + batchSize, filteredStatements.length)}/${filteredStatements.length} statements`)
    }
  }

  private async restoreFromJSON(
    client: ReturnType<typeof createD1Client>,
    json: string,
    tables: string[]
  ): Promise<void> {
    const backup = JSON.parse(json)
    const tablesToRestore = tables.length > 0 
      ? tables 
      : backup.metadata.tables

    for (const table of tablesToRestore) {
      const rows = backup.data[table]
      if (!rows || rows.length === 0) continue

      console.log(`  📝 Restoring ${table}: ${rows.length} rows`)

      // Clear existing data
      await client.raw(`DELETE FROM ${table}`)

      // Insert in batches
      const batchSize = 100
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        
        for (const row of batch) {
          await client.insert(table, row)
        }
        
        console.log(`    ✓ Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length} rows`)
      }
    }
  }
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2)
  const command = args[0]

  const printUsage = () => {
    console.log(`
D1 Backup Tool

Usage:
  bun run backup-d1.ts backup [options]
  bun run backup-d1.ts restore <backup-path> [options]
  bun run backup-d1.ts list [backup-dir]
  bun run backup-d1.ts verify <backup-path>
  bun run backup-d1.ts cleanup [options]

Commands:
  backup              Create a database backup
  restore             Restore from a backup file
  list                List available backups
  verify              Verify backup integrity
  cleanup             Remove old backups

Options:
  --tables            Comma-separated list of tables to backup/restore
  --format            Backup format: sql or json (default: sql)
  --no-compress       Disable compression
  --output-dir        Output directory (default: ./backups)
  --retention-days    Days to keep backups (default: 30)
  --keep-minimum      Minimum backups to keep (default: 5)
`)
  }

  if (!command) {
    printUsage()
    process.exit(1)
  }

  // This is a CLI tool that would need to be integrated with your D1 database
  // through wrangler or another method to access the D1 instance
  console.log('Note: This CLI tool needs to be integrated with wrangler to access D1')
}

// Export for use with wrangler
export default {
  async fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    const backupService = new D1BackupService(env.DB)

    try {
      if (pathname === '/backup') {
        const backupPath = await backupService.createBackup()
        return new Response(JSON.stringify({ success: true, path: backupPath }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (pathname === '/backup/list') {
        const backups = await backupService.listBackups()
        return new Response(JSON.stringify(backups), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (pathname === '/backup/cleanup') {
        const deleted = await backupService.cleanupOldBackups()
        return new Response(JSON.stringify({ success: true, deleted }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response('Not found', { status: 404 })
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

export { D1BackupService }