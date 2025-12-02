'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Users, 
  Calendar, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calculator,
  IndianRupee,
  Percent,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Info,
  ToggleLeft
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import LoanRequestCard from './LoanRequestCard'

// Types
interface MemberDepositInfo {
  totalDeposits: number
  eightyPercentLimit: number
  depositEntries: Array<{
    amount: number
    date: string
    description: string
  }>
}

interface ApprovalDetails {
  finalLoanAmount: number
  interestRate: number
  installmentsCount: number
  installmentAmount: number
  totalPayable: number
  totalInterest: number
  monthlyInterest: number
  loanDate: string
}

export default function EnhancedLoanApproval() {
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null)
  const [memberDepositInfo, setMemberDepositInfo] = useState<MemberDepositInfo | null>(null)
  const [approvalDetails, setApprovalDetails] = useState<ApprovalDetails>({
    finalLoanAmount: 0,
    interestRate: 12,
    installmentsCount: 12,
    installmentAmount: 0,
    totalPayable: 0,
    totalInterest: 0,
    monthlyInterest: 0,
    loanDate: new Date().toISOString().split('T')[0]
  })
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [overrideEnabled, setOverrideEnabled] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string>('')

  // Fetch pending loan requests
  const fetchPendingLoans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/loan-requests/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingLoans(data.pendingLoans || [])
      } else {
        toast.error('Failed to fetch pending loan requests')
      }
    } catch (error) {
      console.error('Error fetching pending loans:', error)
      toast.error('Failed to fetch pending loan requests')
    } finally {
      setLoading(false)
    }
  }

  // Fetch member deposit information
  const fetchMemberDepositInfo = async (memberId: string) => {
    try {
      const response = await fetch(`/api/client/passbook?memberId=${memberId}`)
      if (response.ok) {
        const data = await response.json()
        const depositEntries = data.entries?.filter((entry: any) => 
          entry.mode === 'Deposit' && entry.depositAmount > 0
        ) || []
        
        const totalDeposits = depositEntries.reduce((sum: number, entry: any) => 
          sum + (entry.depositAmount || 0), 0
        )
        
        const eightyPercentLimit = totalDeposits * 0.8
        
        setMemberDepositInfo({
          totalDeposits,
          eightyPercentLimit,
          depositEntries
        })
      }
    } catch (error) {
      console.error('Error fetching member deposit info:', error)
    }
  }

  useEffect(() => {
    fetchPendingLoans()
  }, [])

  // Auto-calculate EMI and other values
  const calculateLoanDetails = (principal: number, annualRate: number, tenureMonths: number) => {
    const monthlyRate = annualRate / 12 / 100
    const emi = principal > 0 && annualRate > 0 && tenureMonths > 0 
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      : 0
    
    const totalPayable = emi * tenureMonths
    const totalInterest = totalPayable - principal
    const monthlyInterest = principal * (annualRate / 100) / 12
    
    return {
      installmentAmount: Math.round(emi * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      monthlyInterest: Math.round(monthlyInterest * 100) / 100
    }
  }

  // Update approval details and auto-calculate
  const updateApprovalDetails = (field: keyof ApprovalDetails, value: number | string) => {
    const updated = { ...approvalDetails, [field]: value }
    
    // Auto-calculate when principal, rate, or tenure changes
    if (field === 'finalLoanAmount' || field === 'interestRate' || field === 'installmentsCount') {
      const calculated = calculateLoanDetails(
        updated.finalLoanAmount,
        updated.interestRate,
        updated.installmentsCount
      )
      
      updated.installmentAmount = calculated.installmentAmount
      updated.totalPayable = calculated.totalPayable
      updated.totalInterest = calculated.totalInterest
      updated.monthlyInterest = calculated.monthlyInterest
    }
    
    setApprovalDetails(updated)
    
    // Validate against 80% limit
    if (field === 'finalLoanAmount' && memberDepositInfo) {
      validateLoanAmount(updated.finalLoanAmount)
    }
  }

  // Validate loan amount against 80% limit
  const validateLoanAmount = (amount: number) => {
    if (!memberDepositInfo || overrideEnabled) {
      setValidationWarning('')
      return
    }
    
    if (amount > memberDepositInfo.eightyPercentLimit) {
      setValidationWarning(`Loan amount exceeds 80% eligibility limit. Maximum allowed: ₹${memberDepositInfo.eightyPercentLimit.toLocaleString('en-IN')}`)
    } else {
      setValidationWarning('')
    }
  }

  // Handle approval
  const handleApprove = async () => {
    if (!selectedLoan) return

    // Final validation
    if (!overrideEnabled && memberDepositInfo && approvalDetails.finalLoanAmount > memberDepositInfo.eightyPercentLimit) {
      toast.error('Loan amount exceeds 80% eligibility limit')
      return
    }

    setProcessingAction('approve')
    try {
      const response = await fetch('/api/client/loan-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoan.id,
          finalLoanAmount: approvalDetails.finalLoanAmount,
          interestRate: approvalDetails.interestRate,
          installmentsCount: approvalDetails.installmentsCount,
          installmentAmount: approvalDetails.installmentAmount
        })
      })

      if (response.ok) {
        toast.success('✅ Loan Approved', {
          description: `Loan for ${selectedLoan.memberName} has been approved successfully`,
          duration: 3000
        })
        setIsApprovalModalOpen(false)
        setSelectedLoan(null)
        setOverrideEnabled(false)
        setValidationWarning('')
        fetchPendingLoans()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve loan')
      }
    } catch (error) {
      console.error('Error approving loan:', error)
      toast.error('Failed to approve loan')
    } finally {
      setProcessingAction(null)
    }
  }

  // Handle rejection
  const handleReject = async (loan: LoanRequest) => {
    if (!confirm(`Are you sure you want to reject loan request from ${loan.memberName}?`)) {
      return
    }

    setProcessingAction(loan.id)
    try {
      const response = await fetch('/api/client/loan-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId: loan.id })
      })

      if (response.ok) {
        toast.success('✅ Loan Rejected', {
          description: `Loan request from ${loan.memberName} has been rejected`,
          duration: 3000
        })
        fetchPendingLoans()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject loan')
      }
    } catch (error) {
      console.error('Error rejecting loan:', error)
      toast.error('Failed to reject loan')
    } finally {
      setProcessingAction(null)
    }
  }

  // Open approval modal with loan details
  const openApprovalModal = async (loan: LoanRequest) => {
    setSelectedLoan(loan)
    await fetchMemberDepositInfo(loan.memberId)
    
    setApprovalDetails({
      finalLoanAmount: loan.loanAmount,
      interestRate: 12,
      installmentsCount: 12,
      installmentAmount: 0,
      totalPayable: 0,
      totalInterest: 0,
      monthlyInterest: 0,
      loanDate: new Date().toISOString().split('T')[0]
    })
    
    // Calculate initial values
    const calculated = calculateLoanDetails(loan.loanAmount, 12, 12)
    setApprovalDetails(prev => ({
      ...prev,
      installmentAmount: calculated.installmentAmount,
      totalPayable: calculated.totalPayable,
      totalInterest: calculated.totalInterest,
      monthlyInterest: calculated.monthlyInterest
    }))
    
    // Validate against 80% limit
    setTimeout(() => validateLoanAmount(loan.loanAmount), 100)
    
    setIsApprovalModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
  }

  const getLimitStatusBadge = (amount: number) => {
    if (!memberDepositInfo) return null
    
    if (overrideEnabled) {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
          Override Enabled
        </Badge>
      )
    }
    
    if (amount > memberDepositInfo.eightyPercentLimit) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          Exceeds Limit
        </Badge>
      )
    }
    
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          Within Limit
      </Badge>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Requests</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage member loan approval requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-2 text-sm">
              {pendingLoans.length} Pending Requests
            </Badge>
            <Button
              variant="outline"
              onClick={fetchPendingLoans}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLoans.length}</div>
              <p className="text-xs text-amber-100">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requested</CardTitle>
              <IndianRupee className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pendingLoans.reduce((sum, loan) => sum + loan.loanAmount, 0))}
              </div>
              <p className="text-xs text-blue-100">Sum of all requests</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Request Amount</CardTitle>
              <Calculator className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingLoans.length > 0 
                  ? formatCurrency(pendingLoans.reduce((sum, loan) => sum + loan.loanAmount, 0) / pendingLoans.length)
                  : formatCurrency(0)
                }
              </div>
              <p className="text-xs text-green-100">Average loan size</p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Requests Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pending Loan Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : pendingLoans.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Pending Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All loan requests have been processed. Check back later for new requests.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {loan.memberName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {loan.memberId}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4" />
                            {loan.memberPhone || 'Not provided'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            Requested on {formatDate(loan.createdAt)}
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Requested Amount</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(loan.loanAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Interest Rate</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {loan.interestRate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Status</p>
                              <div>{getStatusBadge(loan.status)}</div>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Description</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {loan.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => openApprovalModal(loan)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={processingAction === loan.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(loan)}
                          variant="destructive"
                          disabled={processingAction === loan.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              Loan Approval - Enhanced Review
            </DialogTitle>
            <DialogDescription>
              Review member information and set final loan terms with 80% limit validation
            </DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-6">
              {/* A) Member Info Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Member Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Member Name</p>
                    <p className="font-medium text-blue-800 dark:text-blue-200">{selectedLoan.memberName}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Member ID</p>
                    <p className="font-medium text-blue-800 dark:text-blue-200">{selectedLoan.memberId}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Total Deposit</p>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {memberDepositInfo ? formatCurrency(memberDepositInfo.totalDeposits) : 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">80% Limit</p>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {memberDepositInfo ? formatCurrency(memberDepositInfo.eightyPercentLimit) : 'Loading...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* B) Loan Amount Input Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="finalLoanAmount">Final Loan Amount (₹)</Label>
                  <Input
                    id="finalLoanAmount"
                    type="number"
                    value={approvalDetails.finalLoanAmount}
                    onChange={(e) => updateApprovalDetails('finalLoanAmount', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    {getLimitStatusBadge(approvalDetails.finalLoanAmount)}
                  </div>
                </div>

                {/* Validation Warning */}
                {validationWarning && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-800 dark:text-red-200">Loan amount exceeds 80% eligibility limit.</p>
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{validationWarning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Override Toggle */}
                {(validationWarning && memberDepositInfo) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-semibold text-amber-800 dark:text-amber-200">Override 80% Limit</p>
                          <p className="text-amber-600 dark:text-amber-400 text-sm">
                            Enable override to allow loan amount exceeding 80% limit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label htmlFor="override-toggle" className="cursor-pointer">
                          Allow loan (override 80% limit)
                        </Label>
                        <Switch
                          id="override-toggle"
                          checked={overrideEnabled}
                          onCheckedChange={(checked) => {
                            setOverrideEnabled(checked)
                            if (checked) {
                              setValidationWarning('')
                            } else {
                              validateLoanAmount(approvalDetails.finalLoanAmount)
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    {overrideEnabled && (
                      <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                        <p className="text-purple-800 dark:text-purple-200 text-sm font-medium flex items-center gap-2">
                          <ToggleLeft className="h-4 w-4" />
                          Loan override enabled by client.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* C) Auto Calculations Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={approvalDetails.interestRate}
                    onChange={(e) => updateApprovalDetails('interestRate', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="installmentsCount">Number of Installments</Label>
                  <Select 
                    value={approvalDetails.installmentsCount.toString()} 
                    onValueChange={(value) => updateApprovalDetails('installmentsCount', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="18">18 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="36">36 Months</SelectItem>
                      <SelectItem value="48">48 Months</SelectItem>
                      <SelectItem value="60">60 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-calculated Values Display */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Auto-Calculated Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-green-600 dark:text-green-400">Monthly Interest</p>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      {formatCurrency(approvalDetails.monthlyInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 dark:text-green-400">Monthly EMI</p>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      {formatCurrency(approvalDetails.installmentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 dark:text-green-400">Total Payable</p>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      {formatCurrency(approvalDetails.totalPayable)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 dark:text-green-400">Total Interest</p>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      {formatCurrency(approvalDetails.totalInterest)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Date */}
              <div>
                <Label htmlFor="loanDate">Loan Date</Label>
                <Input
                  id="loanDate"
                  type="date"
                  value={approvalDetails.loanDate}
                  onChange={(e) => updateApprovalDetails('loanDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApprovalModalOpen(false)
                setSelectedLoan(null)
                setOverrideEnabled(false)
                setValidationWarning('')
              }}
              disabled={processingAction === 'approve'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processingAction === 'approve' || !selectedLoan || (validationWarning && !overrideEnabled)}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingAction === 'approve' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}