import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Direct database update without authentication for immediate fix
    console.log('🔧 Starting direct database fix for payment proof URLs...')
    
    // Update the specific problematic records
    const update1 = await db.pendingPayment.updateMany({
      where: { 
        screenshotUrl: { contains: '1764338893228_Screenshot (1).png' }
      },
      data: { 
        screenshotUrl: '/uploads/payment-proofs/1764338893228_Screenshot_1.png'
      }
    })
    
    const update2 = await db.pendingPayment.updateMany({
      where: { 
        screenshotUrl: { contains: '1764313897781_Screenshot (4).png' }
      },
      data: { 
        screenshotUrl: '/uploads/payment-proofs/1764313897781_Screenshot_4.png'
      }
    })
    
    console.log(`✅ Updated ${update1.count} records for 1764338893228`)
    console.log(`✅ Updated ${update2.count} records for 1764313897781`)
    
    const totalUpdated = update1.count + update2.count
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${totalUpdated} payment proof URLs`,
      update1Count: update1.count,
      update2Count: update2.count,
      totalUpdated
    })

  } catch (error) {
    console.error('❌ Error updating payment proof URLs:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}