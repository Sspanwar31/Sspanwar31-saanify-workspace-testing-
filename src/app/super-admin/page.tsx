"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Users, CheckCircle, Clock, XCircle, Lock, Eye, Unlock, Trash2, RefreshCw, 
  Building2, Shield, Settings, Database, Activity, DollarSign, Plus, Loader2,
  Play, Download, Upload, LogOut, ArchiveRestore, RotateCcw, ChevronDown, Edit, MoreHorizontal,
  AlertTriangle, Check, TrendingUp, UserCheck, BarChart3, Zap, Globe, Server, Cpu,
  Filter, Calendar, Mail, Phone, MapPin, Star, Award, Target, ArrowUpRight, ArrowDownRight,
  Pause, PlayCircle, Square, Terminal, Code, FileText, FolderOpen, Layers, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// --- 🛡️ SAFETY FUNCTIONS ---
const safeRender = (val: any) => {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'boolean') return val ? 'True' : 'False'
  if (typeof val === 'object') {
    try { return JSON.stringify(val) } catch (e) { return 'Data Object' }
  }
  return String(val)
}

const formatDate = (dateVal: any) => {
  if (!dateVal) return 'Never'
  try { return new Date(dateVal).toLocaleString() } catch (e) { return '-' }
}

// Types
interface Client {
  id: string; 
  name: string; 
  plan: string; 
  status: string; 
  members: number;
  revenue: string; 
  contact: string; 
  lastActive: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  trialEndsAt?: string;
}

interface AutomationTask {
  id: string;
  task_name: string;
  description?: string;
  schedule?: string;
  enabled?: boolean;
  last_run_status?: string;
  last_run_at?: string;
}

interface AutomationLog {
  id: string;
  task_name?: string;
  status: string;
  message?: string;
  details?: any;
  duration_ms?: number;
  run_time?: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Client State
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  
  // Automation State
  const [tasks, setTasks] = useState<AutomationTask[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set())
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'TRIAL'
  })
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'TRIAL'
  })

  // Stats State
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    totalMembers: 0,
    systemHealth: 'healthy',
    uptime: '99.9%',
    lastBackup: 'Never'
  })

  // --- FETCH DATA ---
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e)
      // Use dummy data if API fails
      const dummyClients: Client[] = [
        {
          id: '1',
          name: "Demo Society",
          plan: "TRIAL",
          status: "Active",
          members: 50,
          revenue: "₹0",
          contact: "client@demo.com",
          lastActive: "2h ago",
          email: "client@demo.com",
          phone: "+91 9876543210",
          address: "123 Demo Street",
          createdAt: new Date().toISOString(),
          trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      setClients(dummyClients)
    }
  }

  const fetchAutomationData = async () => {
    try {
      const res = await fetch('/api/super-admin/automation/data', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setTasks(json.tasks || [])
        setLogs(json.logs || [])
      }
    } catch (e) {
      console.error('Failed to fetch automation data:', e)
      // Use dummy data if API fails
      const dummyTasks: AutomationTask[] = [
        {
          id: '1',
          task_name: 'database-backup',
          description: 'Backup the database',
          schedule: 'daily',
          enabled: true,
          last_run_status: 'success',
          last_run_at: new Date().toISOString()
        }
      ]
      const dummyLogs: AutomationLog[] = [
        {
          id: '1',
          task_name: 'database-backup',
          status: 'success',
          message: 'Database backup completed successfully',
          run_time: new Date().toISOString()
        }
      ]
      setTasks(dummyTasks)
      setLogs(dummyLogs)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchClients()
    fetchAutomationData()
    
    // Update stats
    setStats({
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'Active').length,
      totalRevenue: clients.reduce((sum, c) => sum + (parseInt(c.revenue.replace(/[₹,]/g, '')) || 0), 0),
      totalMembers: clients.reduce((sum, c) => sum + c.members, 0),
      systemHealth: 'healthy',
      uptime: '99.9%',
      lastBackup: '2 hours ago'
    })
  }, [])

  // Filter clients based on search and status
  useEffect(() => {
    let filtered = clients
    
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus)
    }
    
    setFilteredClients(filtered)
  }, [clients, searchTerm, filterStatus])

  // Fetch automation data when tab changes
  useEffect(() => {
    if (activeTab === 'automation') {
      setIsLoading(true)
      fetchAutomationData().finally(() => setIsLoading(false))
      const interval = setInterval(fetchAutomationData, 30000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  // --- ACTION HANDLERS ---
  const runTask = async (taskName: string) => {
    if (runningTasks.has(taskName)) return
    setRunningTasks(prev => new Set(prev).add(taskName))
    toast.info(`🚀 Starting ${taskName}...`)
    
    try {
      const res = await fetch('/api/super-admin/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName })
      })
      
      if (res.ok) {
        toast.success(`✅ Task ${taskName} completed successfully`)
        fetchAutomationData()
      } else {
        throw new Error('Task execution failed')
      }
    } catch (e) {
      toast.error(`❌ Task ${taskName} failed`)
    } finally {
      setRunningTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskName)
        return newSet
      })
    }
  }

  const handleCreateDemoClient = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: "Demo Society",
          email: `demo-${Date.now()}@saanify.com`,
          phone: "+91 9876543210",
          address: "123 Demo Street, Demo City",
          plan: "TRIAL"
        })
      })
      
      if (res.ok) {
        toast.success('✅ Demo client created successfully')
        fetchClients()
      } else {
        throw new Error('Failed to create demo client')
      }
    } catch (e) {
      toast.error('❌ Failed to create demo client')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })
      
      if (res.ok) {
        toast.success('✅ Client added successfully')
        setIsAddModalOpen(false)
        setNewClient({ name: '', email: '', phone: '', address: '', plan: 'TRIAL' })
        fetchClients()
      } else {
        throw new Error('Failed to add client')
      }
    } catch (e) {
      toast.error('❌ Failed to add client')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClient = async () => {
    if (!selectedClient || !editClient.name || !editClient.email) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClient)
      })
      
      if (res.ok) {
        toast.success('✅ Client updated successfully')
        setIsEditModalOpen(false)
        setSelectedClient(null)
        setEditClient({ name: '', email: '', phone: '', address: '', plan: 'TRIAL' })
        fetchClients()
      } else {
        throw new Error('Failed to update client')
      }
    } catch (e) {
      toast.error('❌ Failed to update client')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('✅ Client deleted successfully')
        fetchClients()
      } else {
        throw new Error('Failed to delete client')
      }
    } catch (e) {
      toast.error('❌ Failed to delete client')
    }
  }

  const handleToggleTask = async (taskId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/super-admin/automation/${taskId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      
      if (res.ok) {
        toast.success(`✅ Task ${enabled ? 'enabled' : 'disabled'} successfully`)
        fetchAutomationData()
      } else {
        throw new Error('Failed to toggle task')
      }
    } catch (e) {
      toast.error('❌ Failed to toggle task')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  // --- HELPER FUNCTIONS ---
  const getStatusIcon = (status: string) => {
    const s = String(status).toLowerCase()
    if (s.includes('success') || s === 'healthy' || s === 'active') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (s.includes('err') || s.includes('fail')) return <XCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getStatusColor = (status: string) => {
    const s = String(status).toLowerCase()
    if (s.includes('success') || s === 'healthy' || s === 'active') return 'bg-green-100 text-green-800 border-green-200'
    if (s.includes('err') || s.includes('fail')) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getPlanColor = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case 'PRO': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'BASIC': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'TRIAL': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* --- MODERN HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg"
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Super Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Manage societies & automation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Healthy</span>
              </motion.div>
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                Admin Access
              </Badge>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl rounded-xl p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
                <Building2 className="h-4 w-4 mr-2" />
                Societies
              </TabsTrigger>
              <TabsTrigger value="automation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
                <Zap className="h-4 w-4 mr-2" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* ================= TAB 1: SOCIETIES ================= */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    title: 'Total Societies', 
                    value: stats.totalClients, 
                    icon: Building2, 
                    color: 'from-blue-500 to-blue-600',
                    change: '+12%',
                    changeType: 'increase'
                  },
                  { 
                    title: 'Active', 
                    value: stats.activeClients, 
                    icon: CheckCircle, 
                    color: 'from-green-500 to-green-600',
                    change: '+8%',
                    changeType: 'increase'
                  },
                  { 
                    title: 'Total Revenue', 
                    value: `₹${stats.totalRevenue.toLocaleString()}`, 
                    icon: DollarSign, 
                    color: 'from-purple-500 to-purple-600',
                    change: '+23%',
                    changeType: 'increase'
                  },
                  { 
                    title: 'Total Members', 
                    value: stats.totalMembers, 
                    icon: Users, 
                    color: 'from-orange-500 to-orange-600',
                    change: '+15%',
                    changeType: 'increase'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <div className={`flex items-center text-sm font-medium ${
                            stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.changeType === 'increase' ? (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                            )}
                            {stat.change}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Search and Filters */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Registered Societies</CardTitle>
                      <CardDescription>Manage and monitor all client societies</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search societies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Trial">Trial</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Society
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={handleCreateDemoClient}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                        >
                          {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          Create Demo
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-900">Society</TableHead>
                          <TableHead className="font-semibold text-gray-900">Plan</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900">Members</TableHead>
                          <TableHead className="font-semibold text-gray-900">Revenue</TableHead>
                          <TableHead className="font-semibold text-gray-900">Last Active</TableHead>
                          <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center text-gray-500">
                                <Building2 className="h-12 w-12 mb-3 opacity-50" />
                                <p className="text-lg font-medium">No societies found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredClients.map((client, index) => (
                            <motion.tr
                              key={client.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50/50 border-b border-gray-100/50"
                            >
                              <TableCell className="py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{client.name}</div>
                                  <div className="text-sm text-gray-500 flex items-center mt-1">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {client.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`border ${getPlanColor(client.plan)}`}>
                                  {client.plan}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`border ${getStatusColor(client.status)}`}>
                                  {getStatusIcon(client.status)}
                                  <span className="ml-1">{client.status}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="font-medium">{client.members}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-gray-900">{client.revenue}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {client.lastActive}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedClient(client)
                                        setEditClient({
                                          name: client.name,
                                          email: client.email,
                                          phone: client.phone,
                                          address: client.address,
                                          plan: client.plan
                                        })
                                        setIsEditModalOpen(true)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        toast.info(`🏠 Opening ${client.name} dashboard...`, {
                                          description: "Redirecting to client dashboard",
                                          duration: 2000,
                                        })
                                        setTimeout(() => {
                                          window.open(`/dashboard/client?id=${client.id}`, '_blank')
                                        }, 1000)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Dashboard
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClient(client.id)}
                                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Society
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ================= TAB 2: AUTOMATION ================= */}
            <TabsContent value="automation" className="space-y-6">
              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Zap className="h-4 w-4 text-blue-600" />
                <AlertDescription className="font-semibold text-blue-900">
                  System Automation Center - Real-time Control Panel
                </AlertDescription>
              </Alert>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Database Backup',
                    description: 'Create full system backup',
                    icon: Download,
                    color: 'from-blue-500 to-blue-600',
                    taskName: 'database-backup'
                  },
                  {
                    title: 'Schema Sync',
                    description: 'Sync database schema',
                    icon: RotateCcw,
                    color: 'from-purple-500 to-purple-600',
                    taskName: 'schema-sync'
                  },
                  {
                    title: 'Health Check',
                    description: 'Run system diagnostics',
                    icon: Activity,
                    color: 'from-green-500 to-green-600',
                    taskName: 'health-check'
                  },
                  {
                    title: 'Clear Cache',
                    description: 'Clear system cache',
                    icon: RefreshCw,
                    color: 'from-orange-500 to-orange-600',
                    taskName: 'clear-cache'
                  }
                ].map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                          onClick={() => runTask(action.taskName)}>
                      <div className={`h-1 bg-gradient-to-r ${action.color}`}></div>
                      <CardContent className="p-6">
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{action.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                        <Button 
                          disabled={runningTasks.has(action.taskName)}
                          className={`w-full bg-gradient-to-r ${action.color} hover:opacity-90 text-white`}
                        >
                          {runningTasks.has(action.taskName) ? (
                            <>
                              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Execute
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Tasks and Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks List */}
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="flex items-center">
                      <Terminal className="h-5 w-5 mr-2 text-indigo-600" />
                      Scheduled Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-auto">
                      {tasks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No tasks scheduled</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {tasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="p-4 hover:bg-gray-50/50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{task.task_name}</div>
                                  <div className="text-sm text-gray-500">{task.description}</div>
                                  <div className="flex items-center mt-2 text-xs text-gray-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDate(task.last_run_at)}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={task.enabled}
                                    onCheckedChange={(checked) => handleToggleTask(task.id, checked)}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => runTask(task.task_name)}
                                    disabled={runningTasks.has(task.task_name)}
                                  >
                                    {runningTasks.has(task.task_name) ? (
                                      <RefreshCw className="animate-spin h-3 w-3" />
                                    ) : (
                                      <Play className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Logs List */}
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                      Execution Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-auto">
                      {logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No execution logs</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {logs.map((log, index) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="p-4 hover:bg-gray-50/50"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="mt-0.5">
                                  {getStatusIcon(log.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {log.task_name || 'System Task'}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {log.message || 'Task executed'}
                                  </div>
                                  <div className="flex items-center mt-2 text-xs text-gray-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDate(log.run_time)}
                                    {log.duration_ms && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>{log.duration_ms}ms</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ================= TAB 3: ANALYTICS ================= */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle>System Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-indigo-500 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                    <p className="text-gray-600">Advanced analytics and reporting features coming soon</p>
                    <Button className="mt-4" variant="outline">
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle>Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-purple-500 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Growth Metrics</h3>
                    <p className="text-gray-600">Detailed usage statistics and insights coming soon</p>
                    <Button className="mt-4" variant="outline">
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ================= TAB 4: SETTINGS ================= */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system-wide settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <Settings className="h-16 w-16 mx-auto mb-4 text-indigo-500 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Panel</h3>
                  <p className="text-gray-600">Advanced system settings and configuration options coming soon</p>
                  <Button className="mt-4" variant="outline">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Add Client Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Society</DialogTitle>
            <DialogDescription>
              Create a new society account in the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Society Name *</Label>
              <Input
                id="name"
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter society name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter society address"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select value={newClient.plan} onValueChange={(value) => setNewClient(prev => ({ ...prev, plan: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Trial Plan</SelectItem>
                  <SelectItem value="BASIC">Basic Plan</SelectItem>
                  <SelectItem value="PRO">Pro Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Society
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Society Details</DialogTitle>
            <DialogDescription>
              Update society information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Society Name</Label>
                <Input
                  id="edit-name"
                  value={editClient.name}
                  onChange={(e) => setEditClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter society name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editClient.email}
                  onChange={(e) => setEditClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editClient.phone}
                  onChange={(e) => setEditClient(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editClient.address}
                  onChange={(e) => setEditClient(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter society address"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan">Subscription Plan</Label>
                <Select value={editClient.plan} onValueChange={(value) => setEditClient(prev => ({ ...prev, plan: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIAL">Trial Plan</SelectItem>
                    <SelectItem value="BASIC">Basic Plan</SelectItem>
                    <SelectItem value="PRO">Pro Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}