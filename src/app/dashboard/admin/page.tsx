'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Home, Users, Settings, BarChart3, Shield, Crown, LogOut, AlertTriangle, 
  TrendingUp, Search, Filter, Plus, Lock, Unlock, RefreshCw, Eye, Edit, Trash2,
  CreditCard, Calendar, Mail, Bell, Database, Download, Upload, ChevronDown,
  Activity, DollarSign, UserCheck, UserX, Clock, CheckCircle, XCircle, Zap,
  Globe, Smartphone, Tablet, Monitor, Menu, X, Maximize2, Minimize2, Play
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { ActivityMonitor } from '@/components/activity-monitor'
import { DataCharts } from '@/components/data-charts'
import { RealTimeNotifications } from '@/components/real-time-notifications'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { AdminSettings } from '@/components/admin-settings'

// --- CONSTANT DATA FOR AUTOMATION (ADDED) ---
const DB_TASKS_DATA = [
  { "idx": 0, "id": "1493c7d4-2d7b-4d7c-983d-d16c249f7799", "task_name": "schema-sync", "description": "Sync database schema changes automatically", "schedule": "0 */6 * * *", "enabled": true, "last_run_status": "Success" },
  { "idx": 1, "id": "b1ab0b6b-db3b-45d3-8da2-87e0a41d8991", "task_name": "database-restore", "description": "Restore database from backup files", "schedule": "manual", "enabled": true, "last_run_status": null },
  { "idx": 2, "id": "b975d726-644c-407a-9bd0-0f2ae339acea", "task_name": "database-backup", "description": "Create secure database backups to Supabase Storage", "schedule": "manual", "enabled": true, "last_run_status": "Success" },
  { "idx": 3, "id": "cc372267-4337-4712-a7aa-b5b8c3004a98", "task_name": "auto-sync", "description": "Scheduled data synchronization", "schedule": "0 */2 * * *", "enabled": true, "last_run_status": "Failed" },
  { "idx": 4, "id": "d9f51dc4-cf71-4d34-9c62-5df89b238b66", "task_name": "health-check", "description": "Monitor system health and Supabase connectivity", "schedule": "*/5 * * * *", "enabled": true, "last_run_status": "Success" }
];

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [activeModule, setActiveModule] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { checkSession } = await import('@/lib/auth')
        const session = await checkSession()
        
        if (!session.authenticated || session.user?.role !== 'SUPER_ADMIN') {
          window.location.href = '/'
          return
        }
        
        setUserData(session.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        window.location.href = '/'
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      const { logout } = await import('@/lib/auth')
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
              <Crown className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Saanify Stallone</h1>
          <p className="text-cyan-400">Initializing Super Admin Suite...</p>
        </motion.div>
      </div>
    )
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'clients', label: 'Client Management', icon: Users },
    { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'activity', label: 'Activity Monitor', icon: Shield },
    { id: 'data-charts', label: 'Data Visualization', icon: BarChart3 },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ]

  const renderContent = () => {
    switch (activeModule) {
      case 'clients':
        return <ClientManagement />
      case 'billing':
        return <SubscriptionBilling />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'activity':
        return <ActivityMonitor />
      case 'data-charts':
        return <DataCharts />
      case 'automation':
        return <AutomationNotifications />
      case 'settings':
        return <SystemSettings />
      default:
        return <OverviewDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">Saanify</span>
                  <span className="text-xs text-cyan-400 ml-2">Stallone</span>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealTimeNotifications />
              
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-full border border-cyan-500/30">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">Super Admin</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {(userData?.name?.charAt(0) ?? "S").toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-white/10">
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-red-400 hover:bg-white/10" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ 
            x: isMobileMenuOpen ? 0 : -300,
            transition: { type: "spring", stiffness: 300, damping: 30 }
          }}
          className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 backdrop-blur-xl bg-white/5 border-r border-white/10 z-40 lg:translate-x-0 lg:static lg:block"
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeModule === item.id ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 ${
                    activeModule === item.id
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => {
                    setActiveModule(item.id)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* Quick Stats */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-3">System Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Active Clients</span>
                    <span className="text-cyan-400 font-bold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Revenue</span>
                    <span className="text-green-400 font-bold">$45.2K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Uptime</span>
                    <span className="text-emerald-400 font-bold">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  )

  // Overview Dashboard Component
  function OverviewDashboard() {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Stallone</span>
          </h1>
          <p className="text-white/60 text-lg">Super Admin Suite - Complete Control Center</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Clients', value: '24', change: '+12%', icon: Users, color: 'from-blue-500 to-cyan-500' },
            { title: 'Active Trials', value: '8', change: '+3', icon: Clock, color: 'from-purple-500 to-pink-500' },
            { title: 'Revenue', value: '$45.2K', change: '+23%', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
            { title: 'Server Load', value: '32%', change: '-5%', icon: Activity, color: 'from-orange-500 to-red-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                      {stat.change}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-white/60 text-sm">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew Subscriptions
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                <Mail className="h-4 w-4 mr-2" />
                Send Notifications
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'New client registered', user: 'john.doe@company.com', time: '2 min ago', status: 'success' },
                  { action: 'Subscription renewed', user: 'jane.smith@corp.com', time: '15 min ago', status: 'success' },
                  { action: 'Trial ending soon', user: 'mike@startup.com', time: '1 hour ago', status: 'warning' },
                  { action: 'Payment failed', user: 'sarah@business.com', time: '2 hours ago', status: 'error' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-400' :
                        activity.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <p className="text-white text-sm">{activity.action}</p>
                        <p className="text-white/60 text-xs">{activity.user}</p>
                      </div>
                    </div>
                    <span className="text-white/40 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Client Management Component
  function ClientManagement() {
    const [clients] = useState([
      { id: 1, name: 'Acme Corporation', email: 'admin@acme.com', plan: 'Pro', status: 'active', renewDate: '2024-12-15', users: 45 },
      { id: 2, name: 'TechStart Inc', email: 'contact@techstart.com', plan: 'Basic', status: 'trial', renewDate: '2024-11-20', users: 12 },
      { id: 3, name: 'Global Enterprises', email: 'it@global.com', plan: 'Enterprise', status: 'active', renewDate: '2025-01-10', users: 120 },
      { id: 4, name: 'StartupHub', email: 'hello@startuphub.com', plan: 'Trial', status: 'expired', renewDate: '2024-10-30', users: 8 },
      { id: 5, name: 'MegaCorp', email: 'systems@megacorp.com', plan: 'Pro', status: 'locked', renewDate: '2024-11-05', users: 67 }
    ])

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'trial': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'locked': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }
    }

    const getPlanColor = (plan: string) => {
      switch (plan) {
        case 'Enterprise': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        case 'Pro': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        case 'Basic': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        case 'Trial': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Client Management</h2>
            <p className="text-white/60">Manage all society clients and their subscriptions</p>
          </div>
          <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/40"
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Filter className="h-4 w-4 mr-2" />
                      {selectedFilter === 'all' ? 'All Status' : selectedFilter}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-white/10">
                    <DropdownMenuItem onClick={() => setSelectedFilter('all')} className="text-white hover:bg-white/10">
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter('active')} className="text-white hover:bg-white/10">
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter('trial')} className="text-white hover:bg-white/10">
                      Trial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter('expired')} className="text-white hover:bg-white/10">
                      Expired
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedFilter('locked')} className="text-white hover:bg-white/10">
                      Locked
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60 font-medium">Client</th>
                    <th className="text-left p-4 text-white/60 font-medium">Plan</th>
                    <th className="text-left p-4 text-white/60 font-medium">Status</th>
                    <th className="text-left p-4 text-white/60 font-medium">Users</th>
                    <th className="text-left p-4 text-white/60 font-medium">Renewal</th>
                    <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{client.name}</p>
                          <p className="text-white/60 text-sm">{client.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getPlanColor(client.plan)}>
                          {client.plan}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-white">{client.users}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-white/80">{client.renewDate}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-white/10">
                              <DropdownMenuItem className="text-white hover:bg-white/10">
                                <Lock className="h-4 w-4 mr-2" />
                                Lock Client
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-white/10">
                                <Unlock className="h-4 w-4 mr-2" />
                                Unlock Client
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-white/10">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Renew Subscription
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem className="text-red-400 hover:bg-white/10">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Subscription & Billing Component
  function SubscriptionBilling() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Subscription & Billing</h2>
          <p className="text-white/60">Manage plans, revenue, and client subscriptions</p>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-white/60">Revenue Chart Placeholder</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { plan: 'Enterprise', count: 3, revenue: '$15,000', color: 'bg-purple-500' },
                  { plan: 'Pro', count: 12, revenue: '$24,000', color: 'bg-cyan-500' },
                  { plan: 'Basic', count: 6, revenue: '$6,000', color: 'bg-blue-500' },
                  { plan: 'Trial', count: 3, revenue: '$0', color: 'bg-gray-500' }
                ].map((item) => (
                  <div key={item.plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-white">{item.plan}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{item.count} clients</p>
                      <p className="text-white/60 text-sm">{item.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { client: 'Acme Corporation', amount: '$299', plan: 'Pro', date: '2024-11-01', status: 'completed' },
                { client: 'TechStart Inc', amount: '$99', plan: 'Basic', date: '2024-11-01', status: 'completed' },
                { client: 'Global Enterprises', amount: '$599', plan: 'Enterprise', date: '2024-10-31', status: 'completed' },
                { client: 'StartupHub', amount: '$0', plan: 'Trial', date: '2024-10-30', status: 'pending' }
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">{transaction.client}</p>
                    <p className="text-white/60 text-sm">{transaction.plan} • {transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{transaction.amount}</p>
                    <Badge className={transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Analytics Dashboard Component
  function AnalyticsDashboard() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-white/60">Real-time insights and performance metrics</p>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Client Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-white/60">Growth Chart Placeholder</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-white/60">Revenue Chart Placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Daily Active Users', value: '1,234', change: '+12%', icon: Users },
            { title: 'Conversion Rate', value: '23%', change: '+3%', icon: TrendingUp },
            { title: 'Avg. Session Time', value: '8m 42s', change: '+1m', icon: Clock },
            { title: 'Server Response', value: '124ms', change: '-15ms', icon: Activity }
          ].map((metric, index) => (
            <Card key={metric.title} className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="h-5 w-5 text-cyan-400" />
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    {metric.change}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white">{metric.value}</h3>
                <p className="text-white/60 text-sm">{metric.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // --- UPDATED AUTOMATION COMPONENT ---
  function AutomationNotifications() {
    const [dbTasks, setDbTasks] = useState(DB_TASKS_DATA);
    const [activeTab, setActiveTab] = useState("system"); // 'system' or 'communication'

    // Handler: Toggle Enable/Disable
    const toggleTask = (id: string) => {
      setDbTasks(dbTasks.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
      // Here you would add your API call: await supabase.from('tasks').update(...)
    };

    // Handler: Run Now
    const runTask = (taskName: string) => {
      // Simulate API Call
      alert(`Triggering Edge Function for: ${taskName}`);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Automation Center</h2>
            <p className="text-white/60">Manage system tasks, crons, and communication workflows</p>
          </div>
          
          {/* Sub-Tabs for Automation */}
          <div className="bg-white/5 p-1 rounded-lg flex gap-2 border border-white/10">
            <button 
              onClick={() => setActiveTab("system")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              System Tasks
            </button>
            <button 
              onClick={() => setActiveTab("communication")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'communication' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              Communications
            </button>
          </div>
        </div>

        {/* TAB 1: SYSTEM TASKS (The JSON Data you provided) */}
        {activeTab === "system" && (
          <div className="grid grid-cols-1 gap-6">
             <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-400" />
                  Database & Cron Jobs
                </CardTitle>
                <CardDescription className="text-white/40">
                  Direct control over Supabase edge functions and maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dbTasks.map((task) => (
                    <div key={task.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      
                      {/* Info Section */}
                      <div className="flex items-start gap-4 mb-4 md:mb-0 flex-1">
                        <div className={`p-3 rounded-lg ${task.enabled ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-500/10 text-gray-500'}`}>
                          {task.task_name.includes('backup') || task.task_name.includes('restore') ? <Database size={20} /> : 
                           task.task_name.includes('health') ? <Activity size={20} /> : <RefreshCw size={20} />}
                        </div>
                        <div>
                          <h4 className="text-white font-medium flex items-center gap-2">
                            {task.task_name}
                            <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] font-normal">
                              {task.schedule}
                            </Badge>
                          </h4>
                          <p className="text-white/50 text-sm mt-1">{task.description}</p>
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        {/* Status Badge */}
                        <div className="text-right mr-2">
                          <span className="text-[10px] text-white/30 block uppercase tracking-wider mb-1">Last Run</span>
                          <Badge className={`${
                            !task.last_run_status ? 'bg-gray-500/20 text-gray-400' :
                            task.last_run_status === 'Success' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 
                            'bg-red-500/20 text-red-400 border-red-500/20'
                          }`}>
                            {task.last_run_status || 'PENDING'}
                          </Badge>
                        </div>

                        {/* Toggle Button */}
                        <Button
                          onClick={() => toggleTask(task.id)}
                          size="icon"
                          variant="ghost"
                          className={`${task.enabled ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10' : 'text-white/20 hover:text-white hover:bg-white/10'}`}
                          title={task.enabled ? "Disable Task" : "Enable Task"}
                        >
                          <Zap className={`h-5 w-5 ${task.enabled ? 'fill-current' : ''}`} />
                        </Button>

                        {/* Run Button */}
                        <Button 
                          onClick={() => runTask(task.task_name)}
                          size="sm" 
                          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-900/20 border-0"
                        >
                          <Play className="h-3 w-3 mr-2 fill-current" />
                          Run Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: COMMUNICATIONS (Existing Data) */}
        {activeTab === "communication" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  Email Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'Welcome Email', status: 'Active', sent: '24', pending: '0' },
                    { type: 'Trial Expiry Reminder', status: 'Active', sent: '12', pending: '3' },
                    { type: 'Payment Failed', status: 'Active', sent: '2', pending: '1' },
                    { type: 'Renewal Reminder', status: 'Paused', sent: '8', pending: '5' }
                  ].map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{email.type}</p>
                        <p className="text-white/60 text-sm">Sent: {email.sent} | Pending: {email.pending}</p>
                      </div>
                      <Badge className={email.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {email.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { event: 'New Client Signup', enabled: true, lastTriggered: '2 hours ago' },
                    { event: 'Subscription Renewed', enabled: true, lastTriggered: '1 day ago' },
                    { event: 'Payment Failed', enabled: true, lastTriggered: '3 days ago' },
                    { event: 'System Maintenance', enabled: false, lastTriggered: '1 week ago' }
                  ].map((notification, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{notification.event}</p>
                        <p className="text-white/60 text-sm">Last: {notification.lastTriggered}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={notification.enabled ? "default" : "outline"}
                        className={notification.enabled ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "border-white/20 text-white hover:bg-white/10"}
                      >
                        {notification.enabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // System Settings Component
  function SystemSettings() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Settings</h2>
          <p className="text-white/60">Configure system preferences and administrative settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Admin Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Super Admin', email: 'admin@saanify.com', role: 'Super Admin', status: 'Active' },
                  { name: 'John Doe', email: 'john@saanify.com', role: 'Admin', status: 'Active' },
                  { name: 'Jane Smith', email: 'jane@saanify.com', role: 'Admin', status: 'Inactive' }
                ].map((admin, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">{admin.name}</p>
                      <p className="text-white/60 text-sm">{admin.email} • {admin.role}</p>
                    </div>
                    <Badge className={admin.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {admin.status}
                    </Badge>
                  </div>
                ))}
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Admin
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-400" />
                Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Last Backup</span>
                    <span className="text-cyan-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Size</span>
                    <span className="text-white/60 text-sm">124 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Location</span>
                    <span className="text-white/60 text-sm">GitHub + Local</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
                    <Download className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                  <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                    <Upload className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-400" />
              Global Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { setting: 'Trial Duration', value: '15 days', type: 'number' },
                { setting: 'Max Users (Basic)', value: '25', type: 'number' },
                { setting: 'Max Users (Pro)', value: '100', type: 'number' },
                { setting: 'Auto-Renewal', value: 'Enabled', type: 'toggle' },
                { setting: 'Email Notifications', value: 'Enabled', type: 'toggle' },
                { setting: 'Maintenance Mode', value: 'Disabled', type: 'toggle' }
              ].map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/5">
                  <label className="text-white/60 text-sm">{item.setting}</label>
                  <div className="mt-1">
                    {item.type === 'toggle' ? (
                      <Button
                        size="sm"
                        variant={item.value === 'Enabled' ? 'default' : 'outline'}
                        className={item.value === 'Enabled' ? 'bg-green-500 hover:bg-green-600' : 'border-white/20 text-white hover:bg-white/10'}
                      >
                        {item.value}
                      </Button>
                    ) : (
                      <Input
                        value={item.value}
                        className="bg-white/10 border-white/20 text-white"
                        readOnly
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
