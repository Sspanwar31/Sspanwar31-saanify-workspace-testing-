'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  FileText,
  Download,
  ArrowRight,
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Info,
  Shield,
  Star,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  TrendingUp,
  BarChart3,
  Activity,
  Building2,
  Users as UsersIcon,
  Eye,
  EyeOff,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Settings,
  Menu,
  MoreHorizontal,
  Edit,
  Lock,
  Unlock,
  Crown,
  Gem,
  Bell,
  FileSearch,
  Search,
  Filter,
  Calendar,
  Copy,
  Check,
  X,
  ChevronLeft,
  ArrowLeft,
  Home,
  UserPlus,
  UserCheck,
  ArrowUpRight,
  Square,
  Smartphone,
  Laptop,
  Monitor,
  Database,
  Server,
  Cpu,
  Globe,
  Target,
  Target as TargetIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { makeAuthenticatedRequest } from '@/lib/auth'

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
  yearlyDiscount?: number
  monthlyPrice?: number
  yearlyPrice?: number
  trialDays?: number
  highlight?: boolean
}

interface PaymentProof {
  id: string
  userId: string
  amount: number
  plan: string
  txnId: string
  screenshotUrl: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    societyName: string
  }
}

interface FormData {
  selectedPlan: string
  transactionId: string
  screenshot: File | null
  additionalInfo: string
  paymentMethod: string
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
    monthlyPrice: 4000,
    yearlyPrice: 40000,
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
    monthlyPrice: 8000,
    yearlyPrice: 80000,
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
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    trialDays: 15
  }
]

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', icon: '📱' },
  { id: 'paytm', name: 'PayTM', icon: '📟' },
  { id: 'gpay', name: 'Google Pay', icon: '🌐' },
  { id: 'phonepe', name: 'PhonePe', icon: '📱' },
  { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'cash', name: 'Cash', icon: '💵' }
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    selectedPlan: '',
    transactionId: '',
    screenshot: null,
    additionalInfo: '',
    paymentMethod: 'upi'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.selectedPlan || !formData.transactionId) {
      toast.error('Please select a plan and enter transaction details')
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('plan', formData.selectedPlan)
      formDataToSend.append('transactionId', formData.transactionId)
      formDataToSend.append('additionalInfo', formData.additionalInfo)
      formDataToSend.append('paymentMethod', formData.paymentMethod)
      
      if (formData.screenshot) {
        formDataToSend.append('screenshot', formData.screenshot)
      }

      const response = await makeAuthenticatedRequest('/api/subscribe/request', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Payment request submitted successfully!')
        setFormData({
          selectedPlan: '',
          transactionId: '',
          screenshot: null,
          additionalInfo: '',
          paymentMethod: 'upi'
        })
        setShowPaymentForm(false)
        router.push('/subscription/waiting')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit payment request')
      }
    } catch (error) {
      console.error('Failed to submit payment request:', error)
      toast.error('Failed to submit payment request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    setShowPaymentForm(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, screenshot: file }))
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

  const getPopularBadge = (plan: SubscriptionPlan) => {
    if (plan.popular) {
      return <Badge className="bg-orange-100 text-orange-800">Popular</Badge>
    }
    return null
  }

  const getTrialBadge = (plan: SubscriptionPlan) => {
    if (plan.trialDays && plan.trialDays > 0) {
      return <Badge className="bg-green-100 text-green-800">Trial Available</Badge>
    }
    return null
  }

  const getYearlyDiscount = (plan: SubscriptionPlan) => {
    if (plan.yearlyDiscount && plan.yearlyDiscount > 0) {
      return <Badge className="bg-red-100 text-red-800">
        Save {plan.yearlyDiscount * 10}% yearly
      </Badge>
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            Select's subscription that best fits your society needs
          </p>
        </motion.div>

        {/* Plans Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="h-full"
            >
              <Card className={`relative overflow-hidden border-2 ${plan.color} border-opacity-20 hover:border-opacity-30 transition-all duration-300 cursor-pointer`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${plan.color} text-white flex items-center justify-center text-lg font-bold`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-blue-100 text-sm">{plan.description}</p>
                      </div>
                    </div>
                    {getPopularBadge(plan)}
                    {getTrialBadge(plan)}
                  </div>
                  <div className="absolute top-4 right-4">
                    {getYearlyDiscount(plan)}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{formatPrice(plan.price)}</div>
                      <div className="text-sm text-blue-200 line-through">
                        {plan.yearlyPrice ? formatPrice(plan.yearlyPrice * 0.9) : ''}
                      </div>
                    </div>
                    <div className="text-sm text-white">
                      <span className="text-blue-100">/{plan.duration}</span>
                      {plan.trialDays && (
                        <span className="text-green-100">+{plan.trialDays} days trial</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <ul className="space-y-2 text-sm text-white">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Payment Form Modal */}
        <Dialog open={showPaymentForm} onOpenChange={() => setShowPaymentForm(false)}>
          <DialogContent className="sm:max-w-[500px] w-full">
            <DialogHeader>
              <DialogTitle>Complete Your Subscription</DialogTitle>
              <DialogDescription>
                You've selected <span className="font-semibold text-blue-600">{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name || 'Basic'}</span> plan.
                Please complete your payment details to activate your subscription.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transactionId">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    type="text"
                    placeholder="Enter your transaction ID"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <span>{method.icon}</span>
                            <span>{method.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any additional information or notes"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="screenshot">Payment Screenshot *</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <Input
                    type="file"
                    id="screenshot"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full"
                  />
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-500">
                      {formData.screenshot ? (
                        <div className="flex items-center gap-2">
                          <span>File selected: {formData.screenshot.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, screenshot: null }))}
                          >
                            <X />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <Upload /> payment screenshot
                        </div>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Payment Request'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}