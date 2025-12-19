import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://oyxfyovoqtcmpgazckcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZ5b3ZvcXRjbXBnYXpja2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU5MzMsImV4cCI6MjA3Njg3MTkzM30.jFLmOmJpuwpCi4wswlX94SBxtF6Je_btv0Y65nK15s0'

// We need service role key for admin operations
// For now, let's try with anon key and see what we can do
const setupTables = async () => {
  console.log('Setting up Supabase tables...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Read the SQL setup script
    const sqlScript = readFileSync(`${__dirname}/supabase-setup.sql`, 'utf8')
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Try to execute some basic statements that might work with anon key
    const basicStatements = statements.filter(stmt => 
      stmt.toLowerCase().includes('create table') ||
      stmt.toLowerCase().includes('alter table') ||
      stmt.toLowerCase().includes('create index')
    )
    
    console.log('Attempting to create tables...')
    
    for (const statement of basicStatements) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
        if (error) {
          console.log(`Statement failed: ${statement.substring(0, 50)}... - ${error.message}`)
        } else {
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`)
        }
      } catch (err) {
        console.log(`Error executing: ${statement.substring(0, 50)}... - ${err.message}`)
      }
    }
    
    console.log('\nNote: Some SQL operations require service role key.')
    console.log('Please run the remaining SQL manually in Supabase SQL Editor.')
    
    // Let's try to insert profiles using the auth users we created
    console.log('\nCreating profiles for demo users...')
    
    // Get the current user (should be the last one we created)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('Current user:', user.email)
      
      // Try to create profile for this user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          role: user.user_metadata?.role || 'CLIENT',
          is_active: true
        })
        .select()
      
      if (profileError) {
        console.log('Profile creation failed:', profileError.message)
      } else {
        console.log('✅ Profile created:', profileData)
      }
    }
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

setupTables()