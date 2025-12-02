'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  HandCoins, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import AutoTable from '@/components/ui/auto-table'
import { reportsData } from '@/data/reportsData'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [reports, setReports] = useState(reportsData)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month')
  const [isGenerating, setIsGenerating] = useState(false)

  // Calculate statistics based on enhanced reports data
  const stats = useMemo(() => ({
    totalReports: reports.length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    totalDownloads: reports.reduce((sum, r) => sum + r.downloads, 0)
  }), [reports])

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesType = selectedType === 'all' || report.type === selectedType
      return matchesType
    })
  }, [reports, selectedType])

  const handleGenerateReport = (type: string) => {
    setIsGenerating(true)
    setTimeout(() => {
      // In a real application, this would trigger report generation
      const newReport = {
        id: `report-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type: type.toUpperCase(),
        period: selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1),
        status: 'completed',
        generatedAt: new Date().toISOString(),
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        downloads: 0
      }
      
      setReports([newReport, ...reports])
      setIsGenerating(false)
      toast.success('✅ Report Generated', {
        description: `${type} report has been generated successfully`,
        duration: 3000
      })
    }, 2000)
  }

  const handleDownloadReport = (reportId: string, format: 'pdf' | 'csv') => {
    // In a real application, this would trigger file download
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, downloads: report.downloads + 1 }
        : report
    ))
    
    toast.success('📄 Report Downloaded', {
      description: `Report downloaded as ${format.toUpperCase()}`,
      duration: 2000
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('🔄 Data Refreshed', {
        description: 'Reports data has been refreshed',
        duration: 2000
      })
    }, 1000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const variants = {
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getTypeColor = (type: string) => {
    const variants = {
      FINANCIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      MEMBER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      LOAN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      EXPENSE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      SUMMARY: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
    }
    return variants[type as keyof typeof variants] || variants.SUMMARY
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
              <FileText className="h-8 w-8 text-purple-600" />
              Reports Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Generate and manage all society reports and analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
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
              onClick={() => handleGenerateReport('financial')}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Reports</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalReports}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completedReports}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingReports}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Downloads</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalDownloads}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg p-6 mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('financial')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Financial
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('member')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Members
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('loan')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <HandCoins className="h-4 w-4" />
              Loans
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('expense')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <PieChart className="h-4 w-4" />
              Expenses
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Reports Table - Using AutoTable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AutoTable 
          data={filteredReports} 
          title="Reports" 
          onView={(report) => {
            toast.info('📄 Report Details', {
              description: `Viewing ${report.title}`,
              duration: 2000
            })
          }}
          onEdit={(report) => {
            toast.info('✏️ Edit Report', {
              description: `Editing ${report.title}`,
              duration: 2000
            })
          }}
          onDelete={(report) => {
            toast.info('🗑️ Delete Report', {
              description: `Deleting ${report.title}`,
              duration: 2000
            })
          }}
          customActions={(report) => (
            <>
              <DropdownMenuItem onClick={() => handleDownloadReport(report.id, 'pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadReport(report.id, 'csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Download CSV
              </DropdownMenuItem>
            </>
          )}
        />
      </motion.div>
    </div>
  )
}