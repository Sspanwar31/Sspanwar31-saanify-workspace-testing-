'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Shield, Users, AlertCircle, CheckCircle, Sparkles, Zap, Crown, Database, ArrowRight, Github, Chrome, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useClientStore } from '@/lib/client/store'

export default function UnifiedLoginPage() {
  const router = useRouter()
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [useSupabase, setUseSupabase] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  const demoCredentials = {
    master: { email: 'master@saanify.com', password: 'master123' },
    oldAdmin: { email: 'admin@saanify.com', password: 'admin123' },
    client: { email: 'client@saanify.com', password: 'client123' },
    trial: { email: 'client1@gmail.com', password: 'client123' }
  }

  useEffect(() => { checkSupabaseConnection() }, [])

  const checkSupabaseConnection = async () => {
    try {
      const response = await fetch('/api/integrations/supabase/status')
      const data = await response.json()
      if (data.connectionType === 'local' || !data.connected) {
        setSupabaseStatus('disconnected')
        setUseSupabase(false)
      } else {
        setSupabaseStatus('connected')
        setUseSupabase(true)
      }
    } catch (error) {
      setSupabaseStatus('disconnected')
      setUseSupabase(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!loginData.email.trim()) newErrors.email = 'Email/Phone is required'
    if (!loginData.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const inputId = loginData.email.trim(); 
      const inputPass = loginData.password.trim();

      console.log('🔐 Trying Login:', inputId);

      // =================================================================
      // 👑 GATE 0: MASTER SAAS ADMIN -> NEW Admin Panel (Store-based)
      // =================================================================
      if (inputId === 'master@saanify.com' && inputPass === 'master123') {
        console.log("👑 MASTER ADMIN DETECTED - New Admin Panel");
        toast.success("👑 Accessing NEW Admin Panel");
        
        // Direct Redirect to NEW Admin Dashboard
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 500);
        return; 
      }

      // =================================================================
      // 🕰️ GATE 0.5: LEGACY ADMIN -> OLD Admin Panel (API-based)
      // =================================================================
      if (inputId.toLowerCase() === 'admin@saanify.com' && inputPass === 'admin123') {
        console.log("🕰️ LEGACY ADMIN DETECTED - Old Admin Panel");
        toast.success("🔌 Connecting to Old API Dashboard...");
        
        // Bypass checks to allow viewing old UI
        setTimeout(() => {
          window.location.href = '/old-admin/dashboard';
        }, 500);
        return;
      }

      // =================================================================
      // GATE 1: SUPER CLIENT MOCK LOGIN
      // =================================================================
      if (inputId.toLowerCase() === 'super@saanify.com' && inputPass === 'super123') {
        console.log("✅ Gate 1 Passed: Super Client");
        useClientStore.getState().login(inputId, inputPass);
        toast.success("🚀 Super Client Access Granted!");
        setTimeout(() => window.location.href = '/client/dashboard', 500);
        return; 
      }

      // =================================================================
      // GATE 2: MEMBER / STORE USER CHECK
      // =================================================================
      const store = useClientStore.getState();
      const foundUser = store.users.find(u => {
        const isEmailMatch = u.email && u.email.toLowerCase() === inputId.toLowerCase();
        const isPhoneMatch = u.password === inputId; 
        const isPasswordMatch = u.password === inputPass;
        return (isEmailMatch || isPhoneMatch) && isPasswordMatch;
      });

      if (foundUser) {
        console.log("✅ Gate 2 Passed: User Found:", foundUser.name);
        
        if (foundUser.status === 'BLOCKED') {
           toast.error("Account is Blocked");
           setIsLoading(false);
           return;
        }

        store.login(foundUser.email, foundUser.password);

        if (foundUser.role === 'MEMBER') {
          toast.success(`Welcome Member: ${foundUser.name}`);
          window.location.href = '/member-portal/dashboard';
        } else {
          toast.success(`Welcome Team: ${foundUser.name}`);
          window.location.href = '/client/dashboard';
        }
        return;
      }

      // =================================================================
      // GATE 3: ORIGINAL API LOGIN
      // =================================================================
      console.log("📡 Gate 3: Attempting API Login...");
      
      const loginEndpoint = useSupabase ? '/api/auth/supabase-signin' : '/api/auth/unified-login'
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputId, password: inputPass, rememberMe: loginData.rememberMe }),
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'User not found in any system.');
      }
      
      if (data.userType === 'admin') toast.success('👑 Admin Access Granted!');
      else toast.success('🎉 Welcome Back!');

      window.location.href = data.redirectUrl;

    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('❌ Login Failed', { description: error.message, duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  // ... (Keep handleInputChange and other handlers) ...
  const handleInputChange = (field: string, value: string | boolean) => {
    setLoginData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Demo Handlers
  const handleQuickMasterLogin = () => { setLoginData({ email: demoCredentials.master.email, password: demoCredentials.master.password, rememberMe: false }) }
  const handleQuickOldAdminLogin = () => { setLoginData({ email: demoCredentials.oldAdmin.email, password: demoCredentials.oldAdmin.password, rememberMe: false }) }
  const handleQuickClientLogin = () => { setLoginData({ email: demoCredentials.client.email, password: demoCredentials.client.password, rememberMe: false }) }
  const handleQuickTrialLogin = () => { setLoginData({ email: demoCredentials.trial.email, password: demoCredentials.trial.password, rememberMe: false }) }
  const handleGitHubLogin = () => { toast.info('🔗 GitHub Authentication', { description: 'Coming soon!' }) }
  const handleGoogleLogin = () => { toast.info('🔍 Google Authentication', { description: 'Coming soon!' }) }
  const handleForgotPassword = async () => { /* ... */ }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ... (Keep exact same JSX/UI code you provided) ... */}
      {/* Just verify the form calls handleLogin */}
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Back Button */}
      <Link href="/" className="absolute bottom-6 left-6 z-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </motion.div>
      </Link>

      {/* Main Container */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-4xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-center lg:text-left text-white">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Welcome Back to Saanify</h1>
              <p className="text-xl text-purple-200 mb-6 leading-relaxed">Enter your email/phone and password.</p>
            </div>
            
            <div className="space-y-3 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
               <Button onClick={() => setLoginData({ email: 'super@saanify.com', password: 'super123', rememberMe: false })} variant="outline" className="w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-200 hover:from-emerald-500/30">
                  <Database className="w-4 h-4 mr-2" /> Super Client
               </Button>
               {/* Master Admin Button for NEW Admin Panel */}
               <Button onClick={handleQuickMasterLogin} variant="outline" className="w-full bg-blue-500/20 border-blue-500/30 text-blue-200 hover:bg-blue-500/30">
                  <Crown className="w-4 h-4 mr-2" /> Master SaaS Admin (NEW)
               </Button>
               {/* Legacy Admin Button for OLD Admin Panel */}
               <Button onClick={handleQuickOldAdminLogin} variant="outline" className="w-full bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30">
                  <Shield className="w-4 h-4 mr-2" /> Legacy Admin (OLD)
               </Button>
            </div>
          </motion.div>

          {/* Right Side */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white">Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white">Email or Phone</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input type="text" placeholder="Email / Phone" value={loginData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Password" value={loginData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full px-3 text-purple-300 hover:text-white">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3">
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}