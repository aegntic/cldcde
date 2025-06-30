import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

async function testSupabaseAuth() {
  console.log('Testing Supabase Auth directly...\n')
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
  
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  console.log(`Attempting to sign up with email: ${testEmail}`)
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: 'testuser',
        full_name: 'Test User'
      }
    }
  })
  
  if (error) {
    console.error('❌ Signup failed:', error.message)
    console.error('Error details:', error)
    
    if (error.message.includes('not enabled')) {
      console.log('\n⚠️  Email auth is not enabled in Supabase!')
      console.log('Please go to: https://supabase.com/dashboard/project/giuyocjmgwzfbkammehu/auth/providers')
      console.log('And enable "Email" provider')
    }
  } else {
    console.log('✅ Signup successful!')
    console.log('User:', data.user?.email)
    console.log('Session:', data.session ? 'Created' : 'Not created (email confirmation required)')
  }
}

testSupabaseAuth().catch(console.error)