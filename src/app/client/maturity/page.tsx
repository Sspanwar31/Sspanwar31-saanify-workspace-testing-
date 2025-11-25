'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Plus,
  Filter,
  Download,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface MaturityRecord {
  id: string
  memberName: string
  schemeName: string
  principalAmount: number
  maturityAmount: number
  interestRate: number
  startDate: string
  maturityDate: string
  status: 'active' | 'matured' | 'claimed' | 'overdue'
  daysRemaining: number
  description?: string
}

export default function MaturityManagement() {
  const [maturityRecords, setMaturityRecords] = useState<MaturityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    fetchMaturityRecords()
  }, [])

  const fetchMaturityRecords = async () => {
    try {
      setLoading(true)
      // Mock data for now
      const mockData: MaturityRecord[] = [
        {
          id: '1',
          memberName: 'Rajesh Kumar',
          schemeName: 'Fixed Deposit - 2 Years',
          principalAmount: 100000,
          maturityAmount: 118000,
          interestRate: 9,
          startDate: '2022-01-15',
          maturityDate: '2024-01-15',
          status: 'matured',
          daysRemaining: 0,
          description: 'Senior Citizen Fixed Deposit'
        },
        {
          id: '2',
          memberName: 'Priya Sharma',
          schemeName: 'Recurring Deposit - 1 Year',
          principalAmount: 50000,
          maturityAmount: 53500,
          interestRate: 7,
          startDate: '2023-06-01',
          maturityDate: '2024-06-01',
          status: 'active',
          daysRemaining: 45,
          description: 'Monthly Recurring Deposit'
        },
        {
          id: '3',
          memberName: 'Amit Patel',
          schemeName: 'Fixed Deposit - 3 Years',
          principalAmount: 200000,
          maturityAmount: 254000,
          interestRate: 9.5,
          startDate: '2021-03-10',
          maturityDate: '2024-03-10',
          status: 'claimed',
          daysRemaining: 0,
          description: 'Long Term Fixed Deposit'
        },
        {
          id: '4',
          memberName: 'Sunita Reddy',
          schemeName: 'Fixed Deposit - 6 Months',
          principalAmount: 75000,
          maturityAmount: 78375,
          interestRate: 8.5,
          startDate: '2024-01-01',
          maturityDate: '2024-07-01',
          status: 'active',
          daysRemaining: 120,
          description: 'Short Term Fixed Deposit'
        }
      ]
      setMaturityRecords(mockData)
    } catch (error) {
      toast.error('Failed to fetch maturity records')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matured': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'claimed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matured': return <Clock className="w-4 h-4" />
      case 'claimed': return <CheckCircle className="w-4 h-4" />
      case 'active': return <TrendingUp className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const filteredRecords = maturityRecords.filter(record => {
    const matchesFilter = filter === 'all' || record.status === filter
    const matchesSearch = record.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.schemeName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: maturityRecords.length,
    active: maturityRecords.filter(r => r.status === 'active').length,
    matured: maturityRecords.filter(r => r.status === 'matured').length,
    claimed: maturityRecords.filter(r => r.status === 'claimed').length,
    totalMaturityAmount: maturityRecords.reduce((sum, r) => sum + r.maturityAmount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maturity Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage deposit maturities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Maturity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Maturity Record</DialogTitle>
                <DialogDescription>
                  Create a new maturity record for a deposit scheme.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member" className="text-right">
                    Member
                  </Label>
                  <Input id="member" placeholder="Enter member name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="scheme" className="text-right">
                    Scheme
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fd">Fixed Deposit</SelectItem>
                      <SelectItem value="rd">Recurring Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input id="amount" type="number" placeholder="Enter amount" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast.success('Maturity record added successfully')
                  setShowAddDialog(false)
                }}>
                  Add Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All maturity records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matured</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.matured}</div>
            <p className="text-xs text-muted-foreground">
              Ready for claim
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claimed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.claimed}</div>
            <p className="text-xs text-muted-foreground">
              Already claimed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalMaturityAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total maturity amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by member name or scheme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="matured">Matured</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maturity Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Records</CardTitle>
          <CardDescription>
            Track all deposit maturities and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Member</th>
                  <th className="text-left p-2">Scheme</th>
                  <th className="text-left p-2">Principal</th>
                  <th className="text-left p-2">Maturity</th>
                  <th className="text-left p-2">Maturity Date</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{record.memberName}</div>
                        <div className="text-sm text-gray-500">{record.description}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{record.schemeName}</div>
                        <div className="text-sm text-gray-500">{record.interestRate}% interest</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">₹{record.principalAmount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Principal</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium text-green-600">₹{record.maturityAmount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Maturity</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{record.maturityDate}</div>
                        <div className="text-sm text-gray-500">
                          {record.daysRemaining > 0 ? `${record.daysRemaining} days left` : 'Ready'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusIcon(record.status)}
                        <span className="ml-1">{record.status}</span>
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {record.status === 'matured' && (
                          <Button 
                            size="sm" 
                            onClick={() => toast.success('Marked as claimed')}
                          >
                            Claim
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}