'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  LogOut,
  Home,
  BarChart3,
  DollarSign,
  Shield,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  UserCheck,
  Calendar,
  FileText,
  Lock,
  Unlock,
  Crown,
  CreditCard,
  Activity,
  Phone,
  MapPin,
  Globe,
  Mail,
  Star,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Enhanced stats
  const stats = {
    totalClients: 156,
    activeClients: 89,
    totalRevenue: 4520000,
    monthlyRevenue: 450000,
    totalMembers: 2456,
    activeMembers: 2100,
    totalSocieties: 89,
    pendingRequests: 12,
    totalExpenses: 125000,
    totalLoans: 890000,
    totalPassbooks: 56
  }

  // Enhanced clients data with more details
  const clients = [
    { 
      id: 1, 
      name: 'Green Valley Society', 
      email: 'admin@greenvalley.com', 
      phone: '+91 98765 43210',
      address: '123 Green Valley Road, Bangalore, Karnataka',
      status: 'ACTIVE', 
      plan: 'PRO', 
      members: 245,
      revenue: 125000,
      expenses: 45000,
      loans: 89000,
      passbooks: 12,
      joinDate: '2024-01-15',
      lastLogin: '2024-01-30',
      subscriptionEndsAt: '2024-12-31',
      created: '2024-01-15'
    },
    { 
      id: 2, 
      name: 'Sunset Apartments', 
      email: 'admin@sunsetapartments.com', 
      phone: '+91 98765 43211',
      address: '456 Sunset Boulevard, Mumbai, Maharashtra',
      status: 'TRIAL', 
      plan: 'TRIAL', 
      members: 156,
      revenue: 0,
      expenses: 12000,
      loans: 0,
      passbooks: 8,
      joinDate: '2024-01-20',
      subscriptionEndsAt: '2024-02-20',
      created: '2024-01-20'
    },
    { 
      id: 3, 
      name: 'Royal Residency', 
      email: 'admin@royalresidency.com', 
      phone: '+91 98765 43212',
      address: '789 Royal Street, Delhi',
      status: 'EXPIRED', 
      plan: 'BASIC', 
      members: 89,
      revenue: 45000,
      expenses: 35000,
      loans: 15000,
      passbooks: 5,
      joinDate: '2023-12-01',
      subscriptionEndsAt: '2024-01-31',
      created: '2023-12-01'
    },
    {
      id: 4, 
      name: 'Blue Sky Heights', 
      email: 'admin@blueskyheights.com', 
      phone: '+91 98765 43213',
      address: '321 Blue Sky Avenue, Pune',
      status: 'LOCKED', 
      plan: 'ENTERPRISESE', 
      members: 312,
      revenue: 280000,
      expenses: 95000,
      loans: 200000,
      passbooks: 15,
      joinDate: '2024-01-10',
      subscriptionEndsAt: '2024-06-30',
      created: '2024-01-10'
    }
  ]

  const recentActivities = [
    { id: 1, type: 'client_registered', client: 'Green Valley Society', time: '2 hours ago', icon: Users },
    { id: 2, type: 'payment_received', client: 'Sunset Apartments', time: '4 hours ago', icon: DollarSign },
    { id: 3, type: 'client_upgraded', client: 'Royal Residency', time: '6 hours ago', icon: TrendingUp },
    { id: 4, type: 'new_member', client: 'Blue Sky Heights', time: '8 hours ago', icon: UserCheck },
    { id: 5, type: 'expense_added', client: 'Green Valley Society', time: '10 hours ago', icon: FileText },
    { id: 6, type: 'loan_approved', client: 'Sunset Apartments', time: '12 hours ago', icon: CreditCard }
  ]

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus
    const matchesPlan = selectedPlan === 'all' || client.plan === selectedPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  const handleViewClient = (clientId: number) => {
    // In real app, this would navigate to client details page
    console.log(`Viewing client details for ID: ${clientId}`)
    toast.success(`Opening client details for ${clients.find(c => c.id === clientId)?.name || 'Unknown Client'}`)
  }

  const handleEditClient = (clientId: number) => {
    // In real app, this would open edit modal
    console.log(`Edit client functionality for ID: ${clientId}`)
    toast.info(`Edit client ${clients.find(c => c.id === clientId)?.name || 'Unknown Client'}`)
  }

  const handleDeleteClient = (clientId: number) => {
    // In real app, this would show confirmation dialog
    console.log(`Delete client ${clients.find(c => c.id === clientId)?.name || 'Unknown Client'}`)
    toast.success(`Client ${clients.find(c => c.id === clientId)?.name || 'Unknown Client'} deleted successfully`)
  }

  const handleLockClient = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      const newStatus = client.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
      console.log(`${newStatus === 'ACTIVE' ? 'Client unlocked' : 'Client locked'}`)
      toast.success(`Client ${client.name} ${newStatus.toLowerCase()}`)
    }
  }

  const handleUnlockClient = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    if (client && client.status === 'LOCKED') {
      console.log(`Unlocking client: ${client.name}`)
      toast.success(`Client ${client.name} unlocked successfully`)
    }
  }

  const handleExpireClient = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    if (client && client.status !== 'EXPIRED') {
      console.log(`Expiring client: ${client.name}`)
      toast.success(`Client ${client.name} expired`)
    }
  }

  const handleAddClient = () => {
    // In real app, this would open add client modal
    console.log('Add new client functionality')
    toast.info('Add client feature coming soon')
  }

  const handleExportData = (format: 'csv' | 'pdf') => {
    console.log(`Exporting data as ${format.toUpperCase()}`)
    toast.success(`Exporting data as ${format.toUpperCase()}`)
  }

  const handleRefreshData = () => {
    console.log('Refreshing data...')
    toast.success('Data refreshed successfully')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your entire platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleRefreshData}>
              <RefreshCw className={`h-4 w-4 mr-2 ${false ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportData('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => window.location.href = '/login'}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-blue-100">Total societies</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Building2 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeClients}</div>
                <p className="text-xs text-green-100">Currently active</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
                <p className="text-xs text-purple-100">All time revenue</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <BarChart3 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</div>
                <p className="text-xs text-orange-100">This month</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <activity.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {activity.client} • {activity.time}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date().toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => window.location.href = '/client/dashboard'}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Client Panel
                    </Button>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => toast.info('Analytics feature coming soon')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => toast.info('Reports feature coming soon')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Reports
                    </Button>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => toast.info('Settings feature coming soon')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab - Enhanced */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Management</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button onClick={() => window.location.href = '/client/dashboard'}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Client Panel
                    </Button>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="px-3 py-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Plans</option>
                    <option value="TRIAL">Trial</option>
                    <option value="BASIC">Basic</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISESE">Enterprise</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Plan</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Members</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Revenue</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{client.email}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              client.status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                              client.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {client.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              client.plan === 'PRO' ? 'bg-purple-100 text-purple-800' :
                              client.plan === 'ENTERPRISESE' ? 'bg-orange-100 text-orange-800' :
                              client.plan === 'BASIC' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {client.plan}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{client.members}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">₹{client.revenue.toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewClient(client.id)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleEditClient(client.id)}>
                                    Edit Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                                    Delete Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.location.href = '/client/dashboard'}>
                                    View Client Panel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{(stats.totalRevenue / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">+23%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">PRO Plans</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">TRIAL Plans</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">67</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">BASIC Plans</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">32</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">ENTERPRISESE</span>
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">12</span>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <activity.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.client} • {activity.time}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date().toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}