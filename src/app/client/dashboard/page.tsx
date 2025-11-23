'use client'

import { motion } from 'framer-motion'

export default function DashboardPage() {
  const clientName = "Society Admin"

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {clientName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening with your society today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Members', value: '248', change: '+12%', color: 'blue' },
          { title: 'Active Loans', value: '42', change: '+8%', color: 'green' },
          { title: 'Total Revenue', value: '₹12.5L', change: '+23%', color: 'purple' },
          { title: 'Buildings', value: '8', change: '+2', color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-${stat.color}-500`}
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Add Member', icon: '👥' },
            { name: 'New Loan', icon: '💰' },
            { name: 'View Reports', icon: '📊' },
            { name: 'Analytics', icon: '📈' }
          ].map((action, index) => (
            <button
              key={index}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{action.name}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { user: 'John Doe', action: 'Applied for loan', time: '2 hours ago' },
            { user: 'Jane Smith', action: 'Paid installment', time: '4 hours ago' },
            { user: 'Bob Johnson', action: 'Updated profile', time: '6 hours ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}