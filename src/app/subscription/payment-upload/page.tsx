'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, CreditCard, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const PLAN_DETAILS = {
  basic: {
    name: 'Basic',
    price: '₹4,000',
    duration: 'per month',
    description: 'Great for small societies',
    color: 'purple'
  },
  pro: {
    name: 'Pro',
    price: '₹7,000',
    duration: 'per month',
    description: 'Advanced features for larger societies',
    color: 'green'
  },
  enterprise: {
    name: 'Enterprise',
    price: '₹10,000',
    duration: 'per month',
    description: 'Complete solution for large organizations',
    color: 'orange'
  }
}

export default function PaymentUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams?.get('plan') || 'basic'
  
  const [formData, setFormData] = useState({
    transactionId: '',
    amount: '',
    paymentMethod: 'UPI',
    notes: ''
  })
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get plan details
  const planDetails = PLAN_DETAILS[planParam as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.basic

  useEffect(() => {
    // Set default amount based on plan
    const planAmounts: Record<string, string> = {
      basic: '4000',
      pro: '7000',
      enterprise: '10000'
    }
    setFormData(prev => ({ ...prev, amount: planAmounts[planParam] || '4000' }))
  }, [planParam])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }

    if (!screenshotFile) {
      newErrors.screenshot = 'Payment screenshot is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please upload an image file (JPG, PNG, etc.)',
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please upload an image smaller than 5MB',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Convert screenshot to base64
      const screenshotBase64 = screenshotPreview ? screenshotPreview.split(',')[1] : null

      const response = await fetch('/api/subscription/submit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planParam,
          amount: Number(formData.amount),
          transactionId: formData.transactionId,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          screenshot: screenshotBase64
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment submission failed')
      }
      
      toast.success('🎉 Payment submitted successfully!', {
        description: 'Your payment is now under review. You will be notified once approved.',
        duration: 5000,
      })

      // Redirect to subscription status page
      setTimeout(() => {
        router.push('/client/subscription/status')
      }, 2000)

    } catch (error: any) {
      console.error('Payment submission error:', error)
      toast.error('❌ Payment submission failed', {
        description: error.message || 'Something went wrong. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/subscription/select-plan" className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Plans
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Saanify</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Plan Summary */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Upload your payment proof to activate your {planDetails.name} subscription
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {planDetails.name} - {planDetails.price}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Please fill in your payment information accurately
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Transaction ID */}
                  <div>
                    <Label htmlFor="transactionId">Transaction ID *</Label>
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder="Enter your UPI transaction ID"
                      value={formData.transactionId}
                      onChange={(e) => handleInputChange('transactionId', e.target.value)}
                      className={`mt-1 ${errors.transactionId ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.transactionId && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.transactionId}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className={`mt-1 ${errors.amount ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={isLoading}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information about your payment"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="mt-1"
                      disabled={isLoading}
                      rows={3}
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <Label htmlFor="screenshot">Payment Screenshot *</Label>
                    <div className="mt-1">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="screenshot"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                            errors.screenshot ? 'border-red-500' : ''
                          }`}
                        >
                          {screenshotPreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={screenshotPreview}
                                alt="Payment screenshot"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <FileText className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> payment screenshot
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
                            disabled={isLoading}
                          />
                        </label>
                      </div>
                      {errors.screenshot && (
                        <p className="text-sm text-red-500 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.screenshot}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Payment...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Submit Payment Proof
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <div className="space-y-6">
              {/* UPI Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    UPI Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold mb-2">UPI ID:</p>
                    <p className="text-lg font-mono bg-white px-3 py-2 rounded border">saanify@paytm</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold mb-2">QR Code:</p>
                    <div className="bg-white p-4 rounded border flex items-center justify-center h-48">
                      <p className="text-gray-500">QR Code Image</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Payment verification typically takes 2-24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Make sure the transaction ID is clearly visible in the screenshot</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>You will receive email notification once payment is approved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>For any issues, contact support at support@saanify.com</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}