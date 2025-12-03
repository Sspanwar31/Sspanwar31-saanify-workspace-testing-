'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  Users, 
  CreditCard, 
  Calendar,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onClose?: () => void
  pathname: string
}

interface NavItem {
  title: string
  href?: string
  icon: any
  description: string
  badge?: string
}

const navigationItems: NavItem[] = [
  {
    title: 'Passbook',
    href: '/client/passbook',
    icon: BookOpen,
    description: 'Digital transactions',
    badge: '📖'
  },
  {
    title: 'Members',
    href: '/client/members',
    icon: Users,
    description: 'Member management',
    badge: null
  },
  {
    title: 'Loans',
    href: '/client/loans',
    icon: CreditCard,
    description: 'Loan management',
    badge: null
  },
  {
    title: 'Maturity',
    href: '/client/maturity',
    icon: Calendar,
    description: 'Maturity tracking',
    badge: '📅'
  },
  {
    title: 'Admin Fund',
    href: '/client/admin-fund',
    icon: Wallet,
    description: 'Fund management',
    badge: '💰'
  },
  {
    title: 'Expenses',
    href: '/client/expenses',
    icon: Receipt,
    description: 'Expense tracking',
    badge: null
  },
  {
    title: 'Reports',
    href: '/client/reports',
    icon: BarChart3,
    description: 'Reports & insights',
    badge: '📊'
  },
  {
    title: 'Settings',
    href: '/client/user-management',
    icon: Settings,
    description: 'Settings & access',
    badge: null
  }
]

export default function Sidebar({ onClose, pathname }: SidebarProps) {
  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <div className="w-64 h-full bg-gradient-to-b from-amber-50/95 to-orange-50/95 dark:from-amber-950/95 dark:to-orange-950/95 backdrop-blur-xl border-r border-amber-200/50 dark:border-amber-800/50 shadow-xl relative">
      {/* Passbook-style decoration */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #d97706 0px, transparent 1px, transparent 20px, #d97706 21px)',
          backgroundSize: '21px 21px'
        }} />
      </div>
      
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/30 dark:to-orange-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-amber-200 dark:border-amber-700"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <BookOpen className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-300 dark:to-orange-300 bg-clip-text text-transparent">
                  Saanify
                </h1>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Client Portal
                </p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const active = item.href ? isActive(item.href) : false
            
            return (
              <Link key={item.href} href={item.href || '#'} onClick={onClose}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
                      active
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border border-amber-400 dark:border-amber-600"
                        : "hover:bg-amber-100/70 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100"
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-600 to-orange-600 rounded-r-full"></div>
                    )}
                    
                    <div className="relative flex items-center gap-3 flex-1">
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className={cn(
                          "text-xs transition-opacity",
                          active ? "text-amber-100 opacity-90" : "text-amber-600 dark:text-amber-400 opacity-70 group-hover:opacity-100"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge */}
                    {item.badge && (
                      <div className="text-sm">
                        {item.badge}
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/30 dark:to-orange-900/30">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-100/70 dark:bg-amber-900/40">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300">Saanify Client</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Version 2.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}