"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Users, CheckCircle, Clock, XCircle, Lock, Eye, Unlock, Trash2, RefreshCw, 
  Building2, Shield, Settings, Database, Activity, DollarSign, Plus, Loader2,
  Play, Download, Upload, LogOut, ArchiveRestore, RotateCcw, ChevronDown, Edit, MoreHorizontal,
  AlertTriangle, Check, TrendingUp, UserCheck, BarChart3, Zap, Globe, Server, Cpu,
  Filter, Calendar, Mail, Phone, MapPin, Star, Award, Target, ArrowUpRight, ArrowDownRight,
  Pause, PlayCircle, Square, Terminal, Code, FileText, FolderOpen, Layers, Save, CreditCard, Crown, Gem, Bell, LineChart
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
import { useAuth } from '@/providers/auth-provider'
import { ActivityMonitor } from '@/components/activity-monitor'
import { DataCharts } from '@/components/data-charts'
import { AddClientModal } from '@/components/admin/AddClientModal'
import { ActionsDropdown } from '@/components/admin/ActionsDropdown'

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

interface SubscriptionPlan {
  name: string;
  price: number;
  duration: string;
  features: string[];
  color: string;
  description: string;
}

interface Subscription {
  id: number;
  clientId: string;
  clientName: string;
  plan: string;
  status: string;
  expiryDate: string;
  revenue: string;
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  memberCount?: number;
}

// --- DATABASE TASKS DATA (from original) ---
const DB_TASKS_DATA = [
  { "idx": 0, "id": "1493c7d4-2d7b-4d7c-983d-d16c249f7799", "task_name": "schema-sync", "description": "Sync database schema changes automatically", "schedule": "0 */6 * * *", "enabled": true, "last_run_status": "Success" },
  { "idx": 1, "id": "b1ab0b6b-db3b-45d3-8da2-87e0a41d8991", "task_name": "database-restore", "description": "Restore database from backup files", "schedule": "manual", "enabled": true, "last_run_status": null },
  { "idx": 2, "id": "b975d726-644c-407a-9bd0-0f2ae339acea", "task_name": "database-backup", "description": "Create secure database backups to Supabase Storage", "schedule": "manual", "enabled": true, "last_run_status": "Success" },
  { "idx": 3, "id": "cc372267-4337-4712-a7aa-b5b8c3004a98", "task_name": "auto-sync", "description": "Scheduled data synchronization", "schedule": "0 */2 * * *", "enabled": true, "last_run_status": "Failed" },
  { "idx": 4, "id": "d9f51dc4-cf71-4d34-9c62-5df89b238b66", "task_name": "health-check", "description": "Monitor system health and Supabase connectivity", "schedule": "*/5 * * * *", "enabled": true, "last_run_status": "Success" }
];

export default function AdminDashboard() {
  const router = useRouter()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Client State
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  
  // Automation State
  const [tasks, setTasks] = useState<AutomationTask[]>(DB_TASKS_DATA)
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set())
  const [automationSubTab, setAutomationSubTab] = useState("system")
  
  // Subscription State
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subscriptionStats, setSubscriptionStats] = useState({
    totalActive: 0,
    totalTrial: 0,
    totalExpired: 0,
    totalRevenue: '$0/month'
  })
  
  // Subscription Modal States
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [renewData, setRenewData] = useState({
    planId: '',
    duration: '1'
  })
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'TRIAL'
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
    totalClients: 24,
    activeClients: 18,
    totalRevenue: 45200,
    totalMembers: 1240,
    systemHealth: 'healthy',
    uptime: '99.9%',
    lastBackup: '2 hours ago'
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

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      const result = await response.json();
      if (result.success) {
        setSubscriptionPlans(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      // Fallback to sample data
      setSubscriptionPlans([
        {
          name: "Basic Plan",
          price: 999,
          duration: "monthly",
          features: ["Up to 50 members", "Basic transactions", "Email support"],
          color: "bg-blue-500",
          description: "Perfect for small societies"
        },
        {
          name: "Standard Plan", 
          price: 1999,
          duration: "monthly",
          features: ["Up to 200 members", "Advanced transactions", "Priority support"],
          color: "bg-cyan-500",
          description: "Great for medium societies"
        },
        {
          name: "Premium Plan",
          price: 4999,
          duration: "monthly", 
          features: ["Unlimited members", "Advanced analytics", "24/7 support"],
          color: "bg-purple-500",
          description: "Best for large societies"
        }
      ]);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      const result = await response.json();
      if (result.success) {
        // Map the API response to match the frontend interface
        const mappedSubscriptions = result.data.map((item: any) => ({
          id: item.id,
          clientId: item.id, // API returns id as the society account ID
          clientName: item.societyName,
          plan: item.plan,
          status: item.status,
          expiryDate: item.subscriptionEndsAt || item.trialEndsAt || 'N/A',
          revenue: item.plan === 'basic' ? '₹0' : item.plan === 'professional' ? '₹99' : item.plan === 'enterprise' ? '₹299' : '₹0',
          subscriptionEndsAt: item.subscriptionEndsAt,
          trialEndsAt: item.trialEndsAt,
          memberCount: item.memberCount
        }));
        setSubscriptions(mappedSubscriptions);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      // Fallback to sample data
      setSubscriptions([
        {
          id: 1,
          clientId: "client1",
          clientName: "Shanti Niketan Society",
          plan: "Professional",
          status: "active",
          expiryDate: "2024-12-31",
          revenue: "₹99"
        },
        {
          id: 2,
          clientId: "client2", 
          clientName: "Green Valley Apartments",
          plan: "Basic",
          status: "expired",
          expiryDate: "2024-11-15",
          revenue: "₹0"
        }
      ]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchClients()
    fetchSubscriptionPlans()
    fetchSubscriptions()
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

  // --- ACTION HANDLERS ---
  const handleClientAction = async (action: string, clientId: string) => {
    console.log(`Action: ${action} for client: ${clientId}`)
    
    switch (action) {
      case 'view':
        router.push(`/admin/clients/${clientId}`)
        break
      case 'edit':
        // Find the client data and populate edit form
        const clientToEdit = clients.find(c => c.id === clientId)
        if (clientToEdit) {
          setSelectedClient(clientToEdit)
          setEditClient({
            name: clientToEdit.name,
            email: clientToEdit.email,
            phone: clientToEdit.phone,
            address: clientToEdit.address,
            subscriptionPlan: clientToEdit.subscriptionPlan
          })
          setIsEditModalOpen(true)
        } else {
          toast.error('Client not found')
        }
        break
      case 'send_email':
        toast.success(`Email composer opened for client`)
        // TODO: Open email composer
        break
      case 'lock':
        try {
          const res = await fetch(`/api/admin/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'LOCKED' })
          })
          if (res.ok) {
            toast.success(`Client account locked successfully`)
            fetchClients()
          } else {
            throw new Error('Failed to lock client')
          }
        } catch (e) {
          toast.error(`Failed to lock client account`)
        }
        break
      case 'unlock':
        try {
          const res = await fetch(`/api/admin/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE' })
          })
          if (res.ok) {
            toast.success(`Client account unlocked successfully`)
            fetchClients()
          } else {
            throw new Error('Failed to unlock client')
          }
        } catch (e) {
          toast.error(`Failed to unlock client account`)
        }
        break
      case 'delete':
        if (confirm('Are you sure you want to delete this client?')) {
          await handleDeleteClient(clientId)
        }
        break
      case 'expire':
        try {
          const res = await fetch(`/api/admin/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'EXPIRED' })
          })
          if (res.ok) {
            toast.success(`Client marked as expired`)
            fetchClients()
          } else {
            throw new Error('Failed to expire client')
          }
        } catch (e) {
          toast.error(`Failed to mark client as expired`)
        }
        break
      case 'renew_basic':
      case 'renew_pro':
      case 'renew_enterprise':
        const plan = action.replace('renew_', '').toUpperCase()
        try {
          const res = await fetch(`/api/admin/clients/${clientId}/renew`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
          })
          if (res.ok) {
            toast.success(`Client subscription renewed to ${plan}`)
            fetchClients()
          } else {
            throw new Error('Failed to renew subscription')
          }
        } catch (e) {
          toast.error(`Failed to renew subscription`)
        }
        break
      default:
        toast.info(`Action ${action} executed for client ${clientId}`)
    }
  }
  const runTask = async (taskName: string) => {
    if (runningTasks.has(taskName)) return
    setRunningTasks(prev => new Set(prev).add(taskName))
    toast.info(`🚀 Starting ${taskName}...`)
    
    try {
      const res = await fetch('/api/admin/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName })
      })
      
      if (res.ok) {
        toast.success(`✅ Task ${taskName} completed successfully`)
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

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))
    toast.success(`Task ${tasks.find(t => t.id === id)?.enabled ? 'disabled' : 'enabled'} successfully`)
  }

  const handleCreateDemoClient = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create',
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
    // Function is now handled by AddClientModal component
    // This function can be removed or kept for reference
    console.log('Add client handled by AddClientModal')
  }

  const handleEditClient = async () => {
    if (!selectedClient || !editClient.name || !editClient.email) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editClient.name,
          email: editClient.email,
          phone: editClient.phone,
          address: editClient.address,
          subscriptionPlan: editClient.subscriptionPlan
        })
      })
      
      if (res.ok) {
        toast.success('✅ Client updated successfully')
        setIsEditModalOpen(false)
        setSelectedClient(null)
        setEditClient({ name: '', email: '', phone: '', address: '', subscriptionPlan: 'TRIAL' })
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

  const handleLogout = async () => {
    await logout()
  }

  const handleRenewSubscription = async () => {
    if (!selectedSubscription || !renewData.planId) {
      toast.error('Please select a plan for renewal')
      return
    }

    setIsLoading(true)
    try {
      // Map plan names to backend expected values
      const planMapping: { [key: string]: string } = {
        'Basic': 'BASIC',
        'Professional': 'PRO', 
        'Enterprise': 'ENTERPRISE',
        'basic': 'BASIC',
        'professional': 'PRO', 
        'enterprise': 'ENTERPRISE'
      }
      
      const backendPlan = planMapping[renewData.planId] || renewData.planId.toUpperCase()

      console.log('Renewing subscription:', {
        clientId: selectedSubscription.clientId,
        currentPlan: selectedSubscription.plan,
        newPlan: renewData.planId,
        backendPlan
      })

      const res = await fetch(`/api/admin/clients/${selectedSubscription.clientId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: backendPlan
        })
      })
      
      if (res.ok) {
        toast.success('✅ Subscription renewed successfully')
        setIsRenewModalOpen(false)
        setSelectedSubscription(null)
        setRenewData({ planId: '', duration: '1' })
        fetchSubscriptions()
        fetchClients() // Refresh client data to update subscription status
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to renew subscription')
      }
    } catch (e: any) {
      console.error('Renew subscription error:', e)
      toast.error(`❌ Failed to renew subscription: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const openRenewModal = (subscription: Subscription) => {
    console.log('Opening renew modal for subscription:', subscription)
    setSelectedSubscription(subscription)
    
    // Map current plan to the format expected by the select dropdown
    const currentPlanName = subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1).toLowerCase() || 'Basic'
    
    setRenewData({
      planId: currentPlanName,
      duration: '1'
    })
    setIsRenewModalOpen(true)
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
      case 'PRO':
      case 'PROFESSIONAL': 
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'BASIC': 
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ENTERPRISE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'TRIAL': 
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background - Original Stallone Style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* --- STALLONE HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25"
              >
                <Crown className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Saanify <span className="text-cyan-400">Stallone</span>
                </h1>
                <p className="text-sm text-cyan-400">ADMIN Suite - Complete Control Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-full border border-cyan-500/30"
              >
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">ADMIN</span>
              </motion.div>
              <Badge className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-0">
                Admin Access
              </Badge>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="text-white hover:bg-white/10 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex relative">
        {/* Sidebar Navigation - Original Stallone Style */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 backdrop-blur-xl bg-white/5 border-r border-white/10 z-40"
        >
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'clients', label: 'Client Management', icon: Users },
              { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
              { id: 'analytics', label: 'Analytics', icon: Activity },
              { id: 'activity', label: 'Activity Monitor', icon: Activity },
              { id: 'data-charts', label: 'Data Visualization', icon: LineChart },
              { id: 'automation', label: 'Automation', icon: Zap },
              { id: 'settings', label: 'System Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* System Status - Bottom Left Sidebar */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-3">System Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Active Clients</span>
                    <span className="text-cyan-400 font-bold">{stats.activeClients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Revenue</span>
                    <span className="text-green-400 font-bold">${(stats.totalRevenue/1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Uptime</span>
                    <span className="text-emerald-400 font-bold">{stats.uptime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 ml-72 p-6 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* ================= OVERVIEW TAB ================= */}
            {activeTab === 'overview' && (
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
                  <p className="text-white/60 text-lg">ADMIN Suite - Complete Control Center</p>
                </motion.div>

                {/* Stats Grid - Original Style */}
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

                {/* Quick Actions and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full justify-start bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                      >
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
            )}

            {/* ================= CLIENTS TAB ================= */}
            {activeTab === 'clients' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Client Management</h2>
                    <p className="text-white/60">Manage all society clients and their subscriptions</p>
                  </div>
                  <Button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
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
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/40"
                        />
                      </div>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <Filter className="h-4 w-4 mr-2" />
                              {filterStatus === 'all' ? 'All Status' : filterStatus}
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-white/10">
                            <DropdownMenuItem onClick={() => setFilterStatus('all')} className="text-white hover:bg-white/10">
                              All Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus('active')} className="text-white hover:bg-white/10">
                              Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus('trial')} className="text-white hover:bg-white/10">
                              Trial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus('expired')} className="text-white hover:bg-white/10">
                              Expired
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
                            <th className="text-left p-4 text-white/60 font-medium">Members</th>
                            <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClients.map((client, index) => (
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
                                <span className="text-white">{client.members}</span>
                              </td>
                              <td className="p-4">
                                <ActionsDropdown 
                                  client={client}
                                  onAction={handleClientAction}
                                  onDelete={handleDeleteClient}
                                />
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ================= ACTIVITY MONITOR TAB ================= */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <ActivityMonitor />
              </div>
            )}

            {/* ================= DATA VISUALIZATION TAB ================= */}
            {activeTab === 'data-charts' && (
              <div className="space-y-6">
                <DataCharts />
              </div>
            )}

            {/* ================= AUTOMATION TAB ================= */}
            {activeTab === 'automation' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Automation Center</h2>
                    <p className="text-white/60">Manage system tasks, crons, and communication workflows</p>
                  </div>
                  
                  {/* Sub-Tabs for Automation */}
                  <div className="bg-white/5 p-1 rounded-lg flex gap-2 border border-white/10">
                    <button 
                      onClick={() => setAutomationSubTab("system")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${automationSubTab === 'system' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-white/60 hover:text-white'}`}
                    >
                      System Tasks
                    </button>
                    <button 
                      onClick={() => setAutomationSubTab("communication")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${automationSubTab === 'communication' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-white/60 hover:text-white'}`}
                    >
                      Communications
                    </button>
                  </div>
                </div>

                {/* System Tasks Tab */}
                {automationSubTab === "system" && (
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
                          {tasks.map((task) => (
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
                                  disabled={runningTasks.has(task.task_name)}
                                >
                                  {runningTasks.has(task.task_name) ? (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  ) : (
                                    <Play className="h-3 w-3 mr-2 fill-current" />
                                  )}
                                  {runningTasks.has(task.task_name) ? 'Running...' : 'Run Now'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Communications Tab */}
                {automationSubTab === "communication" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            )}

            {/* ================= ANALYTICS TAB ================= */}
            {activeTab === 'analytics' && (
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
            )}

            {/* ================= SETTINGS TAB ================= */}
            {activeTab === 'settings' && (
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
                          { name: 'ADMIN', email: 'admin@saanify.com', role: 'ADMIN', status: 'Active' },
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
                            <span className="text-cyan-400">{stats.lastBackup}</span>
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
            )}

            {/* ================= BILLING TAB ================= */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Subscription & Billing</h2>
                    <p className="text-white/60">Manage plans, revenue, and client subscriptions</p>
                  </div>
                  <Button 
                    onClick={() => router.push('/admin/subscription-plans')}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Plans
                  </Button>
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
                        {subscriptionPlans?.map((plan) => (
                          <div key={plan.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${plan?.color || 'bg-gray-500'}`}></div>
                              <span className="text-white">{plan.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">
                                {subscriptions?.filter(s => s?.plan?.toLowerCase() === plan?.name?.toLowerCase()).length || 0} clients
                              </p>
                              <p className="text-white/60 text-sm">₹{plan?.price || 0}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscription Plans */}
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Available Subscription Plans</CardTitle>
                    <CardDescription className="text-white/60">
                      Current subscription plans offered to clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subscriptionPlans?.map((plan, index) => (
                        <Card key={index} className="bg-white/5 border-white/10">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-semibold text-white">{plan?.name || 'Unknown Plan'}</h3>
                              <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                            </div>
                            <p className="text-white/60 text-sm mb-3">{plan?.description || 'No description available'}</p>
                            <div className="text-2xl font-bold text-white mb-3">₹{plan?.price || 0}</div>
                            <div className="text-white/60 text-sm mb-3">{plan?.duration || 'monthly'}</div>
                            <div className="space-y-1">
                              {plan.features?.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-400" />
                                  <span className="text-white/80 text-sm">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Client Subscriptions */}
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Client Subscriptions</CardTitle>
                    <CardDescription className="text-white/60">
                      Manage and renew client subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead className="text-white/60">Client</TableHead>
                            <TableHead className="text-white/60">Plan</TableHead>
                            <TableHead className="text-white/60">Status</TableHead>
                            <TableHead className="text-white/60">Expiry Date</TableHead>
                            <TableHead className="text-white/60">Revenue</TableHead>
                            <TableHead className="text-white/60">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions?.map((subscription) => (
                            <TableRow key={subscription?.id || Math.random()} className="border-white/5">
                              <TableCell className="text-white">{subscription?.clientName || 'Unknown Client'}</TableCell>
                              <TableCell>
                                <Badge className="bg-blue-500/20 text-blue-400">
                                  {subscription?.plan || 'Unknown Plan'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(subscription?.status || 'unknown')}>
                                  {subscription?.status || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white">{subscription?.expiryDate || 'N/A'}</TableCell>
                              <TableCell className="text-white font-medium">{subscription?.revenue || '₹0'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-white hover:bg-white/10"
                                    onClick={() => openRenewModal(subscription)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { client: 'Acme Corporation', amount: '₹1,999', plan: 'Standard Plan', date: '2024-11-01', status: 'completed' },
                        { client: 'TechStart Inc', amount: '₹999', plan: 'Basic Plan', date: '2024-11-01', status: 'completed' },
                        { client: 'Global Enterprises', amount: '₹4,999', plan: 'Premium Plan', date: '2024-10-31', status: 'completed' },
                        { client: 'StartupHub', amount: '₹0', plan: 'Trial', date: '2024-10-30', status: 'pending' }
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
            )}

          </motion.div>
        </main>
      </div>

      {/* Add Client Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Client</DialogTitle>
            <DialogDescription>
              Create a new society client account
            </DialogDescription>
          </DialogHeader>
          <AddClientModal 
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              setIsAddModalOpen(false)
              fetchClients()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-800 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Client</DialogTitle>
            <DialogDescription className="text-white/60">
              Update client information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Client Name</Label>
              <Input
                value={editClient.name}
                onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={editClient.email}
                onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Phone</Label>
              <Input
                value={editClient.phone}
                onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Address</Label>
              <Input
                value={editClient.address}
                onChange={(e) => setEditClient({ ...editClient, address: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Plan</Label>
              <Select value={editClient.subscriptionPlan} onValueChange={(value) => setEditClient({ ...editClient, subscriptionPlan: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditClient}
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Subscription Modal */}
      <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
        <DialogContent className="bg-slate-800 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Renew Subscription</DialogTitle>
            <DialogDescription className="text-white/60">
              Renew subscription for {selectedSubscription?.clientName || 'Selected Client'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Current Plan</Label>
              <Input
                value={selectedSubscription?.plan || ''}
                disabled
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Select New Plan</Label>
              <Select value={renewData.planId} onValueChange={(value) => setRenewData({...renewData, planId: value})}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {subscriptionPlans?.map((plan) => (
                    <SelectItem key={plan?.name || Math.random()} value={plan?.name || ''} className="text-white hover:bg-white/10">
                      {plan?.name || 'Unknown'} - ₹{plan?.price || 0}/{plan?.duration || 'monthly'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Duration (months)</Label>
              <Input
                type="number"
                value={renewData.duration}
                onChange={(e) => setRenewData({...renewData, duration: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
                placeholder="1"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRenewModalOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenewSubscription}
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Renew Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}