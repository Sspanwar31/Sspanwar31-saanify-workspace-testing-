'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Shield, Users, AlertCircle, CheckCircle, Github, Chrome, Sparkles, Zap, Crown, Database } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'


export default function LoginPage() {
  const [clientData, setClientData] = useState({
    email: 'client@demo.com',
    password: 'client123',
    rememberMe: false
  })
  const [adminData, setAdminData] = useState({
    email: 'superadmin@saanify.com',
    password: 'admin123',
    rememberMe: false
  })
  const [showClientPassword, setShowClientPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('client')
  const [useSupabase, setUseSupabase] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  // Check Supabase connection on mount
  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      const response = await fetch('/api/integrations/supabase/status')
      const data = await response.json()
      
      console.log('Supabase status response:', data)
      
      if (data.connectionType === 'local') {
        setSupabaseStatus('disconnected')
        setUseSupabase(false)
      } else if (data.connected) {
        setSupabaseStatus('connected')
        setUseSupabase(true)
      } else {
        setSupabaseStatus('disconnected')
        setUseSupabase(false)
      }
    } catch (error) {
      console.error('Failed to check Supabase status:', error)
      setSupabaseStatus('disconnected')
      setUseSupabase(false)
    }
  }

  const validateClientForm = () => {
    const newErrors: Record<string, string> = {}

    if (!clientData.email.trim()) {
      newErrors.clientEmail = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(clientData.email)) {
      newErrors.clientEmail = 'Email is invalid'
    }

    if (!clientData.password) {
      newErrors.clientPassword = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAdminForm = () => {
    const newErrors: Record<string, string> = {}

    if (!adminData.email.trim()) {
      newErrors.adminEmail = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(adminData.email)) {
      newErrors.adminEmail = 'Email is invalid'
    }

    if (!adminData.password) {
      newErrors.adminPassword = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateClientForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('Attempting client login with:', clientData.email)
      
      const loginEndpoint = useSupabase ? '/api/auth/supabase-signin' : '/api/auth/login'
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: clientData.email,
          password: clientData.password,
          userType: 'client',
          rememberMe: clientData.rememberMe
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      console.log('✅ Login successful! Response:', data)
      
      toast.success('🎉 Welcome back!', {
        description: useSupabase 
          ? 'Successfully logged in with Supabase' 
          : 'Successfully logged into your Saanify account',
        duration: 3000,
      })

      // Show additional success feedback
      alert('✅ Login Successful! Redirecting to client dashboard...')

      // Redirect to client dashboard
      setTimeout(() => {
        console.log('🔄 Redirecting to client dashboard...')
        window.location.href = '/client/dashboard'
      }, 1000)

    } catch (error: any) {
      console.error('Login error:', error)
      
      // Show detailed error information
      const errorMessage = error.message || 'Invalid email or password. Please try again.'
      console.log('❌ Login failed with error:', errorMessage)
      
      // Show alert for immediate feedback
      alert(`❌ Login Failed: ${errorMessage}`)
      
      toast.error('❌ Login failed', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAdminForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('Attempting admin login with:', adminData.email)
      
      const loginEndpoint = useSupabase ? '/api/auth/supabase-signin' : '/api/auth/login'
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminData.email,
          password: adminData.password,
          userType: 'admin',
          rememberMe: adminData.rememberMe
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      toast.success('👑 Admin access granted!', {
        description: useSupabase 
          ? 'Welcome to Saanify Admin Panel (Supabase)' 
          : 'Welcome to Saanify Admin Panel',
        duration: 3000,
      })

      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = '/super-admin'
      }, 1000)

    } catch (error: any) {
      console.error('Admin login error:', error)
      toast.error('❌ Admin login failed', {
        description: error.message || 'Invalid admin credentials. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientInputChange = (field: string, value: string | boolean) => {
    setClientData(prev => ({ ...prev, [field]: value }))
    if (errors[`client${(field?.charAt(0) ?? "").toUpperCase() + (field?.slice(1) ?? "")}`]) {
      setErrors(prev => ({ ...prev, [`client${(field?.charAt(0) ?? "").toUpperCase() + (field?.slice(1) ?? "")}`]: '' }))
    }
  }

  const handleAdminInputChange = (field: string, value: string | boolean) => {
    setAdminData(prev => ({ ...prev, [field]: value }))
    if (errors[`admin${(field?.charAt(0) ?? "").toUpperCase() + (field?.slice(1) ?? "")}`]) {
      setErrors(prev => ({ ...prev, [`admin${(field?.charAt(0) ?? "").toUpperCase() + (field?.slice(1) ?? "")}`]: '' }))
    }
  }

  // Quick demo login functions
  const handleQuickClientLogin = () => {
    setClientData({
      email: 'client@demo.com',
      password: 'client123',
      rememberMe: false
    })
    setActiveTab('client')
    setTimeout(() => {
      document.getElementById('clientLoginForm')?.requestSubmit()
    }, 100)
  }

  const handleQuickAdminLogin = () => {
    setAdminData({
      email: 'superadmin@saanify.com',
      password: 'admin123',
      rememberMe: false
    })
    setActiveTab('admin')
    setTimeout(() => {
      document.getElementById('adminLoginForm')?.requestSubmit()
    }, 100)
  }

  const handleGitHubLogin = () => {
    toast.info('🔗 GitHub Authentication', {
      description: 'Redirecting to GitHub for authentication...',
      duration: 2000,
    })
    // Implement GitHub OAuth logic here
  }

  const handleGoogleLogin = () => {
    toast.info('🔍 Google Authentication', {
      description: 'Redirecting to Google for authentication...',
      duration: 2000,
    })
    // Implement Google OAuth logic here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-6 h-6 text-purple-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute top-32 right-16">
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Zap className="w-5 h-5 text-blue-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute bottom-20 right-32">
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Crown className="w-6 h-6 text-amber-400 opacity-60" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left text-white"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl"
              >
                <span className="text-2xl font-bold text-white">S</span>
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Welcome Back to Saanify
              </h1>
              
              <p className="text-xl text-purple-200 mb-8 leading-relaxed">
                Your premium society management platform awaits. Sign in to access your dashboard and manage your community effortlessly.
              </p>
            </div>

            {/* Supabase Status */}
            <div className="mb-6">
              <Alert className={`bg-white/10 backdrop-blur-sm border-white/20 ${
                supabaseStatus === 'connected' ? 'border-green-500/50' : 
                supabaseStatus === 'disconnected' ? 'border-blue-500/50' : 
                'border-yellow-500/50'
              }`}>
                <Database className="h-4 w-4" />
                <AlertDescription className="text-white">
                  <div className="flex items-center justify-between">
                    <span>
                      {supabaseStatus === 'connected' ? 'Supabase: Connected' : 
                       supabaseStatus === 'disconnected' ? 'Local Database: Ready' : 
                       'Checking...'}
                    </span>
                    {supabaseStatus === 'connected' && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {supabaseStatus === 'disconnected' && (
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Shield, text: "Bank-level security for your data" },
                { icon: Users, text: "Manage 45,000+ members seamlessly" },
                { icon: Zap, text: "Lightning-fast performance" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 text-purple-200"
                >
                  <feature.icon className="w-5 h-5 text-purple-400" />
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Quick Demo Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Quick Demo Access
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleQuickClientLogin}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Client Demo
                </Button>
                <Button
                  onClick={handleQuickAdminLogin}
                  variant="outline"
                  className="bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30 hover:border-amber-500/50 transition-all duration-300"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Admin Demo
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white">
                  Sign In
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Access your Saanify account {useSupabase ? '(Supabase)' : '(Local Database)'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border border-white/20">
                    <TabsTrigger 
                      value="client" 
                      className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-purple-200"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Client
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin" 
                      className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200 text-purple-200"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  {/* Client Login */}
                  <TabsContent value="client">
                    <motion.form
                      id="clientLoginForm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      onSubmit={handleClientLogin}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="clientEmail" className="text-purple-200">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                          <Input
                            id="clientEmail"
                            type="email"
                            placeholder="client@saanify.com"
                            value={clientData.email}
                            onChange={(e) => handleClientInputChange('email', e.target.value)}
                            className={`pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.clientEmail ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.clientEmail && (
                          <p className="text-sm text-red-400 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.clientEmail}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="clientPassword" className="text-purple-200">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                          <Input
                            id="clientPassword"
                            type={showClientPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={clientData.password}
                            onChange={(e) => handleClientInputChange('password', e.target.value)}
                            className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.clientPassword ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowClientPassword(!showClientPassword)}
                            className="absolute right-3 top-3 text-purple-400 hover:text-purple-200"
                          >
                            {showClientPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.clientPassword && (
                          <p className="text-sm text-red-400 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.clientPassword}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="clientRemember"
                          checked={clientData.rememberMe}
                          onChange={(e) => handleClientInputChange('rememberMe', e.target.checked)}
                          className="rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                        />
                        <Label htmlFor="clientRemember" className="text-purple-200 text-sm">
                          Remember me for 30 days
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 mr-2" />
                            Sign in as Client
                          </>
                        )}
                      </Button>
                    </motion.form>
                  </TabsContent>

                  {/* Admin Login */}
                  <TabsContent value="admin">
                    <motion.form
                      id="adminLoginForm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      onSubmit={handleAdminLogin}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="adminEmail" className="text-purple-200">Admin Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                          <Input
                            id="adminEmail"
                            type="email"
                            placeholder="superadmin@saanify.com"
                            value={adminData.email}
                            onChange={(e) => handleAdminInputChange('email', e.target.value)}
                            className={`pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.adminEmail ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.adminEmail && (
                          <p className="text-sm text-red-400 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.adminEmail}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="adminPassword" className="text-purple-200">Admin Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                          <Input
                            id="adminPassword"
                            type={showAdminPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={adminData.password}
                            onChange={(e) => handleAdminInputChange('password', e.target.value)}
                            className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.adminPassword ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-3 text-purple-400 hover:text-purple-200"
                          >
                            {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.adminPassword && (
                          <p className="text-sm text-red-400 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.adminPassword}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="adminRemember"
                          checked={adminData.rememberMe}
                          onChange={(e) => handleAdminInputChange('rememberMe', e.target.checked)}
                          className="rounded border-white/20 bg-white/10 text-amber-500 focus:ring-amber-500"
                        />
                        <Label htmlFor="adminRemember" className="text-purple-200 text-sm">
                          Remember me for 30 days
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Authenticating...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Sign in as Admin
                          </>
                        )}
                      </Button>
                    </motion.form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-purple-200">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleGitHubLogin}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGoogleLogin}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <Chrome className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="text-center">
                <p className="text-purple-200 text-sm">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-purple-400 hover:text-purple-300 underline">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Legacy Supabase Toggle Component - Removed */}
    </div>
  )
}