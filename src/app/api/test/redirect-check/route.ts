import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url)
  
  console.log(`🧪 Test endpoint accessed: ${pathname}`)
  
  // Check cookies
  const cookies = request.cookies.getAll()
  console.log('🍪 All cookies:', cookies.map(c => ({ name: c.name, value: c.value ? '***' : 'empty' })))
  
  const authToken = cookies.find(c => c.name === 'auth-token')
  console.log('🔐 Auth token found:', !!authToken)
  
  return NextResponse.json({
    message: 'Test endpoint working',
    pathname,
    hasAuth: !!authToken,
    timestamp: new Date().toISOString()
  })
}