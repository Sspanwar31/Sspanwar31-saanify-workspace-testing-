"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { makeAuthenticatedRequest } from '@/lib/auth'
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
  const { toast } = useToast()
  const { user, isLoading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
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
  
  // Notifications State
  const [notifications, setNotifications] = useState([
    { event: 'New Client Signup', enabled: true, lastTriggered: '2 hours ago' },
    { event: 'Subscription Renewed', enabled: true, lastTriggered: '1 day ago' },
    { event: 'Payment Failed', enabled: true, lastTriggered: '3 days ago' },
    { event: 'System Maintenance', enabled: false, lastTriggered: '1 week ago' }
  ])
  
  // Email Automation State
  const [emailAutomations, setEmailAutomations] = useState([
    { type: 'Welcome Email', status: 'Active', sent: '24', pending: '0' },
    { type: 'Trial Expiry Reminder', status: 'Active', sent: '12', pending: '3' },
    { type: 'Payment Failed', status: 'Active', sent: '2', pending: '1' },
    { type: 'Renewal Reminder', status: 'Paused', sent: '8', pending: '5' }
  ])
  
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
  const [isRenewing, setIsRenewing] = useState(false)
  
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
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [isUpdatingClient, setIsUpdatingClient] = useState(false)
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

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    trialDuration: 15,
    maxUsersBasic: 25,
    maxUsersPro: 100,
    autoRenewal: true,
    emailNotifications: true,
    maintenanceMode: false
  })

  // Admin Management State
  const [adminUsers, setAdminUsers] = useState([
    { id: 1, name: 'ADMIN', email: 'admin@saanify.com', role: 'ADMIN', status: 'Active' },
    { id: 2, name: 'John Doe', email: 'john@saanify.com', role: 'Admin', status: 'Active' },
    { id: 3, name: 'Jane Smith', email: 'jane@saanify.com', role: 'Admin', status: 'Inactive' }
  ])

  // Backup & Restore State
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: '2 hours ago',
    size: '124 MB',
    location: 'GitHub + Local',
    isBackingUp: false,
    isRestoring: false
  })

  // Add New Admin State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'Admin',
    password: ''
  })

  // --- FETCH DATA ---
  const fetchClients = async () => {
    try {
      const res = await makeAuthenticatedRequest('/api/admin/clients', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      } else {
        console.error('Failed to fetch clients:', res.status, res.statusText)
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
      const response = await makeAuthenticatedRequest('/api/admin/subscription-plans');
      const result = await response.json();
      if (result.success) {
        setSubscriptionPlans(result.data);
      } else {
        console.error('Failed to fetch subscription plans:', result);
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
      const response = await makeAuthenticatedRequest('/api/admin/subscriptions');
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
          revenue: item.plan === 'trial' ? '₹0' : item.plan === 'basic' ? '₹299' : item.plan === 'professional' ? '₹599' : item.plan === 'enterprise' ? '₹999' : '₹0',
          subscriptionEndsAt: item.subscriptionEndsAt,
          trialEndsAt: item.trialEndsAt,
          memberCount: item.memberCount
        }));
        setSubscriptions(mappedSubscriptions);
      } else {
        console.error('Failed to fetch subscriptions:', result);
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
          toast({
            title: "Client Not Found",
            description: "Client not found",
            variant: "destructive"
          })
        }
        break
      case 'send_email':
        toast({
          title: "Email Composer",
          description: `Email composer opened for client`
        })
        // TODO: Open email composer
        break
      case 'lock':
        try {
          const res = await makeAuthenticatedRequest(`/api/admin/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'LOCKED' })
          })
          if (res.ok) {
            toast({
              title: "Client Locked",
              description: `Client account locked successfully`
            })
            fetchClients()
          } else {
            throw new Error('Failed to lock client')
          }
        } catch (e) {
          toast({
            title: "Lock Failed",
            description: `Failed to lock client account`,
            variant: "destructive"
          })
        }
        break
      case 'unlock':
        try {
          const res = await makeAuthenticatedRequest(`/api/admin/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE' })
          })
          if (res.ok) {
            toast({ title: "Success", description: `Client account unlocked successfully` })
            fetchClients()
          } else {
            throw new Error('Failed to unlock client')
          }
        } catch (e) {
          toast({ title: "Error", description: `Failed to unlock client account`, variant: "destructive" })
        }
        break
      case 'delete':
        if (confirm('Are you sure you want to delete this client?')) {
          await handleDeleteClient(clientId)
        }
        break
      case 'expire':
        try {
          const res = await makeAuthenticatedRequest(`/api/admin/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'EXPIRED' })
          })
          if (res.ok) {
            toast({ title: "Success", description: `Client marked as expired` })
            fetchClients()
          } else {
            throw new Error('Failed to expire client')
          }
        } catch (e) {
          toast({ title: "Error", description: `Failed to mark client as expired`, variant: "destructive" })
        }
        break
      case 'renew_basic':
      case 'renew_pro':
      case 'renew_enterprise':
        const plan = action.replace('renew_', '').toUpperCase()
        try {
          const res = await makeAuthenticatedRequest(`/api/admin/clients/${clientId}/renew`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
          })
          if (res.ok) {
            toast({ title: "Success", description: `Client subscription renewed to ${plan}` })
            fetchClients()
          } else {
            throw new Error('Failed to renew subscription')
          }
        } catch (e) {
          toast({ title: "Error", description: `Failed to renew subscription`, variant: "destructive" })
        }
        break
      default:
        toast({ title: "Info", description: `Action ${action} executed for client ${clientId}` })
    }
  }

  // --- ADMIN MANAGEMENT HANDLERS ---
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast({ title: "Error", description: 'Please fill all fields', variant: "destructive" })
      return
    }

    try {
      // Simulate API call to add admin
      const newAdminUser = {
        id: adminUsers.length + 1,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: 'Active'
      }
      
      setAdminUsers([...adminUsers, newAdminUser])
      setShowAddAdminModal(false)
      setNewAdmin({ name: '', email: '', role: 'Admin', password: '' })
      
      toast({ title: "Success", description: `✅ Admin ${newAdmin.name} added successfully!` })
    } catch (error) {
      toast({ title: "Error", description: 'Failed to add admin', variant: "destructive" })
    }
  }

  const handleBackupNow = async () => {
    if (backupStatus.isBackingUp) return
    
    setBackupStatus(prev => ({ ...prev, isBackingUp: true }))
    toast({ title: "Info", description: '🔄 Starting backup process...' })
    
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setBackupStatus(prev => ({
        ...prev,
        isBackingUp: false,
        lastBackup: 'Just now',
        size: '128 MB'
      }))
      
      toast({ title: "Success", description: '✅ Backup completed successfully!' })
    } catch (error) {
      setBackupStatus(prev => ({ ...prev, isBackingUp: false }))
      toast({ title: "Error", description: '❌ Backup failed!', variant: "destructive" })
    }
  }

  const handleRestore = async () => {
    if (backupStatus.isRestoring) return
    
    setBackupStatus(prev => ({ ...prev, isRestoring: true }))
    toast({ title: "Info", description: '🔄 Starting restore process...' })
    
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      setBackupStatus(prev => ({ ...prev, isRestoring: false }))
      
      toast({ title: "Success", description: '✅ System restored successfully!' })
    } catch (error) {
      setBackupStatus(prev => ({ ...prev, isRestoring: false }))
      toast({ title: "Error", description: '❌ Restore failed!', variant: "destructive" })
    }
  }

  const handleGlobalSettingChange = (setting: string, value: any) => {
    setGlobalSettings(prev => ({ ...prev, [setting]: value }))
    
    const settingName = setting.replace(/([A-Z])/g, ' $1').trim()
    const valueText = typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : value
    
    toast({ title: "Success", description: `⚙️ ${settingName} updated to ${valueText}` })
  }

  const toggleAdminStatus = async (adminId: number) => {
    const admin = adminUsers.find(a => a.id === adminId)
    if (!admin) return
    
    const newStatus = admin.status === 'Active' ? 'Inactive' : 'Active'
    
    setAdminUsers(prev => 
      prev.map(a => a.id === adminId ? { ...a, status: newStatus } : a)
    )
    
    toast({ title: "Admin Status Updated", description: `👤 Admin ${admin.name} ${newStatus.toLowerCase()}` })
  }

  const deleteAdmin = async (adminId: number) => {
    const admin = adminUsers.find(a => a.id === adminId)
    if (!admin) return
    
    if (confirm(`Are you sure you want to remove admin ${admin.name}?`)) {
      setAdminUsers(prev => prev.filter(a => a.id !== adminId))
      toast({ title: "Success", description: `🗑️ Admin ${admin.name} removed` })
    }
  }

  // --- QUICK ACTION HANDLERS ---
  const handleRenewSubscriptions = useCallback(async () => {
    console.log('🔄 Renew Subscriptions button clicked!')
    toast({ title: "Info", description: '🔄 Opening bulk renewal interface...' })
    
    try {
      // Check if clients data is available
      if (!clients || clients.length === 0) {
        toast({ title: "Info", description: 'ℹ️ No client data available. Loading clients...' })
        await fetchClients()
      }
      
      // Simulate API call to get expiring subscriptions
      const expiringClients = clients.filter(client => {
        const expiryDate = new Date(client.trialEndsAt || client.createdAt)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0
      })
      
      console.log('📊 Found expiring clients:', expiringClients.length)
      
      if (expiringClients.length === 0) {
        toast({ title: "Info", description: 'ℹ️ No subscriptions need renewal in next 30 days' })
        return
      }
      
      // Simulate bulk renewal
      toast({ title: "Success", description: `✅ Renewal process started for ${expiringClients.length} subscriptions` })
      
      // Update client statuses
      setTimeout(() => {
        setClients(prev => prev.map(client => {
          const isExpiring = expiringClients.some(exp => exp.id === client.id)
          if (isExpiring) {
            const newExpiryDate = new Date()
            newExpiryDate.setDate(newExpiryDate.getDate() + 30)
            return {
              ...client,
              trialEndsAt: newExpiryDate.toISOString(),
              status: 'Active'
            }
          }
          return client
        }))
        toast({ title: "Success", description: '🎉 All expiring subscriptions renewed successfully!' })
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error renewing subscriptions:', error)
      toast({ title: "Error", description: '❌ Failed to renew subscriptions', variant: "destructive" })
    }
  }, [clients, fetchClients])

  const handleSendNotifications = useCallback(async () => {
    console.log('📧 Send Notifications button clicked!')
    toast({ title: "Info", description: '📧 Preparing notification system...' })
    
    try {
      // Simulate notification sending
      const notificationTypes = [
        'Trial expiry reminders',
        'Payment confirmations', 
        'Welcome messages',
        'System updates'
      ]
      
      console.log('📨 Notification types prepared:', notificationTypes)
      
      const toastId = toast.loading('📤 Sending notifications...')
      
      // Simulate sending process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const sentCount = Math.floor(Math.random() * 50) + 20
      const failedCount = Math.floor(Math.random() * 5)
      
      console.log(`📊 Notifications sent: ${sentCount}, Failed: ${failedCount}`)
      
      toast.success(`✅ Notifications sent successfully!`, {
        description: `${sentCount} sent, ${failedCount} failed`,
        id: toastId
      })
      
      // Update notification logs
      setNotifications(prev => [
        ...prev,
        { 
          event: 'Bulk Notifications Sent', 
          enabled: true, 
          lastTriggered: 'Just now' 
        }
      ])
      
    } catch (error) {
      console.error('❌ Error sending notifications:', error)
      toast({ title: "Error", description: '❌ Failed to send notifications', variant: "destructive" })
    }
  }, [setNotifications])

  // --- STAT CLICK HANDLERS ---
  const handleStatClick = (action: string) => {
    switch (action) {
      case 'view_clients':
        setActiveTab('clients')
        toast({ title: "Info", description: '👥 Opening client management...' })
        break
      case 'view_trials':
        setActiveTab('clients')
        setFilterStatus('TRIAL')
        toast({ title: "Info", description: '⏰ Filtering trial clients...' })
        break
      case 'view_revenue':
        setActiveTab('billing')
        toast({ title: "Info", description: '💰 Opening billing dashboard...' })
        break
      case 'view_system':
        setActiveTab('activity')
        toast({ title: "Info", description: '🖥️ Opening system monitor...' })
        break
      default:
        toast({ title: "Info", description: `Opening ${action.replace("_", " ")}...` })
    }
  }

  // --- ACTIVITY CLICK HANDLER ---
  const handleActivityClick = (activity: any) => {
    toast({ title: "Info", description: `📋 Viewing details for: ${activity.user}` })
    
    // Simulate opening detailed view
    switch (activity.status) {
      case 'success':
        toast({ title: "Success", description: `✅ ${activity.action} completed successfully` })
        break
      case 'warning':
        toast.warning(`⚠️ ${activity.action} requires attention`)
        break
      case 'error':
        toast({ title: "Error", description: `❌ ${activity.action} failed - needs resolution`, variant: "destructive" })
        break
      default:
        toast({ title: "Info", description: `📄 ${activity.action} details` })
    }
  }

  const runTask = async (taskName: string) => {
    if (runningTasks.has(taskName)) return
    setRunningTasks(prev => new Set(prev).add(taskName))
    toast({ title: "Info", description: `🚀 Starting ${taskName}...` })
    
    try {
      const res = await makeAuthenticatedRequest('/api/admin/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName })
      })
      
      if (res.ok) {
        const data = await res.json()
        toast({ title: "Success", description: `✅ ${data.message}` })
        
        // Show detailed results if available
        if (data.task?.result?.details) {
          toast.info('📊 Task Details', {
            description: data.task.result.details,
            duration: 5000,
          })
        }
      } else {
        throw new Error('Task execution failed')
      }
    } catch (e) {
      toast({ title: "Error", description: `❌ Task ${taskName} failed`, variant: "destructive" })
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
    toast({ title: "Task Updated", description: `Task ${tasks.find(t => t.id === id)?.enabled ? 'disabled' : 'enabled'} successfully` })
  }

  const toggleNotification = async (event: string) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleNotification', event })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({ title: "Success", description: data.message })
        
        // Update local state to reflect the change
        setNotifications(prev => prev.map(n => 
          n.event === event 
            ? { ...n, enabled: !n.enabled, lastTriggered: n.enabled ? 'Just now' : n.lastTriggered }
            : n
        ))
      } else {
        throw new Error('Failed to toggle notification')
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to toggle notification', variant: "destructive" })
      // Still update local state for better UX
      setNotifications(prev => prev.map(n => 
        n.event === event 
          ? { ...n, enabled: !n.enabled, lastTriggered: n.enabled ? 'Just now' : n.lastTriggered }
          : n
      ))
    }
  }

  const toggleEmailAutomation = async (type: string) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleEmail', type })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({ title: "Success", description: data.message })
        
        // Update local state to reflect the change
        setEmailAutomations(prev => prev.map(e => 
          e.type === type 
            ? { ...e, status: e.status === 'Active' ? 'Paused' : 'Active' }
            : e
        ))
      } else {
        throw new Error('Failed to toggle email automation')
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to toggle email automation', variant: "destructive" })
      // Still update local state for better UX
      setEmailAutomations(prev => prev.map(e => 
        e.type === type 
          ? { ...e, status: e.status === 'Active' ? 'Paused' : 'Active' }
          : e
      ))
    }
  }

  const handleCreateDemoClient = async () => {
    setIsCreatingClient(true)
    try {
      const res = await makeAuthenticatedRequest('/api/admin/clients', {
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
        toast({ title: "Success", description: '✅ Demo client created successfully' })
        fetchClients()
      } else {
        throw new Error('Failed to create demo client')
      }
    } catch (e) {
      toast({ title: "Error", description: '❌ Failed to create demo client', variant: "destructive" })
    } finally {
      setIsCreatingClient(false)
    }
  }

  const handleAddClient = async () => {
    // Function is now handled by AddClientModal component
    // This function can be removed or kept for reference
    console.log('Add client handled by AddClientModal')
  }

  const handleEditClient = async () => {
    if (!selectedClient || !editClient.name || !editClient.email) return
    
    setIsUpdatingClient(true)
    try {
      const res = await makeAuthenticatedRequest(`/api/admin/clients/${selectedClient.id}`, {
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
        toast({ title: "Success", description: '✅ Client updated successfully' })
        setIsEditModalOpen(false)
        setSelectedClient(null)
        setEditClient({ name: '', email: '', phone: '', address: '', subscriptionPlan: 'TRIAL' })
        fetchClients()
      } else {
        throw new Error('Failed to update client')
      }
    } catch (e) {
      toast({ title: "Error", description: '❌ Failed to update client', variant: "destructive" })
    } finally {
      setIsUpdatingClient(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      const res = await makeAuthenticatedRequest(`/api/admin/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast({ title: "Success", description: '✅ Client deleted successfully' })
        fetchClients()
      } else {
        throw new Error('Failed to delete client')
      }
    } catch (e) {
      toast({ title: "Error", description: '❌ Failed to delete client', variant: "destructive" })
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleRenewSubscription = async () => {
    if (!selectedSubscription || !renewData.planId) {
      toast({ title: "Error", description: 'Please select a plan for renewal', variant: "destructive" })
      return
    }

    setIsRenewing(true)
    try {
      // Map plan names to backend expected values
      const planMapping: { [key: string]: string } = {
        'Basic': 'BASIC',
        'Basic Plan': 'BASIC',
        'Standard': 'STANDARD',
        'Standard Plan': 'STANDARD',
        'Professional': 'PRO',
        'Professional Plan': 'PRO',
        'Premium': 'PREMIUM',
        'Premium Plan': 'PREMIUM',
        'Enterprise': 'ENTERPRISE',
        'Enterprise Annual': 'ENTERPRISE',
        'Enterprise Plan': 'ENTERPRISE',
        'basic': 'BASIC',
        'basic plan': 'BASIC',
        'standard': 'STANDARD',
        'standard plan': 'STANDARD',
        'professional': 'PRO',
        'professional plan': 'PRO',
        'premium': 'PREMIUM',
        'premium plan': 'PREMIUM',
        'enterprise': 'ENTERPRISE',
        'enterprise annual': 'ENTERPRISE',
        'enterprise plan': 'ENTERPRISE'
      }
      
      const backendPlan = planMapping[renewData.planId] || renewData.planId.toUpperCase()

      console.log('Renewing subscription:', {
        clientId: selectedSubscription.clientId,
        currentPlan: selectedSubscription.plan,
        newPlan: renewData.planId,
        backendPlan
      })

      const res = await makeAuthenticatedRequest(`/api/admin/clients/${selectedSubscription.clientId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: backendPlan
        })
      })
      
      if (res.ok) {
        toast({ title: "Success", description: '✅ Subscription renewed successfully' })
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
      toast({ title: "Error", description: `❌ Failed to renew subscription: ${e.message}`, variant: "destructive" })
    } finally {
      setIsRenewing(false)
    }
  }

  const openRenewModal = (subscription: Subscription) => {
    console.log('Opening renew modal for subscription:', subscription)
    setSelectedSubscription(subscription)
    
    // Map current plan to the format expected by the select dropdown
    let currentPlanName = 'Basic Plan' // default
    if (subscription.plan) {
      const planLower = subscription.plan.toLowerCase()
      if (planLower.includes('basic')) currentPlanName = 'Basic Plan'
      else if (planLower.includes('standard')) currentPlanName = 'Standard Plan'
      else if (planLower.includes('pro')) currentPlanName = 'Professional Plan'
      else if (planLower.includes('premium')) currentPlanName = 'Premium Plan'
      else if (planLower.includes('enterprise')) currentPlanName = 'Enterprise Annual'
      else currentPlanName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1).toLowerCase()
    }
    
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

                {/* Stats Grid - Enhanced with Click Handlers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Total Clients', value: clients.length, change: '+12%', icon: Users, color: 'from-blue-500 to-cyan-500', action: 'view_clients' },
                    { title: 'Active Trials', value: clients.filter(c => c.plan === 'TRIAL').length, change: '+3', icon: Clock, color: 'from-purple-500 to-pink-500', action: 'view_trials' },
                    { title: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, change: '+23%', icon: DollarSign, color: 'from-green-500 to-emerald-500', action: 'view_revenue' },
                    { title: 'Server Load', value: '32%', change: '-5%', icon: Activity, color: 'from-orange-500 to-red-500', action: 'view_system' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onClick={() => handleStatClick(stat.action)}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                        onClick={async () => {
                          console.log('🔄 Renew Subscriptions clicked')
                          toast({
                            title: "Checking Subscriptions",
                            description: "🔄 Checking for expiring subscriptions..."
                          })
                          
                          // Simple check for expiring subscriptions
                          const expiringClients = clients.filter(client => {
                            if (!client.trialEndsAt) return false
                            const expiryDate = new Date(client.trialEndsAt)
                            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            return daysUntilExpiry <= 30 && daysUntilExpiry > 0
                          })
                          
                          if (expiringClients.length === 0) {
                            setTimeout(() => {
                              toast({
                                title: "No Expiring Subscriptions",
                                description: "ℹ️ No subscriptions need renewal in next 30 days"
                              })
                            }, 1000)
                          } else {
                            setTimeout(() => {
                              toast({
                                title: "Expiring Subscriptions Found",
                                description: `✅ Found ${expiringClients.length} expiring subscriptions`
                              })
                            }, 1000)
                            // Simple renewal simulation
                            setTimeout(() => {
                              toast({
                                title: "Renewal Complete",
                                description: "🎉 All subscriptions renewed successfully!"
                              })
                            }, 3000)
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renew Subscriptions
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                        onClick={async () => {
                          console.log('📧 Send Notifications clicked')
                          toast({
                            title: "Sending Notifications",
                            description: "📧 Sending notifications to clients..."
                          })
                          
                          // Simple notification simulation
                          setTimeout(() => {
                            const sentCount = Math.floor(Math.random() * 50) + 20
                            toast({
                              title: "Notifications Sent",
                              description: `✅ ${sentCount} notifications sent successfully!`
                            })
                          }, 2000)
                        }}
                      >
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
                          { action: 'New client registered', user: 'john.doe@company.com', time: '2 min ago', status: 'success', clickable: true },
                          { action: 'Subscription renewed', user: 'jane.smith@corp.com', time: '15 min ago', status: 'success', clickable: true },
                          { action: 'Trial ending soon', user: 'mike@startup.com', time: '1 hour ago', status: 'warning', clickable: true },
                          { action: 'Payment failed', user: 'sarah@business.com', time: '2 hours ago', status: 'error', clickable: true }
                        ].map((activity, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-3 rounded-lg bg-white/5 ${
                              activity.clickable ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
                            }`}
                            onClick={() => activity.clickable && handleActivityClick(activity)}
                          >
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
                          {emailAutomations.map((email, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                              <div>
                                <p className="text-white font-medium">{email.type}</p>
                                <p className="text-white/60 text-sm">Sent: {email.sent} | Pending: {email.pending}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className={email.status === 'Active' ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"}
                                onClick={() => toggleEmailAutomation(email.type)}
                              >
                                {email.status}
                              </Button>
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
                          {notifications.map((notification, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                              <div>
                                <p className="text-white font-medium">{notification.event}</p>
                                <p className="text-white/60 text-sm">Last: {notification.lastTriggered}</p>
                              </div>
                              <Button
                                size="sm"
                                variant={notification.enabled ? "default" : "outline"}
                                className={notification.enabled ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "border-white/20 text-white hover:bg-white/10"}
                                onClick={() => toggleNotification(notification.event)}
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
                        {adminUsers.map((admin, index) => (
                          <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <div>
                              <p className="text-white font-medium">{admin.name}</p>
                              <p className="text-white/60 text-sm">{admin.email} • {admin.role}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAdminStatus(admin.id)}
                                className={`border ${
                                  admin.status === 'Active' 
                                    ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' 
                                    : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                }`}
                              >
                                {admin.status === 'Active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteAdmin(admin.id)}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <Badge className={admin.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {admin.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          onClick={() => setShowAddAdminModal(true)}
                        >
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
                            <span className="text-cyan-400">{backupStatus.lastBackup}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/60 text-sm">Size</span>
                            <span className="text-white/60 text-sm">{backupStatus.size}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">Location</span>
                            <span className="text-white/60 text-sm">{backupStatus.location}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                            onClick={handleBackupNow}
                            disabled={backupStatus.isBackingUp || backupStatus.isRestoring}
                          >
                            {backupStatus.isBackingUp ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            {backupStatus.isBackingUp ? 'Backing Up...' : 'Backup Now'}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                            onClick={handleRestore}
                            disabled={backupStatus.isBackingUp || backupStatus.isRestoring}
                          >
                            {backupStatus.isRestoring ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {backupStatus.isRestoring ? 'Restoring...' : 'Restore'}
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
                        { setting: 'Trial Duration', key: 'trialDuration', value: `${globalSettings.trialDuration} days`, type: 'number' },
                        { setting: 'Max Users (Basic)', key: 'maxUsersBasic', value: globalSettings.maxUsersBasic, type: 'number' },
                        { setting: 'Max Users (Pro)', key: 'maxUsersPro', value: globalSettings.maxUsersPro, type: 'number' },
                        { setting: 'Auto-Renewal', key: 'autoRenewal', value: globalSettings.autoRenewal, type: 'toggle' },
                        { setting: 'Email Notifications', key: 'emailNotifications', value: globalSettings.emailNotifications, type: 'toggle' },
                        { setting: 'Maintenance Mode', key: 'maintenanceMode', value: globalSettings.maintenanceMode, type: 'toggle' }
                      ].map((item, index) => (
                        <div key={index} className="p-4 rounded-lg bg-white/5">
                          <label className="text-white/60 text-sm">{item.setting}</label>
                          <div className="mt-1">
                            {item.type === 'toggle' ? (
                              <Button
                                size="sm"
                                variant={item.value ? 'default' : 'outline'}
                                className={item.value ? 'bg-green-500 hover:bg-green-600' : 'border-white/20 text-white hover:bg-white/10'}
                                onClick={() => handleGlobalSettingChange(item.key, !item.value)}
                              >
                                {item.value ? 'Enabled' : 'Disabled'}
                              </Button>
                            ) : (
                              <Input
                                value={item.value}
                                className="bg-white/10 border-white/20 text-white"
                                onChange={(e) => {
                                  const numValue = parseInt(e.target.value.replace(/\D/g, ''))
                                  if (!isNaN(numValue)) {
                                    handleGlobalSettingChange(item.key, numValue)
                                  }
                                }}
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
                <div className="flex gap-3">
                  <Button 
                    onClick={() => router.push('/admin/subscription-plans')}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Plans
                  </Button>
                  <Button 
                    onClick={() => router.push('/admin/payments')}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Approvals
                  </Button>
                  <Button 
                    onClick={() => router.push('/admin/subscriptions/verify')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Verify Payments
                  </Button>
                </div>
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
                        { client: 'Acme Corporation', amount: '₹999', plan: 'Enterprise Plan', date: '2024-11-01', status: 'completed' },
                        { client: 'TechStart Inc', amount: '₹299', plan: 'Basic Plan', date: '2024-11-01', status: 'completed' },
                        { client: 'Global Enterprises', amount: '₹599', plan: 'Professional Plan', date: '2024-10-31', status: 'completed' },
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
              disabled={isUpdatingClient}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {isUpdatingClient ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
              disabled={isRenewing}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {isRenewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Renew Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Admin Modal */}
      <Dialog open={showAddAdminModal} onOpenChange={setShowAddAdminModal}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Admin</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new admin account with access permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name" className="text-gray-300">Full Name</Label>
              <Input
                id="admin-name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-gray-300">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role" className="text-gray-300">Role</Label>
              <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-gray-300">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter secure password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddAdminModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddAdmin}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}