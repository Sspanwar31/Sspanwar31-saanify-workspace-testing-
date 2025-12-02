'use client'

import { motion } from 'framer-motion'
import { Calculator, Users, CreditCard, TrendingUp, BookOpen, Calendar, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react'

export default function DashboardPage() {
  const clientName = "Ledger Keeper"

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
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent">
              Welcome back, {clientName}
            </h1>
            <p className="text-amber-700 dark:text-amber-300 font-medium">
              Here's your digital passbook overview for today.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Passbook-style Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Members', 
            value: '248', 
            change: '+12', 
            color: 'amber',
            icon: Users,
            trend: 'up'
          },
          { 
            title: 'Active Loans', 
            value: '42', 
            change: '+8', 
            color: 'orange',
            icon: CreditCard,
            trend: 'up'
          },
          { 
            title: 'Total Revenue', 
            value: '₹12.5L', 
            change: '+23%', 
            color: 'yellow',
            icon: DollarSign,
            trend: 'up'
          },
          { 
            title: 'Pending Entries', 
            value: '8', 
            change: '-3', 
            color: 'amber',
            icon: BookOpen,
            trend: 'down'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl border-2 border-${stat.color}-200 dark:border-${stat.color}-800 bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-950/20 dark:to-${stat.color}-900/20 shadow-lg`}
          >
            {/* Passbook-style decorative pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #d97706 0px, transparent 1px, transparent 10px, #d97706 11px)',
                backgroundSize: '11px 11px'
              }} />
            </div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-500 rounded-lg shadow-md`}>
                  <stat.icon className={`w-6 h-6 text-white`} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              
              <h3 className={`text-sm font-medium text-${stat.color}-700 dark:text-${stat.color}-300 mb-2`}>
                {stat.title}
              </h3>
              <p className={`text-2xl font-bold text-${stat.color}-900 dark:text-${stat.color}-100`}>
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Passbook Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg overflow-hidden"
      >
        {/* Passbook header decoration */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Quick Ledger Actions
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Add Entry', icon: BookOpen, color: 'amber' },
              { name: 'New Loan', icon: CreditCard, color: 'orange' },
              { name: 'View Reports', icon: BarChart3, color: 'yellow' },
              { name: 'Analytics', icon: TrendingUp, color: 'amber' }
            ].map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-6 border-2 border-${action.color}-200 dark:border-${action.color}-800 rounded-xl bg-gradient-to-br from-${action.color}-50 to-${action.color}-100 dark:from-${action.color}-950/20 dark:to-${action.color}-900/20 hover:from-${action.color}-100 hover:to-${action.color}-200 dark:hover:from-${action.color}-900/40 dark:hover:to-${action.color}-800/40 transition-all duration-200 shadow-md hover:shadow-lg`}
              >
                <div className={`w-12 h-12 bg-${action.color}-500 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium text-amber-900 dark:text-amber-100">{action.name}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Activity - Ledger Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg overflow-hidden"
      >
        {/* Passbook header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Ledger Activity
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {[
              { 
                user: 'John Doe', 
                action: 'Applied for loan', 
                amount: '₹50,000',
                time: '2 hours ago',
                type: 'loan'
              },
              { 
                user: 'Jane Smith', 
                action: 'Paid installment', 
                amount: '₹5,000',
                time: '4 hours ago',
                type: 'payment'
              },
              { 
                user: 'Bob Johnson', 
                action: 'Updated profile', 
                amount: null,
                time: '6 hours ago',
                type: 'update'
              }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'loan' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    {activity.type === 'loan' ? <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                     activity.type === 'payment' ? <IndianRupee className="w-5 h-5 text-green-600 dark:text-green-400" /> :
                     <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{activity.user}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{activity.amount}</p>
                  )}
                  <span className="text-xs text-amber-600 dark:text-amber-400">{activity.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}