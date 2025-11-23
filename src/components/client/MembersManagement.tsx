'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Download,
  Upload,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserPlus,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import EnhancedActionsDropdown from '@/components/admin/EnhancedActionsDropdown'

interface Member {
  id: string
  name: string
  email: string
  phone: string
  role: 'MEMBER' | 'TREASURER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  joinDate: string
  lastLogin?: string
  avatar?: string
  address?: string
  membershipId?: string
  loanCount?: number
  savingsAmount?: number
  monthlyContribution?: number
}

interface MembersManagementProps {
  societyInfo: {
    id: string
    name: string
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'LOCKED'
    subscriptionPlan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    adminName: string
    adminEmail: string
    adminPhone: string
    address?: string
    totalMembers?: number
  }
}

interface AddMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  societyId: string
}

interface EditMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  member: Member | null
  societyId: string
}

export function AddMemberModal({ open, onOpenChange, onSuccess, societyId }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MEMBER',
    address: '',
    membershipId: '',
    avatar: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          societyId,
          joinDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Member added successfully', {
          description: `${formData.name} has been added to ${societyId}`,
          duration: 3000,
        })
        onOpenChange(false)
        onSuccess()
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'MEMBER',
          address: '',
          membershipId: '',
          avatar: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Add New Member
          </DialogTitle>
          <DialogDescription>
            Add a new member to {societyId}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="TREASURER">Treasurer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Address
            </label>
            <Input
              id="address"
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="membershipId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Membership ID
            </label>
            <Input
              id="membershipId"
              placeholder="MEM-001"
              value={formData.membershipId}
              onChange={(e) => setFormData(prev => ({ ...prev, membershipId: e.target.value }))}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditMemberModal({ open, onOpenChange, onSuccess, member, societyId }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    role: member?.role || 'MEMBER',
    address: member?.address || '',
    membershipId: member?.membershipId || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }
    
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/members/${member?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Member updated successfully')
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Member
          </DialogTitle>
          <DialogDescription>
            Update member information for {member?.name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="TREASURER">Treasurer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Address
            </label>
            <Input
              id="address"
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Updating...' : 'Update Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MembersManagement({ societyInfo }: MembersManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editModal, setEditModal] = useState<{
    open: boolean
    member: Member | null
    onOpenChange: (open: boolean) => void
  }>({ open: false, member: null, onOpenChange: () => {} })

  // Mock data
  const mockMembers: Member[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinDate: '2024-01-15',
      lastLogin: '2024-10-28',
      avatar: '/avatars/john.jpg',
      address: '123 Main St, New York, NY 10001',
      membershipId: 'MEM001',
      loanCount: 2,
      savingsAmount: 5000,
      monthlyContribution: 150
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      role: 'TREASURER',
      status: 'ACTIVE',
      joinDate: '2024-02-01',
      lastLogin: '2024-10-27',
      avatar: '/avatars/jane.jpg',
      address: '456 Oak Street, Brooklyn, NY 11201',
      membershipId: 'MEM002',
      loanCount: 5,
      savingsAmount: 12000,
      monthlyContribution: 300
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1 (555) 234-5678',
      role: 'MEMBER',
      status: 'INACTIVE',
      joinDate: '2023-12-10',
      lastLogin: '2024-09-15',
      avatar: '/avatars/bob.jpg',
      address: '789 Pine Street, San Francisco, CA 94102',
      membershipId: 'MEM003',
      loanCount: 1,
      savingsAmount: 2500,
      monthlyContribution: 100
    },
    {
      id: '4',
      name: 'Mary Williams',
      email: 'mary.williams@example.com',
      phone: '+1 (555) 345-6789',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinDate: '2024-03-05',
      lastLogin: '2024-10-26',
      avatar: '/avatars/mary.jpg',
      address: '321 Oak Street, Boston, MA 02108',
      membershipId: 'MEM004',
      loanCount: 3,
      savingsAmount: 15000,
      monthlyContribution: 500
    }
  ]

  const fetchMembers = async () => {
    try {
      setLoading(true)
      // In a real app, this would fetch from the API
      // For now, use mock data
      setTimeout(() => {
        setMembers(mockMembers)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch members:', error)
      toast.error('Failed to load members')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone?.includes(searchTerm)
    const matchesRole = selectedRole === 'all' || member.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleAddMember = () => {
    setIsAddModalOpen(true)
  }

  const handleEditMember = (member: Member) => {
    setEditModal({ open: true, member })
  }

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        const response = await fetch(`/api/members/${memberId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          toast.success('Member deleted successfully')
          fetchMembers()
        } else {
          toast.error('Failed to delete member')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    }
  }

  const handleBulkAction = async (action: string, memberIds: string[]) => {
    try {
      const response = await fetch('/api/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, memberIds })
      })

      if (response.ok) {
        toast.success(`Bulk ${action} completed successfully`)
        fetchMembers()
      } else {
        toast.error(`Failed to ${action} members`)
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200',
      INACTIVE: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200',
      PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200',
      LOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200'
    }
    
    return (
      <Badge className={cn(variants[status as keyof typeof variants] || variants.ACTIVE, 'font-medium')}>
        {status}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      MEMBER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200',
      TREASURER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200',
      ADMIN: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200'
    }
    
    return (
      <Badge className={cn(variants[role as keyof typeof variants] || variants.MEMBER, 'font-medium')}>
        {role}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Members Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage {members.length} members across all roles
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleAddMember}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
          
          <Button
            variant="outline"
            onClick={() => fetchMembers()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleBulkAction('activate', members.filter(m => m.status === 'INACTIVE'))}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Activate All
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleBulkAction('deactivate', members.filter(m => m.status === 'ACTIVE'))}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Deactivate All
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="border-2 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="TREASURER">Treasurer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="px-3"
              >
                <RefreshCw className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="border-2 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                      
                      <TableCell>
                        <div className="text-slate-900 dark:text-white">
                          {member.phone || 'Not provided'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getRoleBadge(member.role)}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(member.status)}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMember(member.id)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          
                          {member.status === 'ACTIVE' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMember(member)}
                              className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                            >
                              <Edit className="h-4 w-4 text-emerald-600" />
                            </Button>
                          ) : member.status === 'LOCKED' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlockMember(member.id)}
                              className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                            >
                              <Unlock className="h-4 w-4 text-emerald-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLockMember(member.id)}
                              className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                            >
                              <Lock className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const handleViewMember = (memberId: string) => {
    // Navigate to member details view
    toast.info('Member Details', {
      description: `Viewing details for ${members.find(m => m.id === memberId)?.name || 'Unknown'}`,
      duration: 2000,
    })
    // In a real app, this would navigate to a member detail page
  }

  const handleEditMember = (member: Member) => {
    setEditModal({ open: true, member })
  }

  const handleUnlockMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock' })
      })

      if (response.ok) {
        toast.success('Member unlocked successfully')
        fetchMembers()
      } else {
        toast.error('Failed to unlock member')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleLockMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' })
      })

      if (response.ok) {
        toast.success('Member locked successfully')
        fetchMembers()
      } else {
        toast.error('Failed to lock member')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/members/${memberId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          toast.success('Member deleted successfully')
          fetchMembers()
        } else {
          toast.error('Failed to delete member')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    }
  }

  return (
    <>
      <AddMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          fetchMembers()
        }}
        societyId={societyInfo?.id || ''}
      />
      
      <EditMemberModal
        open={editModal.open}
        onOpenChange={setEditModal}
        onSuccess={() => {
          fetchMembers()
        }}
        member={editModal.member}
        societyId={societyInfo?.id || ''}
      />
      
      <EnhancedActionsDropdown
        actions={[
          {
            label: 'View Details',
            icon: <Eye className="h-4 w-4" />,
            action: 'view',
            onClick: () => handleViewMember(member.id)
          },
          {
            label: 'Edit',
            icon: <Edit className="h-4 w-4" />,
            action: 'edit',
            onClick: () => handleEditMember(member)
          },
          {
            label: member.status === 'ACTIVE' ? 'Lock Account' : 'Unlock Account',
            icon: member.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />,
            action: member.status === 'ACTIVE' ? 'lock' : 'unlock',
            onClick: () => member.status === 'ACTIVE' ? handleLockMember(member.id) : handleUnlockMember(member.id)
          },
          {
            label: member.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account',
            icon: member.status === 'LOCKED' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
            action: member.status === 'LOCKED' ? 'unlock' : 'lock',
            onClick: () => member.status === 'LOCKED' ? handleUnlockMember(member.id) : handleLockMember(member.id)
          },
          {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4 text-red-600" />,
            action: 'delete',
            onClick: () => handleDeleteMember(member.id)
          }
        ]}
        onBulkAction={handleBulkAction}
      />
    </>
  )
}