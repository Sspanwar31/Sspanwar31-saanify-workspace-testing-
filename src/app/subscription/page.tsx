'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, QrCode, IndianRupee, Calendar, CheckCircle, AlertCircle, CreditCard, Clock, Star, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [transactionId, setTransactionId] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      duration: '1 Month',
      price: 999,
      originalPrice: 1499,
      features: ['Full access to all features', 'Unlimited transactions', 'Priority support', 'Advanced analytics'],
      popular: false
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      duration: '3 Months',
      price: 2499,
      originalPrice: 4497,
      features: ['Everything in Monthly', 'Save 33%', 'Custom reports', 'API access'],
      popular: true
    },
    {
      id: 'semiannual',
      name: 'Semi-Annual',
      duration: '6 Months',
      price: 4499,
      originalPrice: 8994,
      features: ['Everything in Quarterly', 'Save 50%', 'Dedicated account manager', 'Custom integrations'],
      popular: false
    },
    {
      id: 'yearly',
      name: 'Yearly',
      duration: '1 Year',
      price: 7999,
      originalPrice: 17988,
      features: ['Everything in Semi-Annual', 'Save 55%', 'White-label options', 'Advanced security'],
      popular: false
    }
  ]

  const upiId = 'saanify@paytm'
  const qrCodeUrl = '/api/qr-code?upi=' + encodeURIComponent(upiId) + '&amount=' + plans.find(p => p.id === selectedPlan)?.price

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('❌ Invalid File', {
          description: 'Please upload an image file (JPG, PNG, etc.)',
          duration: 3000,
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('❌ File Too Large', {
          description: 'Please upload an image smaller than 5MB',
          duration: 3000,
        })
        return
      }

      setScreenshotFile(file)
      setErrors(prev => ({ ...prev, screenshot: '' }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required'
    }

    if (!screenshotFile) {
      newErrors.screenshot = 'Payment screenshot is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('plan', selectedPlan)
      formData.append('amount', plans.find(p => p.id === selectedPlan)?.price.toString() || '0')
      formData.append('transactionId', transactionId)
      formData.append('screenshot', screenshotFile!)

      const response = await fetch('/api/subscription/submit-payment', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment proof')
      }

      toast.success('🎉 Payment Proof Submitted!', {
        description: 'Your payment proof has been submitted for verification. We will notify you once approved.',
        duration: 5000,
      })

      // Reset form
      setTransactionId('')
      setScreenshotFile(null)
      setScreenshotPreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirect to dashboard after delay
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)

    } catch (error: any) {
      console.error('Payment submission error:', error)
      toast.error('❌ Submission Failed', {
        description: error.message || 'Failed to submit payment proof. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const currentPlan = plans.find(p => p.id === selectedPlan)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Back to Dashboard Button */}
      <Link href="/dashboard" className="absolute top-6 left-6 z-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </motion.div>
      </Link>

      <div className="max-w-6xl mx-auto relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Upgrade Your Subscription
          </h1>
          <p className="text-xl text-purple-200">
            Choose the perfect plan for your finance society needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Plans Selection */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  Choose Your Plan
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Select the subscription that best fits your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-4">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index }}
                    >
                      <div className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                        selectedPlan === plan.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/30'
                      }`}>
                        {plan.popular && (
                          <div className="absolute -top-3 right-4">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              MOST POPULAR
                            </span>
                          </div>
                        )}
                        
                        <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                        <Label htmlFor={plan.id} className="cursor-pointer">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                              <p className="text-purple-300 text-sm">{plan.duration}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-purple-400" />
                                <span className="text-2xl font-bold text-white">{plan.price}</span>
                              </div>
                              {plan.originalPrice > plan.price && (
                                <p className="text-sm text-purple-300 line-through">
                                  ₹{plan.originalPrice}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-purple-200">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </Label>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <Label className="text-purple-200 font-medium">UPI ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white font-mono text-lg">{upiId}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => {
                        navigator.clipboard.writeText(upiId)
                        toast.success('📋 UPI ID Copied!', {
                          description: 'UPI ID has been copied to clipboard',
                          duration: 2000,
                        })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <Label className="text-purple-200 font-medium">QR Code</Label>
                  <div className="mt-2 flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <QrCode className="w-32 h-32 text-gray-800" />
                      <p className="text-xs text-gray-600 text-center mt-2">Scan to pay</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-purple-300" />
                    <span className="text-purple-200 font-medium">Important:</span>
                  </div>
                  <ul className="text-sm text-purple-200 space-y-1">
                    <li>• Pay the exact amount shown above</li>
                    <li>• Save the payment screenshot</li>
                    <li>• Upload proof below for verification</li>
                    <li>• Verification takes 2-24 hours</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side - Payment Proof Upload */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-6 h-6 text-purple-400" />
                  Submit Payment Proof
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Upload your payment screenshot and transaction details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selected Plan Summary */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <h3 className="text-white font-semibold mb-2">Selected Plan</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-200">{currentPlan.name} - {currentPlan.duration}</p>
                        <p className="text-sm text-purple-300">Full access to all features</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4 text-purple-400" />
                          <span className="text-xl font-bold text-white">{currentPlan.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <Label htmlFor="transactionId" className="text-purple-200 font-medium">
                      UPI Transaction ID
                    </Label>
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder="Enter your UPI transaction ID"
                      value={transactionId}
                      onChange={(e) => {
                        setTransactionId(e.target.value)
                        if (errors.transactionId) {
                          setErrors(prev => ({ ...prev, transactionId: '' }))
                        }
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder-purple-300 mt-1 ${
                        errors.transactionId ? 'border-red-500' : ''
                      }`}
                      disabled={isUploading}
                    />
                    {errors.transactionId && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.transactionId}
                      </p>
                    )}
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <Label className="text-purple-200 font-medium">Payment Screenshot</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                        errors.screenshot
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/30 bg-white/5 hover:border-white/50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                      />
                      
                      {screenshotPreview ? (
                        <div className="space-y-4">
                          <div className="relative mx-auto w-48 h-48">
                            <Image
                              src={screenshotPreview}
                              alt="Payment screenshot"
                              fill
                              className="object-contain rounded-lg"
                            />
                          </div>
                          <p className="text-sm text-purple-200">Click to change image</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="w-12 h-12 text-purple-400 mx-auto" />
                          <div>
                            <p className="text-purple-200 font-medium">Upload Payment Screenshot</p>
                            <p className="text-sm text-purple-300">Click to browse or drag and drop</p>
                            <p className="text-xs text-purple-400 mt-1">JPG, PNG up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.screenshot && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.screenshot}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting Payment Proof...
                      </div>
                    ) : (
                      'Submit Payment Proof'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}