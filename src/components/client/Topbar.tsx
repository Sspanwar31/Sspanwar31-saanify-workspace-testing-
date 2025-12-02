'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Search, LogOut, User, Moon, Sun, ChevronDown, Building2, Calculator, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface TopbarProps {
  onMenuToggle: () => void
  onSignOut: () => void
  sidebarOpen: boolean
}

export default function Topbar({ onMenuToggle, onSignOut, sidebarOpen }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(3)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      toast.info(`🔍 Searching for "${searchQuery}"`, {
        description: "Search functionality coming soon!",
        duration: 2000,
      })
      setSearchQuery('')
    }
  }

  const handleSignOutClick = () => {
    toast.success('✅ Signing Out...', {
      description: 'Redirecting to login page',
      duration: 2000,
    })
    setTimeout(() => {
      onSignOut()
    }, 1000)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    toast.success(`🌓 ${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, {
      duration: 1500,
    })
  }

  return (
    <header className="h-16 bg-gradient-to-r from-amber-50/95 to-orange-50/95 dark:from-amber-950/95 dark:to-orange-950/95 backdrop-blur-xl border-b border-amber-200/50 dark:border-amber-800/50 shadow-sm relative">
      {/* Passbook-style decorative line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>
      
      <div className="h-full px-4 lg:px-6 flex items-center justify-between relative">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle - Always Visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Society Name with Passbook Icon */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Calculator className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-amber-800 to-orange-800 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent">
                Sunrise Cooperative Society
              </h2>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                Digital Passbook Portal
              </p>
            </div>
          </div>

          {/* Search Bar with Passbook Styling */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-600 dark:text-amber-400" />
              <Input
                type="text"
                placeholder="Search ledger entries, members, transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 lg:w-80 pl-10 bg-amber-50/70 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 focus:border-amber-500 dark:focus:border-amber-400 text-amber-900 dark:text-amber-100 placeholder-amber-500 dark:placeholder-amber-400"
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-600" />
                )}
              </motion.div>
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-amber-50 dark:border-amber-950"
                  >
                    {notifications}
                  </motion.div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 border-amber-200 dark:border-amber-800 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur-xl">
              <div className="p-4 border-b border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Ledger Notifications</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">You have {notifications} new updates</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-amber-900 dark:text-amber-100">New Loan Entry</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Rajesh Kumar added to loan ledger</p>
                  <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">2 minutes ago</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-amber-900 dark:text-amber-100">Payment Recorded</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Monthly payment from Priya Sharma</p>
                  <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">1 hour ago</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-amber-900 dark:text-amber-100">Maturity Due</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">3 entries maturing this week</p>
                  <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">3 hours ago</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-amber-200 dark:bg-amber-800" />
              <DropdownMenuItem className="text-center hover:bg-amber-100 dark:hover:bg-amber-900/30">
                <span className="text-sm text-amber-700 dark:text-amber-300">View all ledger updates</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold">
                    AK
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-amber-900 dark:text-amber-100">Admin User</div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">Ledger Keeper</div>
                </div>
                <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-amber-200 dark:border-amber-800 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur-xl">
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-900 dark:text-amber-100">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-900 dark:text-amber-100">Ledger Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-amber-200 dark:bg-amber-800" />
              <DropdownMenuItem 
                onClick={handleSignOutClick}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}