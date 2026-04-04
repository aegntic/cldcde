import { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types'

export interface D1QueryBuilder {
  select: (columns?: string[]) => D1QueryBuilder
  from: (table: string) => D1QueryBuilder
  where: (condition: string, value?: any) => D1QueryBuilder
  whereIn: (column: string, values: any[]) => D1QueryBuilder
  orderBy: (column: string, direction?: 'ASC' | 'DESC') => D1QueryBuilder
  limit: (count: number) => D1QueryBuilder
  offset: (count: number) => D1QueryBuilder
  join: (table: string, condition: string) => D1QueryBuilder
  leftJoin: (table: string, condition: string) => D1QueryBuilder
  groupBy: (columns: string[]) => D1QueryBuilder
  having: (condition: string) => D1QueryBuilder
  build: () => { query: string; params: any[] }
  execute: () => Promise<D1Result>
  first: <T = any>() => Promise<T | null>
  all: <T = any>() => Promise<T[]>
}

export class QueryBuilder implements D1QueryBuilder {
  private db: D1Database
  private parts: {
    select: string[]
    from: string
    joins: string[]
    where: string[]
    groupBy: string[]
    having: string[]
    orderBy: string[]
    limit?: number
    offset?: number
  }
  private params: any[] = []
  private paramCounter = 0

  constructor(db: D1Database) {
    this.db = db
    this.parts = {
      select: ['*'],
      from: '',
      joins: [],
      where: [],
      groupBy: [],
      having: [],
      orderBy: []
    }
  }

  select(columns?: string[]): D1QueryBuilder {
    if (columns && columns.length > 0) {
      this.parts.select = columns
    }
    return this
  }

  from(table: string): D1QueryBuilder {
    this.parts.from = table
    return this
  }

  where(condition: string, value?: any): D1QueryBuilder {
    if (value !== undefined) {
      this.paramCounter++
      this.parts.where.push(condition.replace('?', `?${this.paramCounter}`))
      this.params.push(value)
    } else {
      this.parts.where.push(condition)
    }
    return this
  }

  whereIn(column: string, values: any[]): D1QueryBuilder {
    const placeholders = values.map(() => '?').join(', ')
    this.parts.where.push(`${column} IN (${placeholders})`)
    this.params.push(...values)
    return this
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): D1QueryBuilder {
    this.parts.orderBy.push(`${column} ${direction}`)
    return this
  }

  limit(count: number): D1QueryBuilder {
    this.parts.limit = count
    return this
  }

  offset(count: number): D1QueryBuilder {
    this.parts.offset = count
    return this
  }

  join(table: string, condition: string): D1QueryBuilder {
    this.parts.joins.push(`JOIN ${table} ON ${condition}`)
    return this
  }

  leftJoin(table: string, condition: string): D1QueryBuilder {
    this.parts.joins.push(`LEFT JOIN ${table} ON ${condition}`)
    return this
  }

  groupBy(columns: string[]): D1QueryBuilder {
    this.parts.groupBy = columns
    return this
  }

  having(condition: string): D1QueryBuilder {
    this.parts.having.push(condition)
    return this
  }

  build(): { query: string; params: any[] } {
    let query = `SELECT ${this.parts.select.join(', ')} FROM ${this.parts.from}`

    if (this.parts.joins.length > 0) {
      query += ' ' + this.parts.joins.join(' ')
    }

    if (this.parts.where.length > 0) {
      query += ' WHERE ' + this.parts.where.join(' AND ')
    }

    if (this.parts.groupBy.length > 0) {
      query += ' GROUP BY ' + this.parts.groupBy.join(', ')
    }

    if (this.parts.having.length > 0) {
      query += ' HAVING ' + this.parts.having.join(' AND ')
    }

    if (this.parts.orderBy.length > 0) {
      query += ' ORDER BY ' + this.parts.orderBy.join(', ')
    }

    if (this.parts.limit !== undefined) {
      query += ` LIMIT ${this.parts.limit}`
    }

    if (this.parts.offset !== undefined) {
      query += ` OFFSET ${this.parts.offset}`
    }

    return { query, params: this.params }
  }

  async execute(): Promise<D1Result> {
    const { query, params } = this.build()
    const stmt = this.db.prepare(query)
    return params.length > 0 ? stmt.bind(...params).run() : stmt.run()
  }

  async first<T = any>(): Promise<T | null> {
    const { query, params } = this.build()
    const stmt = this.db.prepare(query)
    return params.length > 0 ? stmt.bind(...params).first<T>() : stmt.first<T>()
  }

  async all<T = any>(): Promise<T[]> {
    const { query, params } = this.build()
    const stmt = this.db.prepare(query)
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
    return result.results as T[]
  }
}

export class D1Client {
  constructor(private db: D1Database) {}

  // Query builder factory
  query(): D1QueryBuilder {
    return new QueryBuilder(this.db)
  }

  // Prepared statement helpers
  prepare(query: string): D1PreparedStatement {
    return this.db.prepare(query)
  }

  // Transaction helper
  async transaction<T>(callback: (tx: D1Transaction) => Promise<T>): Promise<T> {
    const tx = new D1Transaction(this.db)
    try {
      await tx.begin()
      const result = await callback(tx)
      await tx.commit()
      return result
    } catch (error) {
      await tx.rollback()
      throw error
    }
  }

  // Batch operations
  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.db.batch(statements)
  }

  // Insert helper with RETURNING support
  async insert<T = any>(
    table: string,
    data: Record<string, any>,
    returning?: string[]
  ): Promise<T | null> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = columns.map(() => '?').join(', ')
    
    let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    
    if (returning && returning.length > 0) {
      query += ` RETURNING ${returning.join(', ')}`
    }

    const stmt = this.db.prepare(query).bind(...values)
    
    if (returning) {
      return stmt.first<T>()
    } else {
      await stmt.run()
      return null
    }
  }

  // Update helper
  async update(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<D1Result> {
    const setClauses = Object.keys(data).map(key => `${key} = ?`)
    const whereClauses = Object.keys(where).map(key => `${key} = ?`)
    const values = [...Object.values(data), ...Object.values(where)]

    const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`
    
    return this.db.prepare(query).bind(...values).run()
  }

  // Delete helper
  async delete(table: string, where: Record<string, any>): Promise<D1Result> {
    const whereClauses = Object.keys(where).map(key => `${key} = ?`)
    const values = Object.values(where)

    const query = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`
    
    return this.db.prepare(query).bind(...values).run()
  }

  // Upsert helper (INSERT OR REPLACE)
  async upsert<T = any>(
    table: string,
    data: Record<string, any>,
    conflictColumns: string[],
    returning?: string[]
  ): Promise<T | null> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = columns.map(() => '?').join(', ')
    
    const updateClauses = columns
      .filter(col => !conflictColumns.includes(col))
      .map(col => `${col} = excluded.${col}`)

    let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    query += ` ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET ${updateClauses.join(', ')}`
    
    if (returning && returning.length > 0) {
      query += ` RETURNING ${returning.join(', ')}`
    }

    const stmt = this.db.prepare(query).bind(...values)
    
    if (returning) {
      return stmt.first<T>()
    } else {
      await stmt.run()
      return null
    }
  }

  // Count helper
  async count(table: string, where?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`
    const values: any[] = []

    if (where && Object.keys(where).length > 0) {
      const whereClauses = Object.keys(where).map(key => `${key} = ?`)
      query += ` WHERE ${whereClauses.join(' AND ')}`
      values.push(...Object.values(where))
    }

    const result = await this.db.prepare(query).bind(...values).first<{ count: number }>()
    return result?.count || 0
  }

  // Raw query execution
  async raw<T = any>(query: string, params?: any[]): Promise<D1Result> {
    const stmt = this.db.prepare(query)
    return params && params.length > 0 ? stmt.bind(...params).run() : stmt.run()
  }

  // Raw query with first result
  async rawFirst<T = any>(query: string, params?: any[]): Promise<T | null> {
    const stmt = this.db.prepare(query)
    return params && params.length > 0 ? stmt.bind(...params).first<T>() : stmt.first<T>()
  }

  // Raw query with all results
  async rawAll<T = any>(query: string, params?: any[]): Promise<T[]> {
    const stmt = this.db.prepare(query)
    const result = params && params.length > 0 
      ? await stmt.bind(...params).all() 
      : await stmt.all()
    return result.results as T[]
  }
}

// Transaction helper class
class D1Transaction {
  private inTransaction = false

  constructor(private db: D1Database) {}

  async begin(): Promise<void> {
    await this.db.prepare('BEGIN TRANSACTION').run()
    this.inTransaction = true
  }

  async commit(): Promise<void> {
    if (this.inTransaction) {
      await this.db.prepare('COMMIT').run()
      this.inTransaction = false
    }
  }

  async rollback(): Promise<void> {
    if (this.inTransaction) {
      await this.db.prepare('ROLLBACK').run()
      this.inTransaction = false
    }
  }

  // Proxy all D1Client methods to use the same database connection
  query(): D1QueryBuilder {
    return new QueryBuilder(this.db)
  }

  prepare(query: string): D1PreparedStatement {
    return this.db.prepare(query)
  }
}

// Export helper function to create a client
export function createD1Client(db: D1Database): D1Client {
  return new D1Client(db)
}