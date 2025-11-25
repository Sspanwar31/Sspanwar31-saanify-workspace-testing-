import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`Updating client ${id} with data:`, body)

    // Update client in society account
    const updatedClient = await db.societyAccount.update({
      where: { id },
      data: body
    })

    console.log('Updated client:', updatedClient)

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    })

  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json(
      { error: 'Failed to update client: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`Deleting client: ${id}`)

    // Delete society account
    await db.societyAccount.delete({
      where: { id }
    })

    console.log('Client deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client: ' + error.message },
      { status: 500 }
    )
  }
}