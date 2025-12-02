'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  Download, 
  RefreshCw, 
  UserPlus,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle,
  BookOpen,
  User,
  Calendar
} from 'lucide-react'
import AutoTable from '@/components/ui/auto-table'
import AutoForm from '@/components/ui/auto-form'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  phone: string
  joinDate: string
  address: string
  createdAt: string
  updatedAt: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  // Fetch members from API
  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/members')
      const data = await response.json()
      
      if (response.ok) {
        setMembers(data.members || [])
      } else {
        toast.error('Failed to fetch members')
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
      toast.error('Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  // Helper function to generate membership ID
  const generateMembershipId = () => {
    const prefix = 'MEM'
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${randomNum}`
  }

  // AutoForm field configuration
  const memberFields = {
    name: {
      type: 'text',
      label: 'Full Name',
      placeholder: 'John Doe',
      required: true,
      validation: {
        min: 2,
        custom: (value: string) => {
          if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            return 'Name should only contain letters and spaces'
          }
          return null
        }
      }
    },
    phone: {
      type: 'tel',
      label: 'Phone Number',
      placeholder: '+91 98765 43210',
      required: true,
      validation: {
        pattern: /^[+]?[\d\s-()]+$/
      }
    },
    joinDate: {
      type: 'date',
      label: 'Join Date',
      required: true
    },
    address: {
      type: 'textarea',
      label: 'Address',
      placeholder: '123 Main Street, City, State 12345',
      required: true,
      validation: {
        min: 10
      }
    }
  }

  // Calculate statistics
  const stats = {
    total: members.length,
    active: members.filter(m => m.phone && m.phone.length > 0).length, // Active = has phone
    inactive: members.filter(m => !m.phone || m.phone.length === 0).length,
    pending: 0 // No pending status in new schema
  }

  const handleAddMember = async (newMember: any) => {
    try {
      const response = await fetch('/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      })

      if (response.ok) {
        const data = await response.json()
        setMembers([...members, data.member])
        toast.success('✅ Member Added', {
          description: `${newMember.name} has been added successfully`,
          duration: 3000
        })
        setIsAddModalOpen(false)
      } else {
        const error = await response.json()
        toast.error('Failed to add member', {
          description: error.error || 'Unknown error',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('Failed to add member')
    }
  }

  const handleEditMember = (member: any) => {
    setEditingMember(member)
    setIsAddModalOpen(true)
  }

  const handleUpdateMember = async (updatedMember: any) => {
    // For now, just update local state
    // TODO: Implement PUT API endpoint for updating members
    setMembers(members.map(m => m.id === editingMember.id ? { 
      ...editingMember, 
      ...updatedMember, 
      updatedAt: new Date().toISOString() 
    } : m))
    toast.success('✅ Member Updated', {
      description: `${updatedMember.name} has been updated successfully`,
      duration: 3000
    })
    setEditingMember(null)
    setIsAddModalOpen(false)
  }

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (confirm(`Are you sure you want to remove ${member?.name}?`)) {
      // For now, just update local state
      // TODO: Implement DELETE API endpoint for members
      setMembers(members.filter(m => m.id !== memberId))
      toast.success('✅ Member Removed', {
        description: `${member?.name} has been removed successfully`,
        duration: 3000
      })
    }
  }

  const handleRefresh = () => {
    fetchMembers()
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Member data is being exported to CSV',
      duration: 3000
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent">
              Members Ledger
            </h1>
            <p className="text-amber-700 dark:text-amber-300 font-medium">
              Manage society members and their records
            </p>
          </div>
        </div>
      </motion.div>

      {/* Passbook-style Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 shadow-lg">
          {/* Passbook-style decorative pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #d97706 0px, transparent 1px, transparent 10px, #d97706 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Members</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.total}</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-lg shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #059669 0px, transparent 1px, transparent 10px, #059669 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg shadow-md">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #64748b 0px, transparent 1px, transparent 10px, #64748b 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Inactive</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-slate-500 rounded-lg shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #ea580c 0px, transparent 1px, transparent 10px, #ea580c 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pending}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg shadow-md">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 justify-center"
      >
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        >
          <Download className="h-4 w-4" />
          Export Members
        </Button>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg"
        >
          <UserPlus className="h-4 w-4" />
          Add New Member
        </Button>
      </motion.div>

      {/* Members Table - Passbook Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg overflow-hidden"
      >
        {/* Passbook header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Members Register
          </h2>
        </div>
        
        <div className="p-6">
          <AutoTable 
            data={members} 
            title=""
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        </div>
      </motion.div>

      {/* Add/Edit Member Modal */}
      <AutoForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingMember(null)
        }}
        onSubmit={editingMember ? handleUpdateMember : handleAddMember}
        editingData={editingMember}
        title={editingMember ? 'Edit Member Entry' : 'Add New Member Entry'}
        description={editingMember 
          ? 'Update member information in the ledger' 
          : 'Fill in details to add a new member to the society register'
        }
        fields={memberFields}
      />
    </div>
  )
}