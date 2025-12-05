#!/bin/bash

echo "🔨 Setting up Supabase for aegntic Authentication"
echo ""

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ SUPABASE_PROJECT_REF not set"
    echo "   Please choose a project:"
    echo "   - dbdgbzsyozdhuhpdjsth (aegnt-suna_1)"
    echo "   - kzthvqrsaapghqdlxxij (2think)"
    echo "   - noemdwhwothnturyglde (CREDABILITY)"
    echo ""
    echo "Add to ~/.claude/.env:"
    echo "SUPABASE_PROJECT_REF=your-project-ref"
    echo "SUPABASE_URL=https://your-project-ref.supabase.co"
    echo "SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

echo "Using Supabase project: $SUPABASE_PROJECT_REF"
echo ""
echo "To apply the schema:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of supabase-schema.sql"
echo "4. Click 'Run'"
echo ""
echo "Or use Supabase CLI:"
echo "supabase db push --db-url postgresql://postgres:password@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres"

# Create test script
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('aegntic_users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Tables not created yet');
        console.log('   Please run the schema SQL first');
      } else {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('   Tables are ready');
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
EOF

echo ""
echo "Test script created: test-supabase.js"
echo "Run: node test-supabase.js"