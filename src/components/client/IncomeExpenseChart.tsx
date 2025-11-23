'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

const IncomeExpenseChart = () => {
  const chartVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Income vs Expense
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">Chart visualization coming soon</p>
              <p className="text-xs mt-2">Income vs Expense trend analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default IncomeExpenseChart