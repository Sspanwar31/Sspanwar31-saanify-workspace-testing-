import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get system analytics (Admin only)
export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    // Get user statistics
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      clientUsers,
      recentUsers
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: 'SUPER_ADMIN' } }),
      db.user.count({ where: { role: 'CLIENT' } }),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    // Get society statistics
    const [
      totalSocieties,
      activeSocieties,
      trialSocieties,
      paidSocieties
    ] = await Promise.all([
      db.societyAccount.count(),
      db.societyAccount.count({ where: { isActive: true } }),
      db.societyAccount.count({ where: { subscriptionPlan: 'TRIAL' } }),
      db.societyAccount.count({
        where: {
          subscriptionPlan: { in: ['BASIC', 'PRO', 'ENTERPRISE'] }
        }
      })
    ])

    // Get login activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentLogins = await db.user.count({
      where: {
        lastLoginAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Calculate growth percentages
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const previousPeriodUsers = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    })

    const userGrowth = previousPeriodUsers > 0 
      ? ((recentUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          clients: clientUsers,
          recent: recentUsers,
          growth: Math.round(userGrowth * 10) / 10
        },
        societies: {
          total: totalSocieties,
          active: activeSocieties,
          trial: trialSocieties,
          paid: paidSocieties
        },
        activity: {
          recentLogins
        },
        timestamps: {
          generatedAt: new Date().toISOString(),
          period: 'last 30 days'
        }
      }
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
})