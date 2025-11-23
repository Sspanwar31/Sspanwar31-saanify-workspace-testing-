'use client'

import { motion } from 'framer-motion'
import { Cloud, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ErrorBoundaryClass from '@/components/error-boundary-new'

export default function CloudPage() {
  return (
    <ErrorBoundaryClass>
      <div className="min-h-screen bg-gradient-to-br from-background via-sky-50/10 to-sky-100/10 dark:from-background dark:via-sky-950/50 dark:to-sky-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div 
                className="p-4 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 shadow-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <Cloud className="h-12 w-12 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Saanify Cloud Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete automation for Storage, Edge Functions, AI, Logs, Secrets & Automation
            </p>
          </motion.div>

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-700 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/cloud/dashboard" className="flex items-center">
                Launch Cloud Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Quick Preview Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-sky-200/50 dark:border-sky-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-center">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-sky-600" />
                <h4 className="font-semibold text-foreground">45.2 GB</h4>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20 p-6 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-center">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold text-foreground">12</h4>
                <p className="text-sm text-muted-foreground">Functions Deployed</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 p-6 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-center">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <h4 className="font-semibold text-foreground">15.4K</h4>
                <p className="text-sm text-muted-foreground">AI Calls Today</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-center">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <h4 className="font-semibold text-foreground">99.7%</h4>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Features Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Complete Cloud Infrastructure Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-8">
              Monitor and manage your complete cloud infrastructure with real-time insights, automated workflows, and enterprise-grade security.
            </p>
          </motion.div>
        </div>
      </div>
    </ErrorBoundaryClass>
  )
}