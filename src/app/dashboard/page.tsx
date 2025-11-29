'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Crown, Users, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if user has trial or subscription
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null
  const subscriptionEndsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null
  const now = new Date()

  const isTrialActive = trialEndsAt && trialEndsAt > now
  const isSubscriptionActive = subscriptionEndsAt && subscriptionEndsAt > now
  const hasActiveAccess = isTrialActive || isSubscriptionActive

  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (!hasActiveAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Subscription Expired</CardTitle>
              <CardDescription className="text-purple-200">
                Your access has expired. Please renew your subscription to continue using Saanify.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/client/subscription/upgrade">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3">
                  Renew Subscription
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-purple-200">
                Manage your finance society with ease
              </p>
            </div>
            
            {/* Status Badge */}
            <div className="text-right">
              {isTrialActive && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-sm px-4 py-2">
                  <Clock className="w-4 h-4 mr-2" />
                  TRIAL - {daysLeft} days left
                </Badge>
              )}
              {isSubscriptionActive && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-sm px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ACTIVE
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Members',
              value: '156',
              change: '+12%',
              icon: Users,
              color: 'from-blue-500 to-cyan-500'
            },
            {
              title: 'Monthly Revenue',
              value: '₹2.4L',
              change: '+8%',
              icon: TrendingUp,
              color: 'from-green-500 to-emerald-500'
            },
            {
              title: 'Active Loans',
              value: '23',
              change: '+3',
              icon: Crown,
              color: 'from-purple-500 to-pink-500'
            },
            {
              title: 'Pending Tasks',
              value: '7',
              change: '-2',
              icon: Calendar,
              color: 'from-orange-500 to-red-500'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-purple-200 text-sm">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
              <CardDescription className="text-purple-200">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Manage Members',
                    description: 'Add, edit, or remove members',
                    icon: Users,
                    href: '/dashboard/client/members'
                  },
                  {
                    title: 'View Loans',
                    description: 'Manage loan applications',
                    icon: Crown,
                    href: '/dashboard/client/loans'
                  },
                  {
                    title: 'Financial Reports',
                    description: 'View financial analytics',
                    icon: TrendingUp,
                    href: '/dashboard/client/reports'
                  },
                  {
                    title: 'Settings',
                    description: 'Manage your account',
                    icon: Calendar,
                    href: '/dashboard/client/profile'
                  }
                ].map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                          <action.icon className="w-5 h-5 text-purple-300" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-white font-medium mb-1">{action.title}</h4>
                      <p className="text-purple-200 text-sm">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trial Notification */}
        {isTrialActive && daysLeft <= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Trial Ending Soon</h3>
                    <p className="text-yellow-200">
                      Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. 
                      Upgrade to continue using all features.
                    </p>
                  </div>
                  <Link href="/client/subscription/upgrade">
                    <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}