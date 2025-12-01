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
  CheckCircle
} from 'lucide-react'
import AutoTable from '@/components/ui/auto-table'
import AutoForm from '@/components/ui/auto-form'
import { membersData } from '@/data/membersData'
import { toast } from 'sonner'

export default function MembersPage() {
  const [members, setMembers] = useState(membersData)
  const [loading, setLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

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
    email: {
      type: 'email',
      label: 'Email Address',
      placeholder: 'john@example.com',
      required: true,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    },
    phone: {
      type: 'tel',
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567',
      required: true,
      validation: {
        pattern: /^[+]?[\d\s-()]+$/
      }
    },
    status: {
      type: 'select',
      label: 'Status',
      required: true,
      options: ['ACTIVE', 'INACTIVE', 'PENDING']
    },
    membershipId: {
      type: 'text-with-button',
      label: 'Membership ID',
      placeholder: 'MEM0001',
      required: true,
      buttonText: 'Generate',
      onButtonClick: generateMembershipId,
      validation: {
        min: 3,
        custom: (value: string) => {
          if (!/^MEM\d+$/.test(value.trim())) {
            return 'Membership ID should start with MEM followed by numbers'
          }
          return null
        }
      }
    },
    address: {
      type: 'textarea',
      label: 'Address',
      placeholder: '123 Main Street, City, State 12345',
      required: true,
      validation: {
        min: 10
      }
    },
    fatherHusbandName: {
      type: 'text',
      label: 'Father/Husband Name',
      placeholder: 'Enter father or husband name',
      required: false
    },
    joinDate: {
      type: 'date',
      label: 'Join Date',
      required: false
    }
  }

  // Calculate statistics
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    inactive: members.filter(m => m.status === 'inactive').length,
    pending: members.filter(m => m.status === 'pending').length
  }

  const handleAddMember = (newMember: any) => {
    const memberWithId = {
      ...newMember,
      id: `uuid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setMembers([...members, memberWithId])
    toast.success('✅ Member Added', {
      description: `${newMember.name} has been added successfully`,
      duration: 3000
    })
  }

  const handleEditMember = (member: any) => {
    setEditingMember(member)
    setIsAddModalOpen(true)
  }

  const handleUpdateMember = (updatedMember: any) => {
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

  const handleDeleteMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (confirm(`Are you sure you want to remove ${member?.name}?`)) {
      setMembers(members.filter(m => m.id !== memberId))
      toast.success('✅ Member Removed', {
        description: `${member?.name} has been removed successfully`,
        duration: 3000
      })
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('🔄 Data Refreshed', {
        description: 'Member data has been refreshed',
        duration: 2000
      })
    }, 1000)
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Member data is being exported to CSV',
      duration: 3000
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Members Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage society members, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Members</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inactive</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Table - Using AutoTable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AutoTable 
          data={members} 
          title="Members"
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
        />
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
        title={editingMember ? 'Edit Member' : 'Add New Member'}
        description={editingMember 
          ? 'Update member information below' 
          : 'Fill in details to add a new member to the society'
        }
        fields={memberFields}
      />
    </div>
  )
}