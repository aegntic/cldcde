import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Test Supabase connection
async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
  
  console.log('🔌 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not found')
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // Test connection with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.log('❌ Connection test failed:', error.message)
      
      // Check if it's because the table doesn't exist
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('📋 Tables not set up yet. Need to apply schema.')
        return { connected: true, schemaNeeded: true }
      }
      
      return { connected: false, error: error.message }
    }
    
    console.log('✅ Connection successful!')
    console.log('📊 Profiles table exists with', data?.length || 0, 'entries')
    return { connected: true, schemaNeeded: false }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message)
    return { connected: false, error: err.message }
  }
}

// Apply database schema
async function applySchema() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
  
  console.log('📋 Applying enhanced database schema...')
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    const schemaPath = path.join(__dirname, 'supabase', 'enhanced-schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
    
    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length < 10) continue // Skip very short statements
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message)
      }
    }
    
    console.log('📋 Schema application completed!')
    return true
    
  } catch (err) {
    console.log('❌ Schema application failed:', err.message)
    return false
  }
}

async function main() {
  // Load environment variables
  require('dotenv').config()
  
  const result = await testConnection()
  
  if (!result.connected) {
    console.log('❌ Cannot proceed without database connection')
    process.exit(1)
  }
  
  if (result.schemaNeeded) {
    console.log('🔧 Setting up database schema...')
    await applySchema()
    
    // Test again
    console.log('🔄 Testing connection after schema setup...')
    const testResult = await testConnection()
    if (testResult.connected && !testResult.schemaNeeded) {
      console.log('🎉 Database setup completed successfully!')
    }
  } else {
    console.log('🎉 Database is ready!')
  }
}

main().catch(console.error)