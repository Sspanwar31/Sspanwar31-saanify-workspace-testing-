import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/tokens'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

// SuperAdmin only automation endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    // Verify SuperAdmin authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - SuperAdmin access required' 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyAccessToken(token)
    
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 })
    }

    // Verify user is SuperAdmin
    const user = await db.user.findUnique({
      where: { id: (decoded as any).userId },
      select: { role: true }
    })

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - SuperAdmin privileges required' 
      }, { status: 403 })
    }

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
}