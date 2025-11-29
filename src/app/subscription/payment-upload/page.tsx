'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, DollarSign, Calendar, User, CreditCard, Smartphone, Building2, IndianRupee, Shield, Star, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  duration: string
  features: string[]
  color: string
  popular?: boolean
  icon?: string
  trialDays?: number
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'trial',
    name: 'TRIAL',
    description: 'Experience all features free for 15 days',
    price: 0,
    duration: '15 days',
    features: [
      'All premium features unlocked',
      'Up to 50 members',
      'Advanced accounting & reporting',
      'Priority support',
      'Mobile app + Web access',
      'Advanced analytics',
      'No credit card required'
    ],
    color: 'from-emerald-500 to-teal-600',
    icon: '🚀',
    popular: true,
    trialDays: 15
  },
  {
    id: 'basic',
    name: 'BASIC',
    description: 'Perfect for small societies getting started',
    price: 4000,
    duration: 'monthly',
    features: [
      'Up to 50 members',
      'Basic transaction tracking',
      'Monthly reports',
      'Email support',
      'Mobile app access',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ],
    color: 'from-blue-500 to-cyan-600',
    icon: '🏠',
    popular: false,
    trialDays: 15
  },
  {
    id: 'pro',
    name: 'PROFESSIONAL',
    description: 'Ideal for growing societies with more needs',
    price: 7000,
    duration: 'monthly',
    features: [
      'Up to 200 members',
      'Advanced transaction tracking',
      'Weekly & monthly reports',
      'Priority email support',
      'Mobile app access',
      'Advanced analytics dashboard',
      'Custom branding options',
      'API access',
      'Dedicated account manager'
    ],
    color: 'from-purple-500 to-pink-600',
    icon: '💎',
    popular: true,
    trialDays: 15
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    description: 'Complete solution for large societies',
    price: 10000,
    duration: 'monthly',
    features: [
      'Unlimited members',
      'Complete transaction management',
      'Real-time reporting & analytics',
      '24/7 phone & email support',
      'Mobile app with white-labeling',
      'Advanced analytics & insights',
      'Full custom branding',
      'API access for integrations',
      'Dedicated account manager',
      'On-site training & setup'
    ],
    color: 'from-amber-500 to-orange-600',
    icon: '🏢',
    popular: false,
    trialDays: 15
  }
]

export default function PaymentUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = useState({
    transactionId: '',
    paymentMethod: 'UPI' as 'UPI' | 'Bank Transfer' | 'Cash',
    amount: '',
    screenshot: null as File | null,
    payerName: '',
    payerEmail: '',
    payerPhone: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (planId) {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
      if (plan) {
        // If trial plan is selected, redirect to signup instead
        if (planId === 'trial') {
          router.push('/signup?plan=trial')
          return
        }
        setSelectedPlan(plan)
        setFormData(prev => ({
          ...prev,
          amount: plan.price.toString()
        }))
      } else {
        toast.error('Invalid plan selected')
        router.push('/subscription')
      }
    } else {
      toast.error('No plan selected')
      router.push('/subscription')
    }
  }, [planId, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, screenshot: 'Please upload an image file' }))
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, screenshot: 'File size must be less than 5MB' }))
        return
      }

      setFormData(prev => ({ ...prev, screenshot: file }))
      setPreviewUrl(URL.createObjectURL(file))
      if (errors.screenshot) {
        setErrors(prev => ({ ...prev, screenshot: '' }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }

    if (!formData.payerName.trim()) {
      newErrors.payerName = 'Payer name is required'
    }

    if (!formData.payerEmail.trim()) {
      newErrors.payerEmail = 'Payer email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.payerEmail)) {
      newErrors.payerEmail = 'Invalid email format'
    }

    if (!formData.payerPhone.trim()) {
      newErrors.payerPhone = 'Payer phone is required'
    } else if (!/^\d{10}$/.test(formData.payerPhone.replace(/\D/g, ''))) {
      newErrors.payerPhone = 'Invalid phone number format'
    }

    if (!formData.screenshot) {
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

    if (!selectedPlan) {
      toast.error('No plan selected')
      return
    }

    setIsSubmitting(true)

    try {
      // Create form data for file upload
      const submitFormData = new FormData()
      submitFormData.append('plan', selectedPlan.id)
      submitFormData.append('planName', selectedPlan.name)
      submitFormData.append('amount', formData.amount)
      submitFormData.append('transactionId', formData.transactionId)
      submitFormData.append('paymentMethod', formData.paymentMethod)
      submitFormData.append('payerName', formData.payerName)
      submitFormData.append('payerEmail', formData.payerEmail)
      submitFormData.append('payerPhone', formData.payerPhone)
      submitFormData.append('notes', formData.notes)
      
      if (formData.screenshot) {
        submitFormData.append('screenshot', formData.screenshot)
      }

      const response = await fetch('/api/subscription/submit-payment', {
        method: 'POST',
        body: submitFormData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('🎉 Payment Submitted Successfully!', {
          description: 'Your payment proof has been submitted for review. You will be notified once approved.',
          duration: 5000,
        })
        
        // Redirect to waiting page
        setTimeout(() => {
          router.push('/subscription/waiting')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Payment submission failed:', errorData)
        
        toast.error('❌ Submission Failed', {
          description: errorData.error || 'Failed to submit payment proof. Please try again.',
          duration: 5000,
        })
        
        // If it's a duplicate transaction ID, clear the field for user
        if (errorData.error?.includes('Transaction ID already exists')) {
          setFormData(prev => ({ ...prev, transactionId: '' }))
          setErrors(prev => ({ ...prev, transactionId: 'Please use a different transaction ID' }))
        }
      }
    } catch (error) {
      console.error('Payment submission error:', error)
      toast.error('❌ Network Error', {
        description: 'Please check your connection and try again.',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/subscription')}
            className="mb-6 hover:bg-white/50 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
          
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
            >
              <Crown className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              Complete Your Payment
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your payment proof for the <span className="font-semibold text-purple-600">{selectedPlan.name}</span> plan
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Summary - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r ${selectedPlan.color} opacity-10`}></div>
                <CardTitle className="flex items-center gap-3 relative z-10">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedPlan.color} text-white flex items-center justify-center text-lg font-bold shadow-lg`}>
                    {selectedPlan.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedPlan.name}</div>
                    {selectedPlan.popular && (
                      <div className="flex items-center gap-1 text-sm text-amber-600">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Most Popular</span>
                      </div>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="relative z-10 text-gray-600">
                  {selectedPlan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-6">
                  {/* Price Display */}
                  <div className="text-center py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Price</div>
                    <div className="flex items-center justify-center gap-2">
                      <IndianRupee className="w-6 h-6 text-gray-700" />
                      <span className="text-4xl font-bold text-gray-900">{selectedPlan.price}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">per {selectedPlan.duration}</div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Duration
                    </span>
                    <span className="font-semibold text-gray-900">{selectedPlan.duration}</span>
                  </div>

                  {selectedPlan.trialDays && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Trial Period
                      </span>
                      <span className="font-semibold text-green-600">{selectedPlan.trialDays} days</span>
                    </div>
                  )}

                  <div className="pt-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Features Included
                    </h4>
                    <ul className="space-y-3">
                      {selectedPlan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {selectedPlan.features.length > 4 && (
                        <li className="text-sm text-blue-600 font-medium pl-7">
                          +{selectedPlan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  Payment Details
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Please provide your payment information and upload proof of payment
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Payment Method Selection - Enhanced */}
                  <div>
                    <Label className="text-base font-semibold text-gray-900 mb-4 block">Select Payment Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'UPI', name: 'UPI', icon: Smartphone, desc: 'PhonePe, GPay, PayTM' },
                        { id: 'Bank Transfer', name: 'Bank Transfer', icon: Building2, desc: 'NEFT, IMPS, RTGS' },
                        { id: 'Cash', name: 'Cash', icon: DollarSign, desc: 'Direct cash payment' }
                      ].map((method) => (
                        <motion.div
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="button"
                            variant={formData.paymentMethod === method.id ? 'default' : 'outline'}
                            onClick={() => handleInputChange('paymentMethod', method.id)}
                            className={`w-full h-auto p-4 flex flex-col items-center gap-3 ${
                              formData.paymentMethod === method.id 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-lg' 
                                : 'hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <method.icon className="w-6 h-6" />
                            <div className="text-center">
                              <div className="font-medium">{method.name}</div>
                              <div className="text-xs opacity-75">{method.desc}</div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transaction ID */}
                    <div>
                      <Label htmlFor="transactionId" className="text-base font-semibold text-gray-900">
                        Transaction ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="transactionId"
                        type="text"
                        placeholder="Enter transaction ID"
                        value={formData.transactionId}
                        onChange={(e) => handleInputChange('transactionId', e.target.value)}
                        className={`mt-2 h-12 ${errors.transactionId ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                      {errors.transactionId && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.transactionId}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="amount" className="text-base font-semibold text-gray-900">
                        Amount (₹) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={formData.amount}
                          onChange={(e) => handleInputChange('amount', e.target.value)}
                          className={`pl-10 h-12 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.amount}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payer Name */}
                    <div>
                      <Label htmlFor="payerName" className="text-base font-semibold text-gray-900">
                        Payer Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="payerName"
                          type="text"
                          placeholder="Enter payer name"
                          value={formData.payerName}
                          onChange={(e) => handleInputChange('payerName', e.target.value)}
                          className={`pl-10 h-12 ${errors.payerName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.payerName && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.payerName}
                        </p>
                      )}
                    </div>

                    {/* Payer Email */}
                    <div>
                      <Label htmlFor="payerEmail" className="text-base font-semibold text-gray-900">
                        Payer Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="payerEmail"
                        type="email"
                        placeholder="Enter payer email"
                        value={formData.payerEmail}
                        onChange={(e) => handleInputChange('payerEmail', e.target.value)}
                        className={`mt-2 h-12 ${errors.payerEmail ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                      {errors.payerEmail && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.payerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payer Phone */}
                  <div>
                    <Label htmlFor="payerPhone" className="text-base font-semibold text-gray-900">
                      Payer Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="payerPhone"
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={formData.payerPhone}
                      onChange={(e) => handleInputChange('payerPhone', e.target.value)}
                      className={`mt-2 h-12 ${errors.payerPhone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    />
                    {errors.payerPhone && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.payerPhone}
                      </p>
                    )}
                  </div>

                  {/* Payment Screenshot - Enhanced */}
                  <div>
                    <Label htmlFor="screenshot" className="text-base font-semibold text-gray-900">
                      Payment Screenshot <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="screenshot"
                          className={`relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                            errors.screenshot 
                              ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                          }`}
                        >
                          {previewUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={previewUrl}
                                alt="Payment screenshot"
                                className="w-full h-full object-contain rounded-2xl p-4"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-4 right-4 shadow-lg"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, screenshot: null }))
                                  setPreviewUrl(null)
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-white" />
                              </div>
                              <p className="mb-2 text-lg font-medium text-gray-700">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          )}
                          <input
                            id="screenshot"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      {errors.screenshot && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.screenshot}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes" className="text-base font-semibold text-gray-900">
                      Additional Notes (Optional)
                    </Label>
                    <textarea
                      id="notes"
                      className="w-full p-4 mt-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                      placeholder="Any additional information about your payment"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </div>

                  {/* Alert - Enhanced */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Review Process:</strong> Your payment will be reviewed by our team within 24 hours. You'll receive an email confirmation once your payment is approved and your account is activated.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button - Enhanced */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/subscription')}
                      className="h-12 px-8 border-2 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Submitting Payment...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-3" />
                          Submit Payment Proof
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}