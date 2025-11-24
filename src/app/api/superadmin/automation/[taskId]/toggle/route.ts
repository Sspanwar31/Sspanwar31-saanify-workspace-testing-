import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

// SuperAdmin only automation endpoint
export const POST = withAdmin(async (
  request: NextRequest,
  { params }: { params: { taskId: string } }
) => {
  try {
    const { taskId } = params

    // Get request body
    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'enabled field is required and must be boolean' 
      }, { status: 400 })
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update task status in database
    const { data, error } = await supabase
      .from('automation_tasks')
      .update({ 
        enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()

    if (error) {
      console.error('Task toggle error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to toggle task status' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Task ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: { taskId, enabled }
    })

  } catch (error) {
    console.error('Task toggle error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during task toggle' 
    }, { status: 500 })
  }
})