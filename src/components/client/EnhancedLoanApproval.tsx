'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  IndianRupee,
  Clock,
  User,
  Calendar,
  Wallet,
  ArrowRight
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Types ---
interface LoanRequest {
  id: string
  memberId: string
  memberName: string
  memberPhone?: string
  loanAmount: number
  interestRate: number
  status: string
  description: string
  createdAt: string
}

interface PassbookEntry {
  mode: string
  deposit?: number  // Main deposit field from API
  depositAmount?: number 
  amount?: number
  date?: string
}

export default function EnhancedLoanApproval() {
  
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null)
  
  // Logic State
  const [memberPassbook, setMemberPassbook] = useState<PassbookEntry[]>([])
  const [passbookLoading, setPassbookLoading] = useState(false)
  const [finalLoanAmount, setFinalLoanAmount] = useState<number>(0)
  const [overrideEnabled, setOverrideEnabled] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  // 1. Fetch Pending Loans
  const fetchPendingLoans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/loan-requests/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingLoans(data.pendingLoans || [])
      } else {
        toast.error('Failed to fetch pending requests')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error fetching requests')
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch Member Total Deposit (Direct API for accurate calculation)
  const fetchMemberTotalDeposit = async (memberId: string) => {
    setPassbookLoading(true)
    try {
      const response = await fetch(`/api/client/members/${memberId}/deposit-total`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Set the member passbook with deposit data for compatibility
          // Use the totalDeposit directly from API response
          setMemberPassbook([{
            mode: 'DEPOSIT',
            deposit: data.totalDeposit, // Use API calculated total
            date: new Date().toISOString().split('T')[0]
          }])
        }
      } else {
        // Fallback to members API if deposit-total fails
        const response2 = await fetch(`/api/client/members?memberId=${memberId}`)
        if(response2.ok) {
           const data2 = await response2.json()
           if (data2.totalDeposits !== undefined) {
             setMemberPassbook([{
               mode: 'DEPOSIT',
               deposit: data2.totalDeposits,
               date: new Date().toISOString().split('T')[0]
             }])
           }
        }
      }
    } catch (error) {
      console.error("Error fetching member deposit", error)
      // Fallback to members API
      try {
        const response2 = await fetch(`/api/client/members?memberId=${memberId}`)
        if(response2.ok) {
           const data2 = await response2.json()
           if (data2.totalDeposits !== undefined) {
             setMemberPassbook([{
               mode: 'DEPOSIT',
               deposit: data2.totalDeposits,
               date: new Date().toISOString().split('T')[0]
             }])
           }
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
    } finally {
      setPassbookLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingLoans()
  }, [])

  // 3. Open Modal Handler
  const openApprovalModal = async (loan: LoanRequest) => {
    setSelectedLoan(loan)
    setFinalLoanAmount(loan.loanAmount)
    setOverrideEnabled(false) 
    setIsApprovalModalOpen(true)
    
    // Fetch member total deposit immediately
    await fetchMemberTotalDeposit(loan.memberId)
  }

  // 4. Submit Approval
  const handleApprove = async () => {
    if (!selectedLoan) return

    setProcessingAction('approve')
    try {
      const response = await fetch('/api/client/loan-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoan.id,
          finalLoanAmount: finalLoanAmount,
          interestRate: 1, // Fixed 1% per month
        })
      })

      if (response.ok) {
        toast.success('Loan Approved Successfully')
        setIsApprovalModalOpen(false)
        setSelectedLoan(null)
        fetchPendingLoans()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve loan')
      }
    } catch (error) {
      toast.error('Failed to approve loan')
    } finally {
      setProcessingAction(null)
    }
  }

  // 5. Reject Logic
  const handleReject = async (loan: LoanRequest) => {
    if (!confirm(`Reject loan request from ${loan.memberName}?`)) return
    setProcessingAction(loan.id)
    try {
      await fetch('/api/client/loan-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId: loan.id })
      })
      toast.success('Loan Rejected')
      fetchPendingLoans()
    } catch (error) {
      toast.error('Failed to reject loan')
    } finally {
      setProcessingAction(null)
    }
  }

  // Helper: Currency Formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // --- FIXED CALCULATIONS (Using correct 'deposit' field from API) ---
  const totalDeposits = memberPassbook
    .filter((entry) => {
      const mode = (entry.mode || '').toLowerCase()
      return mode.includes('deposit') && !mode.includes('interest') // safer check
    })
    .reduce((sum, entry) => {
      // Use the 'deposit' field from API response first, then fallback to other fields
      const val = Number(entry.deposit) || Number(entry.depositAmount) || Number(entry.amount) || 0
      return sum + val
    }, 0)
  
  const limitAmount = totalDeposits * 0.8
  const isLimitExceeded = finalLoanAmount > limitAmount
  const canApprove = !isLimitExceeded || overrideEnabled

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold">Loan Requests</h1>
          <p className="text-gray-500">Manage approval requests</p>
        </div>
        <Button variant="outline" onClick={fetchPendingLoans} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4"/> Pending Requests</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingLoans.length}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><IndianRupee className="h-4 w-4"/> Total Requested Amount</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(pendingLoans.reduce((s, l) => s + l.loanAmount, 0))}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4"/> Average Request</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {pendingLoans.length > 0 
                  ? formatCurrency(pendingLoans.reduce((s, l) => s + l.loanAmount, 0) / pendingLoans.length)
                  : formatCurrency(0)
                }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Loans Table (Clean Layout) */}
      <Card>
        <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
             <div className="py-8 text-center">Loading requests...</div>
          ) : pendingLoans.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2 opacity-50"/>
              <p>No pending loan requests found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <User className="h-4 w-4"/>
                          </div>
                          <div>
                            <p className="font-semibold">{loan.memberName}</p>
                            <p className="text-xs text-gray-500">ID hidden</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(loan.loanAmount)}</TableCell>
                      <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => openApprovalModal(loan)} className="bg-green-600 hover:bg-green-700 text-white h-8">
                            Approve
                          </Button>
                          <Button size="sm" onClick={() => handleReject(loan)} variant="destructive" className="h-8">
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* FINAL APPROVED MODAL DESIGN (FIXED LOGIC) */}
      {/* ========================================================= */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
               Approve Loan <ArrowRight className="h-4 w-4 text-gray-400"/>
            </DialogTitle>
            <DialogDescription>
              Enter loan details to approve (1% monthly interest)
            </DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="grid gap-5 py-2">
              
              {/* 1. Member Info */}
              <div className="flex flex-col gap-1">
                <Label className="text-gray-500 text-xs uppercase tracking-wide">Member</Label>
                <div className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {selectedLoan.memberName}
                </div>
              </div>

              {/* 2. Deposit & Limit Stats (API DATA) */}
              <div className="bg-slate-50 dark:bg-slate-900 border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500"/> Total Deposit
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {passbookLoading ? "Calculating..." : formatCurrency(totalDeposits)}
                  </span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">80% Eligibility Limit</span>
                  <span className={`font-bold ${isLimitExceeded && !overrideEnabled ? 'text-red-500' : 'text-green-600'}`}>
                    {passbookLoading ? "..." : formatCurrency(limitAmount)}
                  </span>
                </div>
              </div>

              {/* 3. Warning (Only if limit exceeded) */}
              {isLimitExceeded && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-3 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Limit Exceeded</p>
                    <p className="text-xs text-red-600 mt-1">
                      Requested amount is greater than 80% of deposits. You must enable override to proceed.
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Loan Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Final Loan Amount (₹)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={finalLoanAmount}
                  onChange={(e) => setFinalLoanAmount(Number(e.target.value))}
                  className={`text-lg font-medium ${isLimitExceeded && !overrideEnabled ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
              </div>

              {/* 5. Override Toggle */}
              <div className="flex items-center space-x-3 pt-1 p-2 rounded hover:bg-gray-50 transition-colors">
                <Switch 
                  id="override" 
                  checked={overrideEnabled}
                  onCheckedChange={setOverrideEnabled}
                />
                <Label htmlFor="override" className="text-sm font-medium cursor-pointer text-gray-700">
                  Allow 100% loan (override 80% limit)
                </Label>
              </div>

              {/* 6. Static Info Footer (Fixed 1%) */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div className="bg-gray-50 p-2 rounded text-center border">
                  <p className="text-gray-500 text-xs">Interest Rate</p>
                  <p className="font-semibold text-gray-900">1% / month</p>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center border">
                  <p className="text-gray-500 text-xs">Loan Date</p>
                  <p className="font-semibold text-gray-900">Current Month</p>
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={!canApprove || processingAction === 'approve'}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {processingAction === 'approve' ? 'Processing...' : 'Approve Loan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}