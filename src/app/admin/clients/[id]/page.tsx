'use client'

import { useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Calendar, 
  CreditCard, 
  Users, 
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Building2,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  adminName: string
  email: string
  phone: string
  address?: string
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'LOCKED'
  subscriptionPlan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  trialEndsAt?: string
  subscriptionEndsAt?: string
  createdAt: string
  totalMembers?: number
  totalLoans?: number
  totalRevenue?: number
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRevenue, setShowRevenue] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    title: string
    description: string
  } | null>(null)
  const [renewDialog, setRenewDialog] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchClient()
    fetchUserData()
  }, [params.id])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/check-session')
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.user?.role === 'SUPER_ADMIN')
        
        // Load revenue preference for admins
        if (data.user?.role === 'SUPER_ADMIN') {
          const savedPreference = localStorage.getItem('revenue-visibility')
          if (savedPreference) {
            const preference = JSON.parse(savedPreference)
            setShowRevenue(preference.showRevenue)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
      toast.error('Failed to fetch client details')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast.success(`Client ${action} successfully`)
        fetchClient()
      } else {
        toast.error(`Failed to ${action} client`)
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleRenewal = async (plan: string) => {
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'renew', plan })
      })

      if (response.ok) {
        const result = await response.json()
        const newEndDate = result.client.subscriptionEndsAt
        
        toast.success('✅ Subscription renewed successfully', {
          description: `Subscription renewed till ${new Date(newEndDate).toLocaleDateString()}`,
          duration: 4000,
        })
        
        setRenewDialog(false)
        fetchClient() // Instant refresh
      } else {
        toast.error('Failed to renew subscription')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const toggleRevenue = (show: boolean) => {
    if (!isAdmin && show) {
      toast.error('Access Denied', {
        description: 'Only Super Admin can view revenue data.',
        duration: 3000,
      })
      return
    }
    
    setShowRevenue(show)
    
    // Save preference
    localStorage.setItem('revenue-visibility', JSON.stringify({
      showRevenue: show,
      requiresAdmin: true,
      lastUpdated: new Date().toISOString()
    }))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      TRIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200',
      ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200',
      EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200',
      LOCKED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200'
    }
    
    return (
      <Badge className={cn(variants[status as keyof typeof variants] || variants.TRIAL, 'font-medium text-sm px-3 py-1')}>
        {status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const variants = {
      TRIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200',
      BASIC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200',
      PRO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200',
      ENTERPRISE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200'
    }
    
    return (
      <Badge className={cn(variants[plan as keyof typeof variants] || variants.TRIAL, 'font-medium text-sm px-3 py-1')}>
        {plan}
      </Badge>
    )
  }

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return null
    
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return { days: diffDays, percentage: Math.max(0, Math.min(100, (diffDays / 365) * 100)) }
  }

  const getPlanPrice = (plan: string) => {
    const prices = {
      TRIAL: 0,
      BASIC: 99,
      PRO: 299,
      ENTERPRISE: 999
    }
    return prices[plan as keyof typeof prices] || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Client not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const subscriptionInfo = client.status === 'TRIAL' 
    ? getDaysLeft(client.trialEndsAt)
    : getDaysLeft(client.subscriptionEndsAt)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Clients
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {client.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {client.adminName} • {client.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(client.status)}
              {getPlanBadge(client.subscriptionPlan)}
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    Society Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                          <p className="font-medium text-slate-900 dark:text-white">{client.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                          <p className="font-medium text-slate-900 dark:text-white">{client.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Admin Name</p>
                          <p className="font-medium text-slate-900 dark:text-white">{client.adminName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                          <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                          <p className="font-medium text-slate-900 dark:text-white">{client.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subscription Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Current Plan</p>
                        <div className="flex items-center gap-3 mt-1">
                          {getPlanBadge(client.subscriptionPlan)}
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            ${getPlanPrice(client.subscriptionPlan)}/mo
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                        <div className="mt-1">
                          {getStatusBadge(client.status)}
                        </div>
                      </div>
                    </div>

                    {subscriptionInfo && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Time Remaining</p>
                          <span className="text-lg font-semibold text-slate-900 dark:text-white">
                            {subscriptionInfo.days} days
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionInfo.percentage} 
                          className="h-3"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Started On</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {client.status === 'TRIAL' ? 'Trial Ends' : 'Renews On'}
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {client.status === 'TRIAL' && client.trialEndsAt
                            ? new Date(client.trialEndsAt).toLocaleDateString()
                            : client.subscriptionEndsAt
                            ? new Date(client.subscriptionEndsAt).toLocaleDateString()
                            : 'Not set'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5" />
                    Society Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {client.totalMembers || 0}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Members</p>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <FileText className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {client.totalLoans || 0}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Loans</p>
                    </motion.div>
                    
                    {showRevenue && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                      >
                        <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          ${client.totalRevenue || 0}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                      </motion.div>
                    )}
                  </div>
                  
                  {!showRevenue && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowRevenue(true)}
                        className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Show Revenue Data
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button
                    onClick={() => setRenewDialog(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew Subscription
                  </Button>
                  
                  {client.status === 'ACTIVE' ? (
                    <Button
                      onClick={() => setConfirmDialog({
                        open: true,
                        action: 'lock',
                        title: 'Lock Account',
                        description: 'Are you sure you want to lock this account?'
                      })}
                      variant="outline"
                      className="w-full border-amber-600 text-amber-600 hover:bg-amber-50"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Account
                    </Button>
                  ) : client.status === 'LOCKED' ? (
                    <Button
                      onClick={() => setConfirmDialog({
                        open: true,
                        action: 'unlock',
                        title: 'Unlock Account',
                        description: 'Are you sure you want to unlock this account?'
                      })}
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Account
                    </Button>
                  ) : null}
                  
                  <Button
                    onClick={() => setConfirmDialog({
                      open: true,
                      action: 'expire',
                      title: 'Mark as Expired',
                      description: 'Are you sure you want to mark this subscription as expired?'
                    })}
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mark as Expired
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue Toggle for Admins */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group"
              >
                <Card className="border-2 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5" />
                      Revenue Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Show Revenue Details
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {showRevenue ? 'Revenue data is visible' : 'Revenue data is hidden'}
                        </p>
                      </div>
                      
                      <Button
                        variant={showRevenue ? "default" : "outline"}
                        onClick={() => toggleRevenue(!showRevenue)}
                        className={cn(
                          "transition-all duration-200",
                          showRevenue 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                            : "text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        {showRevenue ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Hide Revenue
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Show Revenue
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showRevenue && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                      >
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                              Monthly Revenue
                            </span>
                            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                              ${getPlanPrice(client.subscriptionPlan)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Account Health */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Activity className="h-5 w-5" />
                    Account Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {client.status === 'ACTIVE' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : client.status === 'TRIAL' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {client.status === 'ACTIVE' ? 'Healthy' :
                           client.status === 'TRIAL' ? 'Trial Period' :
                           client.status === 'EXPIRED' ? 'Expired' : 'Locked'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {client.status === 'ACTIVE' ? 'Account is in good standing' :
                           client.status === 'TRIAL' ? 'Trial period active' :
                           client.status === 'EXPIRED' ? 'Subscription has expired' : 'Account is locked'}
                        </p>
                      </div>
                    </div>
                    
                    {subscriptionInfo && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Subscription Health</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {subscriptionInfo.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionInfo.percentage} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogDescription>
                  {confirmDialog.description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleAction(confirmDialog.action)
                  setConfirmDialog(null)
                }}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Renewal Dialog */}
        <Dialog open={renewDialog} onOpenChange={setRenewDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Renew Subscription</DialogTitle>
              <DialogDescription>
                Choose a new subscription plan for {client.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {['BASIC', 'PRO', 'ENTERPRISE'].map((plan) => (
                <div
                  key={plan}
                  onClick={() => handleRenewal(plan)}
                  className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {plan}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {plan === 'BASIC' ? '1 month' : plan === 'PRO' ? '3 months' : '12 months'} • ${getPlanPrice(plan)}/month
                      </div>
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      ${getPlanPrice(plan)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenewDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}