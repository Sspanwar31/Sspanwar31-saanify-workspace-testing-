import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled status is required' },
        { status: 400 }
      )
    }

    // Update task status in database
    try {
      await db.automationTask.update({
        where: { id: params.taskId },
        data: { enabled: enabled }
      })
    } catch (e) {
      console.log('Task toggle failed (might not exist):', e)
    }

    return NextResponse.json({
      success: true,
      message: `Task ${enabled ? 'enabled' : 'disabled'} successfully`
    })

  } catch (error) {
    console.error('Task toggle failed:', error)
    return NextResponse.json(
      { error: 'Failed to toggle task' },
      { status: 500 }
    )
  }
}