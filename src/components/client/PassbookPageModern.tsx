'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

// Debug wrapper for toast notifications
const debugToast = {
  success: (msg: string, opts?: any, source?: string) => {
    console.log('[Toast Success]', source, msg);
    // Make success notifications more prominent
    toast.success(msg, {
      ...opts,
      duration: opts?.duration || 5000,
      position: 'top-center',
      style: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
      }
    });
  },
  error: (msg: string, opts?: any, source?: string) => {
    console.log('[Toast Error]', source, msg);
    toast.error(msg, {
      ...opts,
      duration: 5000,
      position: 'top-center',
      style: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
      }
    });
  },
  info: (msg: string, opts?: any, source?: string) => {
    console.log('[Toast Info]', source, msg);
    toast.info(msg, {
      ...opts,
      duration: 5000,
      position: 'top-center',
      style: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
      }
    });
  }
};

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, 
  Plus, 
  Download, 
  RefreshCw, 
  Edit,
  Trash2,
  IndianRupee,
  Wallet,
  Receipt,
  Target,
  CreditCard
} from 'lucide-react';

// Import form component
import PassbookAddEntryForm from './PassbookAddEntryForm';

// Types
interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

interface PassbookEntry {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  deposit: number;
  installment: number;
  interest: number;
  fine: number;
  mode: string;
  description: string;
  balance: number;
  loanId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PassbookPageModern() {
  const { mutate } = useSWRConfig();
  
  // State
  const [passbookEntries, setPassbookEntries] = useState<PassbookEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PassbookEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanRequestEnabled, setLoanRequestEnabled] = useState(false);
  const [loanRequestAmount, setLoanRequestAmount] = useState<number>(0);
  const [selectedMemberForLoan, setSelectedMemberForLoan] = useState<string>('');
  const [showLoanSuccess, setShowLoanSuccess] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch passbook entries
  const fetchPassbookEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    try {
      const response = await fetch('/api/client/passbook');
      if (response.ok) {
        const data = await response.json();
        setPassbookEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching passbook entries:', error);
      debugToast.error('Failed to fetch passbook entries', {}, 'fetchPassbookEntries');
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  // Fetch members for loan request
  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch('/api/client/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      debugToast.error('Failed to fetch members', {}, 'fetchMembers');
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPassbookEntries();
    fetchMembers();
  }, [fetchPassbookEntries, fetchMembers]);

  // Handle save entry (from form)
  const handleSaveEntry = (entry: PassbookEntry) => {
    setShowAddForm(false);
    setEditingEntry(null);
    fetchPassbookEntries();
    mutate('/api/client/passbook');
  };

  // Handle edit
  const handleEdit = (entry: PassbookEntry) => {
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (entryId: string) => {
    const entry = passbookEntries.find(e => e.id === entryId);
    if (confirm(`Are you sure you want to delete this entry for ${entry?.memberName}?`)) {
      setDeletingEntry(entryId);
      try {
        const response = await fetch(`/api/client/passbook/delete?id=${entryId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          debugToast.success('✅ Entry Deleted', {
            description: 'Passbook entry has been deleted successfully',
            duration: 3000
          }, 'handleDelete');
          fetchPassbookEntries();
          mutate('/api/client/passbook');
        } else {
          const error = await response.json();
          debugToast.error(error.error || 'Failed to delete entry', {}, 'handleDelete');
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        debugToast.error('Failed to delete entry', {}, 'handleDelete');
      } finally {
        setDeletingEntry(null);
      }
    }
  };

  // Filter entries
  const filteredEntries = passbookEntries.filter(entry => {
    const matchesSearch = entry.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.mode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.mode === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: passbookEntries.length,
    totalDeposits: passbookEntries.reduce((sum, entry) => sum + entry.deposit, 0),
    totalInstallments: passbookEntries.reduce((sum, entry) => sum + entry.installment, 0),
    totalInterest: passbookEntries.reduce((sum, entry) => sum + entry.interest, 0),
  };

  const handleRefresh = () => {
    setIsLoadingEntries(true);
    fetchPassbookEntries();
    debugToast.success('🔄 Data Refreshed', {
      description: 'Passbook data has been refreshed',
      duration: 2000
    }, 'handleRefresh');
  };

  const handleExport = () => {
    debugToast.info('📊 Export Started', {
      description: 'Passbook data is being exported to CSV',
      duration: 3000
    }, 'handleExport');
  };

  // Handle loan request submission (amount optional)
  const handleLoanRequest = async () => {
    // validate member selected
    if (!selectedMemberForLoan) {
      debugToast.error('Please select a valid member', {}, 'handleLoanRequest');
      return;
    }

    // Allow amount optional:
    // If loanRequestAmount > 0 -> include amount in payload
    // If amount is 0 or empty -> do not include amount (server will treat as request without amount)
    const payload: any = {
      memberId: selectedMemberForLoan,
      description: 'Loan request from member portal'
    };
    if (loanRequestAmount && loanRequestAmount > 0) {
      payload.amount = loanRequestAmount;
    }

    try {
      console.log('Sending loan request payload:', payload);

      const response = await fetch('/api/client/loan-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Loan request response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loan request success:', result);
        
        // Show success state
        setShowLoanSuccess(true);
        console.log('✅ Success state set to true - showing success message');
        
        // Show prominent success notification
        debugToast.success('🎉 लोन रिक्वेस्ट सफलतापूर्वक भेजा गया!', {
          description: `आपका लोन रिक्वेस्ट सफलतापूर्वक सबमिट हो गया है। रिक्वेस्ट ID: ${result.loanId?.slice(0, 8) || 'N/A'}`,
          duration: 6000
        }, 'handleLoanRequest');
        
        // Reset form
        setLoanRequestEnabled(false);
        setLoanRequestAmount(0);
        setSelectedMemberForLoan('');
        fetchPassbookEntries();
        
        // Also show a confirmation alert for additional visibility
        setTimeout(() => {
          alert('✅ लोन रिक्वेस्ट सफलतापूर्वक भेजा गया!\n\nआपका लोन रिक्वेस्ट सफलतापूर्वक सबमिट हो गया है। कृपया एडमिन से अप्रूवल का इंतजार करें।');
        }, 1000);
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowLoanSuccess(false);
        }, 5000);
        
      } else {
        const error = await response.json();
        console.error('Loan request error:', error);
        debugToast.error(error.error || 'Failed to send loan request', {}, 'handleLoanRequest');
      }
    } catch (error) {
      console.error('Error sending loan request:', error);
      debugToast.error('Failed to send loan request', {}, 'handleLoanRequest');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              Passbook Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage member transactions, deposits, and financial entries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingEntries}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingEntries ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
            <Button
              onClick={() => setLoanRequestEnabled(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <CreditCard className="h-4 w-4" />
              Request Loan
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Deposits</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{stats.totalDeposits.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <IndianRupee className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Installments</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{stats.totalInstallments.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Interest</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{stats.totalInterest.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters & Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="flex-1">
          <Input
            placeholder="Search by member name, description, or payment mode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
            <SelectItem value="Online">Online</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Passbook Entries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-blue-600" />
              Passbook Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Member</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Mode</th>
                      <th className="text-right p-4 font-medium">Deposit</th>
                      <th className="text-right p-4 font-medium">Installment</th>
                      <th className="text-right p-4 font-medium">Interest</th>
                      <th className="text-right p-4 font-medium">
                        <div className="flex items-center justify-end gap-2">
                          Total Amount
                          <span className="text-xs text-gray-500 font-normal">(Deposit + Installment + Interest + Fine)</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{entry.memberName}</div>
                            {entry.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {entry.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {entry.mode}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          {entry.deposit > 0 && (
                            <span className="text-green-600 font-medium">
                              +₹{entry.deposit.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {entry.installment > 0 && (
                            <span className="text-blue-600 font-medium">
                              ₹{entry.installment.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {entry.interest > 0 && (
                            <span className="text-purple-600 font-medium">
                              ₹{entry.interest.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right font-medium">
                          ₹{entry.balance.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(entry)}
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingEntry === entry.id}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No entries found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by adding your first passbook entry'
                  }
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Entry Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                }}
              >
                ×
              </Button>
            </div>
            <PassbookAddEntryForm
              editingEntry={editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => {
                setShowAddForm(false);
                setEditingEntry(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Loan Request Dialog */}
      {loanRequestEnabled && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                Request New Loan
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoanRequestEnabled(false);
                  setSelectedMemberForLoan('');
                  setLoanRequestAmount(0);
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Member *</label>
                <Select value={selectedMemberForLoan} onValueChange={setSelectedMemberForLoan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMembers ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Loading members...
                      </div>
                    ) : (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Loan Amount (Optional)</label>
                <Input
                  type="number"
                  placeholder="Enter amount or leave empty"
                  value={loanRequestAmount ? loanRequestAmount : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLoanRequestAmount(v === '' ? 0 : parseFloat(v));
                  }}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If not specified, client will determine the loan amount later
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoanRequestEnabled(false);
                    setSelectedMemberForLoan('');
                    setLoanRequestAmount(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLoanRequest}
                  disabled={!selectedMemberForLoan}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Request Success Message */}
      {showLoanSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-2xl max-w-sm border-2 border-green-400"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <div>
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="font-bold text-lg"
              >
                🎉 वाह! सफलता!
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-green-100 text-sm"
              >
                आपका लोन रिक्वेस्ट सफलतापूर्वक भेजा गया है
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-green-200 text-xs mt-1"
              >
                कृपया एडमिन से अप्रूवल का इंतजार करें
              </motion.p>
            </div>
          </div>
          
          {/* Confetti dots animation */}
          <div className="absolute -top-2 -right-2">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  repeat: 0,
                }}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  top: `${Math.random() * 20 - 10}px`,
                  left: `${Math.random() * 20 - 10}px`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}