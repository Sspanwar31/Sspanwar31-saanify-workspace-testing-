import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { format } from 'date-fns'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Simple token verification function (replaces the deleted tokens library)
const verifyAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'saanify',
      audience: 'saanify-users'
    }) as any

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyAccessToken(token)
    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { format: exportFormat, filters } = body

    if (!exportFormat || !['csv', 'json', 'xlsx'].includes(exportFormat)) {
      return NextResponse.json(
        { error: 'Invalid export format. Supported formats: csv, json, xlsx' },
        { status: 400 }
      )
    }

    const customers = await db.user.findMany({
      where: {
        role: 'CLIENT',
        ...(filters?.status && filters.status !== 'all' && {
          isActive: filters.status === 'active'
        }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')

    if (exportFormat === 'csv') {
      const csvHeaders = ['ID', 'Name', 'Email', 'Status', 'Role', 'Created At', 'Last Login']
      const csvRows = customers.map(customer => [
        customer.id,
        customer.name || '',
        customer.email,
        customer.isActive ? 'Active' : 'Inactive',
        customer.role,
        format(new Date(customer.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        customer.lastLoginAt ? format(new Date(customer.lastLoginAt), 'yyyy-MM-dd HH:mm:ss') : 'Never'
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers_export_${timestamp}.csv"`
        }
      })
    }

    if (exportFormat === 'json') {
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalCustomers: customers.length,
        customers: customers.map(customer => ({
          ...customer,
          status: customer.isActive ? 'Active' : 'Inactive',
          createdAt: format(new Date(customer.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          lastLoginAt: customer.lastLoginAt ? format(new Date(customer.lastLoginAt), 'yyyy-MM-dd HH:mm:ss') : null
        }))
      }

      return NextResponse.json(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="customers_export_${timestamp}.json"`
        }
      })
    }

    return NextResponse.json(
      { error: 'Export format not implemented yet' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error exporting customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}