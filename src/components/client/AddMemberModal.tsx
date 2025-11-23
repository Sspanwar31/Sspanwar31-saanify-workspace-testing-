'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Calendar, Building, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  id?: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'MEMBER' | 'TREASURER'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  membershipId: string
  address: string
  joinDate?: string
  lastLogin?: string | null
}

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (member: Member) => void
  editingMember?: Member | null
}

export default function AddMemberModal({ isOpen, onClose, onSubmit, editingMember }: AddMemberModalProps) {
  const [formData, setFormData] = useState<Member>({
    name: '',
    email: '',
    phone: '',
    role: 'MEMBER',
    status: 'ACTIVE',
    membershipId: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingMember) {
      setFormData(editingMember)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'MEMBER',
        status: 'ACTIVE',
        membershipId: '',
        address: '',
        joinDate: new Date().toISOString().split('T')[0],
        lastLogin: null
      })
    }
    setErrors({})
  }, [editingMember, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.membershipId.trim()) {
      newErrors.membershipId = 'Membership ID is required'
    } else if (formData.membershipId.length < 3) {
      newErrors.membershipId = 'Membership ID must be at least 3 characters'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('⚠️ Validation Error', {
        description: 'Please fix the errors in the form',
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit(formData)
      onClose()
      
      toast.success(editingMember ? '✅ Member Updated' : '✅ Member Added', {
        description: `${formData.name} has been ${editingMember ? 'updated' : 'added'} successfully`,
        duration: 3000
      })
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save member. Please try again.',
        duration: 3000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Member, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateMembershipId = () => {
    const prefix = 'MEM'
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setFormData(prev => ({ ...prev, membershipId: `${prefix}${randomNum}` }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </DialogTitle>
              <DialogDescription>
                {editingMember 
                  ? 'Update the member information below'
                  : 'Fill in the details to add a new member to the society'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Membership ID */}
                <div className="space-y-2">
                  <Label htmlFor="membershipId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Membership ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="membershipId"
                      placeholder="MEM0001"
                      value={formData.membershipId}
                      onChange={(e) => handleInputChange('membershipId', e.target.value)}
                      className={errors.membershipId ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateMembershipId}
                      className="px-3"
                    >
                      Generate
                    </Button>
                  </div>
                  {errors.membershipId && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.membershipId}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Role
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: 'ADMIN' | 'MEMBER' | 'TREASURER') => 
                      handleInputChange('role', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="TREASURER">Treasurer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'PENDING') => 
                      handleInputChange('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, State 12345"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Current Form Data Preview */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Preview
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Name:</span>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formData.name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {formData.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Role:</span>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {formData.role}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <div className="mt-1">
                      <Badge 
                        variant={formData.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={
                          formData.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          formData.status === 'INACTIVE' ? 'bg-slate-100 text-slate-800' :
                          'bg-amber-100 text-amber-800'
                        }
                      >
                        {formData.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingMember ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {editingMember ? 'Update Member' : 'Add Member'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}