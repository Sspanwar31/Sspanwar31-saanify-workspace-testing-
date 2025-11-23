'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  DollarSign, 
  Calendar,
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  Users,
  Shield,
  PieChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import PassbookTable from '@/components/client/PassbookTable'
import AddEntryModal from '@/components/client/AddEntryModal'
import { 
  PassbookEntry, 
  PassbookStats, 
  passbookData as initialPassbook, 
  getPassbookStats 
} from '@/data/passbookData'

export default function PassbookManagementPage() {
  const [passbook, setPassbook] = useState<PassbookEntry[]>([])
  const [stats, setStats] = useState<PassbookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PassbookEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setPassbook(initialPassbook)
      setStats(getPassbookStats(initialPassbook))
      setLoading(false)
    }

    loadData()
  }, [])

  const handleAddEntry = () => {
    setEditingEntry(null)
    setIsModalOpen(true)
  }

  const handleEditEntry = (entry: PassbookEntry) => {
    setEditingEntry(entry)
    setIsModalOpen(true)
  }

  const handleSaveEntry = (savedEntry: PassbookEntry) => {
    if (editingEntry) {
      // Update existing entry
      setPassbook(prev => prev.map(entry => 
        entry.id === savedEntry.id ? savedEntry : entry
      ))
      toast.success('✅ Entry Updated Successfully!', {
        description: `${savedEntry.memberName}'s passbook entry has been updated.`,
        duration: 3000,
      })
    } else {
      // Add new entry
      setPassbook(prev => [...prev, savedEntry])
      toast.success('✅ Entry Added Successfully!', {
        description: `${savedEntry.memberName}'s passbook entry of ₹${savedEntry.depositAmount} has been added.`,
        duration: 3000,
      })
    }
    
    // Update stats
    const updatedPassbook = editingEntry 
      ? passbook.map(entry => entry.id === savedEntry.id ? savedEntry : entry)
      : [...passbook, savedEntry]
    setStats(getPassbookStats(updatedPassbook))
    
    setIsModalOpen(false)
    setEditingEntry(null)
  }

  const handleDeleteEntry = (entryId: string) => {
    const entryToDelete = passbook.find(entry => entry.id === entryId)
    if (!entryToDelete) return

    // Delete entry
    setPassbook(prev => prev.filter(entry => entry.id !== entryId))
    setStats(getPassbook(passbook.filter(entry => entry.id !== entryId)))
    
    toast.success('✅ Entry Deleted Successfully!', {
      description: `${entryToDelete.memberName}'s passbook entry has been removed.`,
      duration: 3000,
    })
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.info(`📥 Exporting ${format.toUpperCase()}`, {
      description: `Passbook data is being exported as ${format.toUpperCase()}.`,
      duration: 2000,
    })
    
    setTimeout(() => {
      toast.success('✅ Export Complete!', {
        description: `Passbook data exported successfully as ${format.toUpperCase()}.`,
        duration: 3000,
      })
    }, 1500)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    toast.info('🔄 Refreshing Data', {
      description: 'Fetching latest passbook data...',
      duration: 2000,
    })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setPassbook(initialPassbook)
    setStats(getPassbookStats(initialPassbook))
    setRefreshing(false)
    
    toast.success('✅ Data Updated', {
      description: 'Passbook data has been refreshed.',
      duration: 2000,
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Passbook Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track all member transactions and passbook entries efficiently
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={handleAddEntry}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 mb-4" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8 text-emerald-100" />
                  <Badge className="bg-emerald-400 text-emerald-900">
                    Total
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.totalDeposits.toLocaleString('en-IN')}
                </div>
                <div className="text-emerald-100 text-sm">
                  Total Deposits
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8 text-blue-100" />
                  <Badge className="bg-blue-400 text-blue-900">
                    This Month
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.thisMonthDeposits.toLocaleString('en-IN')}
                </div>
                <div className="text-blue-100 text-sm">
                  Monthly Deposits
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-100" />
                  <Badge className="bg-purple-400 text-purple-900">
                    Total Interest
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.totalInterest.toLocaleString('en-IN')}
                </div>
                <div className="text-purple-100 text-sm">
                  Total Interest
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-amber-100" />
                  <Badge className="bg-amber-400 text-amber-900">
                    Fines
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.totalFine.toLocaleString('en-IN')}
                </div>
                <div className="text-amber-100 text-sm">
                  Total Fines
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-8 w-8 text-teal-100" />
                  <Badge className="bg-teal-400 text-teal-900">
                    Active Members
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stats.activeMembers}
                </div>
                <div className="text-teal-100 text-sm">
                  Active Members
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <PieChart className="h-8 w-8 text-cyan-100" />
                  <Badge className="bg-cyan-400 text-cyan-900">
                    Categories
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stats.paymentModeBreakdown.Cash}
                </div>
                <div className="text-cyan-100 text-sm">
                  Payment Mode Breakdown
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </motion.div>

      {/* Add/Edit Entry Modal */}
      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
        existingEntries={passbook}
      />
    </motion.div>
  )
}