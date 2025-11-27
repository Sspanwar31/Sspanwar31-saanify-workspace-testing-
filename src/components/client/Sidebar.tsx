'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BookOpen, 
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  X,
  Building2,
  Shield,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onClose?: () => void
  pathname: string
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/client/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    title: 'Members',
    href: '/client/members',
    icon: Users,
    description: 'Member management'
  },
  {
    title: 'Loans',
    href: '/client/loans',
    icon: CreditCard,
    description: 'Loan management'
  },
  {
    title: 'Passbook',
    href: '/client/passbook',
    icon: BookOpen,
    description: 'Transaction history'
  },
  {
    title: 'Maturity',
    href: '/client/maturity',
    icon: Calendar,
    description: 'Maturity tracking'
  },
  {
    title: 'Admin Fund',
    href: '/client/admin-fund',
    icon: DollarSign,
    description: 'Fund management'
  },
  {
    title: 'Reports',
    href: '/client/reports',
    icon: BarChart3,
    description: 'Reports and analytics'
  },
  {
    title: 'Expenses',
    href: '/client/expenses',
    icon: Receipt,
    description: 'Expense tracking'
  },
  {
    title: 'User Management',
    href: '/client/user-management',
    icon: Settings,
    description: 'Role & permission management'
  }
]

export default function Sidebar({ onClose, pathname }: SidebarProps) {
  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <div className="w-64 h-full bg-white/90 dark:bg-black/90 backdrop-blur-xl border-r border-emerald-100 dark:border-emerald-900/30 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Building2 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Saanify
                </h1>
                <p className="text-xs text-muted-foreground">
                  Society Portal
                </p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                      active
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                        : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className={cn(
                        "text-xs transition-opacity",
                        active ? "text-emerald-100 opacity-90" : "text-muted-foreground opacity-70 group-hover:opacity-100"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Secure Portal
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                End-to-end encrypted
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <div className="text-xs text-muted-foreground">
              Version 2.0.0
            </div>
            <div className="text-xs text-muted-foreground">
              © 2024 Saanify
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}