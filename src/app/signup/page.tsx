'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Building, CheckCircle, AlertCircle, Github, Chrome, Sparkles, Zap, Shield, Crown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required'
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('🎉 Account created successfully!', {
        description: 'Welcome to Saanify! Redirecting to login...',
        duration: 3000,
      })

      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)

    } catch (error) {
      toast.error('❌ Registration failed', {
        description: 'Something went wrong. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleGoogleSignup = () => {
    toast.info('🔍 Google Sign Up', {
      description: 'Redirecting to Google for authentication...',
      duration: 2000,
    })
    // Implement Google OAuth logic here
  }

  const handleGitHubSignup = () => {
    toast.info('🔗 GitHub Sign Up', {
      description: 'Redirecting to GitHub for authentication...',
      duration: 2000,
    })
    // Implement GitHub OAuth logic here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-6 h-6 text-blue-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute top-32 right-16">
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Zap className="w-5 h-5 text-cyan-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute bottom-20 right-32">
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Shield className="w-6 h-6 text-indigo-400 opacity-60" />
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
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-2xl"
              >
                <span className="text-2xl font-bold text-white">S</span>
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Join Saanify Today
              </h1>
              
              <p className="text-xl text-blue-200 mb-8 leading-relaxed">
                Transform your society management with our premium platform. Get started in minutes and experience the future of community living.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Zap, text: "15-day free trial, no credit card required" },
                { icon: Shield, text: "Enterprise-grade security & data protection" },
                { icon: Crown, text: "Premium features from day one" }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 text-blue-200"
                >
                  <benefit.icon className="w-5 h-5 text-blue-400" />
                  <span>{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Trusted by Communities
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-300">12+</div>
                  <div className="text-xs text-blue-200">Societies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">45K+</div>
                  <div className="text-xs text-blue-200">Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">2.4M</div>
                  <div className="text-xs text-blue-200">Revenue</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white">
                  Create Account
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Start your 15-day free trial today
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <Label htmlFor="firstName" className="text-blue-200">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`pl-10 bg-white/10 border-white/20 text-white placeholder-blue-300 ${errors.firstName ? 'border-red-500' : ''}`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-sm text-red-400 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.firstName}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <Label htmlFor="lastName" className="text-blue-200">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`pl-10 bg-white/10 border-white/20 text-white placeholder-blue-300 ${errors.lastName ? 'border-red-500' : ''}`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-sm text-red-400 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.lastName}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Label htmlFor="email" className="text-blue-200">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 bg-white/10 border-white/20 text-white placeholder-blue-300 ${errors.email ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </motion.div>

                  {/* Company and Role */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <Label htmlFor="company" className="text-blue-200">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Acme Corp"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className={`pl-10 bg-white/10 border-white/20 text-white placeholder-blue-300 ${errors.company ? 'border-red-500' : ''}`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.company && (
                        <p className="text-sm text-red-400 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.company}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <Label htmlFor="role" className="text-blue-200">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger className={`bg-white/10 border-white/20 text-white ${errors.role ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="developer" className="text-white">Developer</SelectItem>
                          <SelectItem value="designer" className="text-white">Designer</SelectItem>
                          <SelectItem value="manager" className="text-white">Project Manager</SelectItem>
                          <SelectItem value="founder" className="text-white">Founder/CEO</SelectItem>
                          <SelectItem value="other" className="text-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-red-400 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.role}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <Label htmlFor="password" className="text-blue-200">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-blue-300 ${errors.password ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-blue-400 hover:text-blue-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-blue-200">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-blue-300 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-blue-400 hover:text-blue-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </motion.div>

                  {/* Terms and Conditions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex items-start space-x-2"
                  >
                    <Checkbox
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                      disabled={isLoading}
                      className="border-blue-400 bg-white/10"
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm text-blue-200">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-300 hover:text-white underline">
                        Terms and Conditions
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-blue-300 hover:text-white underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </motion.div>
                  {errors.agreeToTerms && (
                    <p className="text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.agreeToTerms}
                    </p>
                  )}

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Create Account
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-blue-300">
                      Or sign up with
                    </span>
                  </div>
                </div>

                {/* Social Signup Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleGoogleSignup}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Google
                  </Button>
                  <Button
                    onClick={handleGitHubSignup}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <div className="text-center text-sm text-blue-300">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-200 hover:text-white font-medium transition-colors">
                    Sign in here
                  </Link>
                </div>
                
                <div className="text-center">
                  <Link 
                    href="/"
                    className="inline-flex items-center text-sm text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}