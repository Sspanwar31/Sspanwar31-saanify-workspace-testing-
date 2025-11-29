"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Search, 
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Filter,
  Eye
} from "lucide-react";
import Link from "next/link";

interface PaymentRecord {
  id: string;
  plan: string;
  amount: number;
  method: string;
  transactionId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  proofUrl?: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/subscription/payment-history');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || payment.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/subscription/receipt/${paymentId}`);
      if (!response.ok) throw new Error('Failed to generate receipt');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard/client">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Payment History</h1>
            </div>
            <Link href="/subscription">
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by plan, transaction ID, or method..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filterStatus === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("approved")}
                  >
                    Approved
                  </Button>
                  <Button
                    variant={filterStatus === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("rejected")}
                  >
                    Rejected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Your Payment Records
              </CardTitle>
              <CardDescription>
                View and manage all your subscription payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterStatus !== "all" 
                      ? "No payments match your search criteria." 
                      : "You haven't made any payments yet."}
                  </p>
                  <Link href="/subscription">
                    <Button>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Your First Payment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Plan</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Method</th>
                        <th className="text-left p-3">Transaction ID</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium capitalize">{payment.plan}</td>
                          <td className="p-3 font-semibold">${payment.amount}</td>
                          <td className="p-3 capitalize">{payment.method}</td>
                          <td className="p-3 font-mono text-xs">{payment.transactionId}</td>
                          <td className="p-3">{formatDate(payment.createdAt)}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(payment.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(payment.status)}
                                <span>{payment.status.toUpperCase()}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {payment.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadReceipt(payment.id)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Receipt
                                </Button>
                              )}
                              {payment.proofUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(payment.proofUrl, '_blank')}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Proof
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {payments.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Approved Payments</p>
                      <p className="text-2xl font-semibold">
                        {payments.filter(p => p.status === 'APPROVED').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                      <p className="text-2xl font-semibold">
                        {payments.filter(p => p.status === 'PENDING').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Spent</p>
                      <p className="text-2xl font-semibold">
                        ${payments
                          .filter(p => p.status === 'APPROVED')
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}