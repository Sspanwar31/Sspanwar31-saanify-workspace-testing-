'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogIn, User, Github, BarChart3, Shield, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Navbar() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication and role on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
        if (token) {
          const response = await fetch('/api/auth/check-session', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            setIsAuthenticated(true)
            setUserRole(data.user.role)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      
      // Update active section based on scroll position
      const sections = ['features', 'pricing', 'testimonials', 'about']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string, label: string) => {
    if (href.startsWith('/')) {
      // It's a page navigation - use Next.js router
      router.push(href)
      setIsMobileMenuOpen(false)
      setIsDropdownOpen(false)
      toast.success(`📍 ${label}`, {
        description: `Navigated to ${label} page`,
        duration: 2000,
      })
    } else {
      // It's a section navigation
      const element = document.getElementById(href.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        setIsMobileMenuOpen(false)
        setIsDropdownOpen(false)
        toast.success(`📍 ${label}`, {
          description: `Navigated to ${label} section`,
          duration: 2000,
        })
      }
    }
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  const handleGetStarted = () => {
    toast.success("🚀 Welcome!", {
      description: "Redirecting to subscription plans...",
      duration: 3000,
    })
    setTimeout(() => {
      router.push('/subscription')
    }, 1000)
  }

  const handleDropdownAction = (action: string) => {
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
    
    switch (action) {
      case 'github':
        // Open GitHub integration
        const githubButton = document.querySelector('[data-github-toggle]') as HTMLButtonElement
        if (githubButton) {
          githubButton.click()
        }
        break
      case 'analytics':
        handleNavClick('/analytics', 'Analytics')
        break
    }
  }

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Support', href: '/support' },
  ]

  const dropdownItems = [
    {
      icon: <Github className="h-4 w-4" />,
      label: 'GitHub Integration',
      description: 'Connect and sync with GitHub',
      action: 'github',
      gradient: 'from-gray-600 to-gray-800'
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      description: 'View detailed analytics',
      action: 'analytics',
      gradient: 'from-purple-600 to-pink-700'
    }
  ]

  return (
    <>
      <motion.nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'backdrop-blur-md shadow-sm bg-background/70 border-b border-border' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-8 h-8 bg-gradient-to-br from-sky-500 to-teal-600 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-white font-bold text-sm">S</span>
                </motion.div>
                <span className={`text-lg font-bold ${
                  isScrolled ? 'text-foreground' : 'text-foreground'
                }`}>
                  Saanify
                </span>
                <motion.span 
                  className="text-primary font-bold"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚡
                </motion.span>
              </div>
            </motion.div>
            
            {/* Desktop Navigation */}
            <motion.div 
              className="hidden lg:flex items-center space-x-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavClick(item.href, item.label)}
                  className={`text-sm font-medium transition-all duration-300 hover:text-primary relative ${
                    isScrolled ? 'text-foreground' : 'text-foreground'
                    } ${
                    activeSection === item.href.replace('#', '') 
                      ? 'text-primary' 
                      : ''
                    }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                  {activeSection === item.href.replace('#', '') && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                      layoutId="activeSection"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Right Side Actions */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Get Started Button - Only show when not authenticated */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/20"
                    size="sm"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </motion.div>
              )}

              {/* Sign In Button */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button
                    onClick={handleSignIn}
                    variant="outline"
                    className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-primary font-medium px-5 py-2 rounded-full transition-all duration-300"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </motion.div>
              )}

              {/* User Menu - Only show when authenticated */}
              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center space-x-3"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {userRole}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Active
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
              )}

              {/* Dropdown Menu - Always at the end */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isDropdownOpen ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50"
                    >
                      <div className="p-3">
                        {dropdownItems.map((item, index) => (
                          <motion.button
                            key={item.label}
                            onClick={() => handleDropdownAction(item.action)}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 flex items-center space-x-3 ${
                              index > 0 ? 'mt-2' : ''
                            }`}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white shadow-md`}>
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.description}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {navItems.map((item, index) => (
                    <motion.button
                      key={item.label}
                      onClick={() => handleNavClick(item.href, item.label)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        activeSection === item.href.replace('#', '') 
                          ? 'bg-primary text-white' 
                          : 'text-gray-900 dark:text-white'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.label}
                    </motion.button>
                  ))}
                  
                  {!isAuthenticated && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Button
                          onClick={handleGetStarted}
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/20"
                          size="lg"
                        >
                          <Rocket className="h-4 w-4 mr-2" />
                          Get Started
                        </Button>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Button
                          onClick={handleSignIn}
                          variant="outline"
                          className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-primary font-medium py-3 rounded-full transition-all duration-300"
                          size="lg"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}