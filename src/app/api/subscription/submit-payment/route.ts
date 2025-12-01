import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const planId = formData.get('planId') as string
    const planName = formData.get('planName') as string
    const amount = formData.get('amount') as string
    const transactionId = formData.get('transactionId') as string
    const paymentDate = formData.get('paymentDate') as string
    const notes = formData.get('notes') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Payment proof file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDF are allowed' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `${transactionId}_${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // In a real implementation, save to database
    const paymentData = {
      id: timestamp.toString(),
      planId,
      planName,
      amount: parseInt(amount),
      transactionId,
      paymentDate,
      notes,
      proofFile: `/uploads/payment-proofs/${filename}`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }

    // For now, just log the data (in real implementation, save to DB)
    console.log('Payment submission:', paymentData)

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully',
      data: paymentData
    })

  } catch (error) {
    console.error('Error submitting payment proof:', error)
    return NextResponse.json(
      { error: 'Failed to submit payment proof' },
      { status: 500 }
    )
  }
}