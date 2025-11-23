import { createClient } from '@supabase/supabase-js'

// Full admin client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Example: create superadmins table
export const createTables = async () => {
  await supabase.rpc('create_superadmins_table')
  await supabase.rpc('create_clients_table')
  await supabase.rpc('create_sessions_table')
}

// Example: run a backup task
export const runBackup = async () => {
  const { data, error } = await supabase.from('automation_tasks').insert([
    { task_name: 'backup-now', status: 'running', started_at: new Date() }
  ])
  return { data, error }
}
