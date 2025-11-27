'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Shield, Edit, Trash2, Eye, Calendar, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { makeAuthenticatedRequest } from '@/lib/auth'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
  societyAccount?: {
    id: string
    name: string
    subscriptionPlan: string
    subscriptionEndsAt?: string
    status: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export default function AdminClientDetailPage() {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchClient()
  }, [])

  const fetchClient = async () => {
    try {
      const pathParts = window.location.pathname.split('/')
      const clientId = pathParts[pathParts.length - 1]
      
      const response = await makeAuthenticatedRequest(`/api/admin/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else {
        toast.error('Failed to fetch client details')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      toast.error('Failed to fetch client details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClient = async (field: string, value: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/clients/${client?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
        toast.success('Client updated successfully')
      } else {
        toast.error('Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    }
  }

  const handleDeleteClient = async () => {
    if (!client) return

    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      const response = await makeAuthenticatedRequest(`/api/admin/clients/${client.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Client deleted successfully')
        router.push('/admin/clients')
      } else {
        toast.error('Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 border-t-transparent mx-auto"></div>
        <p className="text-gray-600">Loading client details...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Client not found</h1>
          <Button onClick={() => router.push('/admin/clients')}>
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant="outline"
            onClick={() => router.push('/admin/clients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Client ID</label>
                  <p className="text-gray-900">{client.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{client.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{client.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{client.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-gray-900">{client.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge className={client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {client.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteClient()}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Society Account</h3>
                    {client.societyAccount ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Society Name</label>
                          <p className="text-gray-900">{client.societyAccount.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Subscription Plan</label>
                          <p className="text-gray-900">{client.societyAccount.subscriptionPlan}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          <Badge className={client.societyAccount.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {client.societyAccount.status}
                          </Badge>
                        </div>
                        {client.societyAccount.subscriptionEndsAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Expires</label>
                            <p className="text-gray-900">{new Date(client.societyAccount.subscriptionEndsAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No society account linked</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="subscription">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Subscription Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Current Plan:</span>
                      <Badge className="bg-blue-100 text-blue-800">{client.plan || 'None'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <Badge className={
                        client.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        client.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {client.subscriptionStatus || 'NONE'}
                      </Badge>
                    </div>
                    {client.expiryDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Expires:</span>
                        <span className="text-sm text-gray-900">{new Date(client.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                  <div className="text-sm text-gray-500">Activity log coming soon...</div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}