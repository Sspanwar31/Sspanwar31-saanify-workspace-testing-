'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, DollarSign, Calendar, User } from 'lucide-react'
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
    color: 'bg-gradient-to-r from-green-500 to-emerald-600',
    icon: '🚀',
    popular: true,
    trialDays: 15
  },
  {
    id: 'basic',
    name: 'BASIC',
    description: 'Perfect for small societies with basic accounting needs',
    price: 4000,
    duration: 'monthly',
    features: [
      'Up to 50 members',
      'Basic accounting features',
      'Email support',
      'Mobile app access',
      'Community management'
    ],
    color: 'bg-blue-500',
    icon: '🏠️',
    popular: true,
    trialDays: 15
  },
  {
    id: 'pro',
    name: 'PROFESSIONAL',
    description: 'Advanced features for growing societies with complex operations',
    price: 8000,
    duration: 'monthly',
    features: [
      'Up to 200 members',
      'Advanced accounting & reporting',
      'Priority support',
      'Mobile app + Web access',
      'Advanced analytics',
      'API integrations',
      'Custom workflows',
      'Community management + forums'
    ],
    color: 'bg-purple-500',
    icon: '💎',
    popular: true,
    trialDays: 15
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    description: 'Complete solution for large enterprises with unlimited everything',
    price: 15000,
    duration: 'monthly',
    features: [
      'Unlimited members',
      'Enterprise-grade security',
      'Advanced analytics & reporting',
      'API integrations + Webhooks',
      'Custom workflows & automations',
      'Priority support 24/7',
      'Mobile app + Web access',
      'Advanced security & compliance',
      'Dedicated account manager',
      'White-label solutions',
      'Advanced community features'
    ],
    color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
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
      // Get auth token from cookies
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
      }
      
      const authToken = getCookie('auth-token')
      
      if (!authToken) {
        toast.error('❌ Authentication Required', {
          description: 'Please login to submit payment proof.',
          duration: 3000,
        })
        router.push('/login')
        return
      }

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
        headers: {
          // Add authentication token from cookie
          'Authorization': `Bearer ${authToken}`
        },
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
        toast.error('❌ Submission Failed', {
          description: data.error || 'Failed to submit payment proof. Please try again.',
          duration: 3000,
        })
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/subscription')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600">
              Upload your payment proof for {selectedPlan.name} plan
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${selectedPlan.color} text-white flex items-center justify-center text-sm font-bold`}>
                    {selectedPlan.icon}
                  </div>
                  {selectedPlan.name}
                </CardTitle>
                <CardDescription>{selectedPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-lg">{formatPrice(selectedPlan.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{selectedPlan.duration}</span>
                  </div>
                  {selectedPlan.trialDays && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trial:</span>
                      <span className="text-green-600 font-medium">{selectedPlan.trialDays} days</span>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {selectedPlan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                      {selectedPlan.features.length > 3 && (
                        <li className="text-blue-600">+{selectedPlan.features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Please provide your payment information and upload proof of payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {['UPI', 'Bank Transfer', 'Cash'].map((method) => (
                        <Button
                          key={method}
                          type="button"
                          variant={formData.paymentMethod === method ? 'default' : 'outline'}
                          onClick={() => handleInputChange('paymentMethod', method)}
                          className="w-full"
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Transaction ID */}
                    <div>
                      <Label htmlFor="transactionId">Transaction ID *</Label>
                      <Input
                        id="transactionId"
                        type="text"
                        placeholder="Enter transaction ID"
                        value={formData.transactionId}
                        onChange={(e) => handleInputChange('transactionId', e.target.value)}
                        className={errors.transactionId ? 'border-red-500' : ''}
                      />
                      {errors.transactionId && (
                        <p className="text-red-500 text-sm mt-1">{errors.transactionId}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className={errors.amount ? 'border-red-500' : ''}
                      />
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payer Name */}
                    <div>
                      <Label htmlFor="payerName">Payer Name *</Label>
                      <Input
                        id="payerName"
                        type="text"
                        placeholder="Enter payer name"
                        value={formData.payerName}
                        onChange={(e) => handleInputChange('payerName', e.target.value)}
                        className={errors.payerName ? 'border-red-500' : ''}
                      />
                      {errors.payerName && (
                        <p className="text-red-500 text-sm mt-1">{errors.payerName}</p>
                      )}
                    </div>

                    {/* Payer Email */}
                    <div>
                      <Label htmlFor="payerEmail">Payer Email *</Label>
                      <Input
                        id="payerEmail"
                        type="email"
                        placeholder="Enter payer email"
                        value={formData.payerEmail}
                        onChange={(e) => handleInputChange('payerEmail', e.target.value)}
                        className={errors.payerEmail ? 'border-red-500' : ''}
                      />
                      {errors.payerEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.payerEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Payer Phone */}
                  <div>
                    <Label htmlFor="payerPhone">Payer Phone *</Label>
                    <Input
                      id="payerPhone"
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={formData.payerPhone}
                      onChange={(e) => handleInputChange('payerPhone', e.target.value)}
                      className={errors.payerPhone ? 'border-red-500' : ''}
                    />
                    {errors.payerPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.payerPhone}</p>
                    )}
                  </div>

                  {/* Payment Screenshot */}
                  <div>
                    <Label htmlFor="screenshot">Payment Screenshot *</Label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="screenshot"
                          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${errors.screenshot ? 'border-red-500' : ''}`}
                        >
                          {previewUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={previewUrl}
                                alt="Payment screenshot"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
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
                              <Upload className="w-10 h-10 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
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
                        <p className="text-red-500 text-sm mt-1">{errors.screenshot}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any additional information about your payment"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </div>

                  {/* Alert */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your payment will be reviewed by our team within 24 hours. You'll receive an email once your payment is approved.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/subscription')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
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