'use client';

// ⚠️ DISABLED - OLD PASSBOOK PAGE (REPLACED BY NEW SYSTEM)
// This file is disabled and renamed to avoid confusion
// Use the new passbook system instead

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Trash2, Save, X, Calculator, User, DollarSign, CreditCard, IndianRupee } from 'lucide-react';

// Types
interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

interface MemberDetails {
  member: Member;
  currentBalance: number;
  activeLoan?: {
    loanId: string;
    outstandingBalance: number;
    loanAmount: number;
    interestRate: number;
  };
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

// Form Schema
const formSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  depositDate: z.date({
    required_error: 'Deposit date is required',
  }),
  depositAmount: z.number().min(0, 'Deposit amount must be non-negative'),
  installmentAmount: z.number().min(0, 'Installment amount must be non-negative'),
  interest: z.number().min(0, 'Interest must be non-negative'),
  fine: z.number().min(0, 'Fine must be non-negative'),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Payment modes
const paymentModes = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Other', label: 'Other' },
];

export default function PassbookPage_DISABLED_OLD() {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  
  // State
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [passbookEntries, setPassbookEntries] = useState<PassbookEntry[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PassbookEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
      depositDate: new Date(),
      depositAmount: 0,
      installmentAmount: 0,
      interest: 0,
      fine: 0,
      paymentMode: 'Cash',
      note: '',
    },
  });

  const watchedValues = form.watch();

  // Fetch members
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
      toast({
        title: 'Error',
        description: 'Failed to fetch members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMembers(false);
    }
  }, [toast]);

  // Fetch member details
  const fetchMemberDetails = useCallback(async (memberId: string) => {
    try {
      const response = await fetch(`/api/client/members?memberId=${memberId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMember(data);
        
        // Auto-calculate interest and fine
        if (data.activeLoan) {
          const interest = Math.round((data.activeLoan.outstandingBalance * 0.01) * 100) / 100;
          form.setValue('interest', interest);
        }

        const depositDate = form.getValues('depositDate');
        if (depositDate) {
          const daysLate = Math.max(0, depositDate.getDate() - 15);
          const fine = daysLate * 10;
          form.setValue('fine', fine);
        }
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  }, [form]);

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
      toast({
        title: 'Error',
        description: 'Failed to fetch passbook entries',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEntries(false);
    }
  }, [toast]);

  // Calculate live preview
  const calculatePreview = useCallback(() => {
    if (!selectedMember) return null;

    const { depositAmount, installmentAmount, interest, fine } = watchedValues;
    const previousBalance = selectedMember.currentBalance;
    const newBalance = previousBalance + depositAmount - installmentAmount + interest + fine;

    return {
      previousBalance,
      newBalance,
      netChange: depositAmount - installmentAmount + interest + fine,
    };
  }, [selectedMember, watchedValues]);

  // Auto-calculate fine when date changes
  useEffect(() => {
    if (watchedValues.depositDate) {
      const daysLate = Math.max(0, watchedValues.depositDate.getDate() - 15);
      const fine = daysLate * 10;
      form.setValue('fine', fine);
    }
  }, [watchedValues.depositDate, form]);

  // Initial data fetch
  useEffect(() => {
    fetchMembers();
    fetchPassbookEntries();
  }, [fetchMembers, fetchPassbookEntries]);

  // Handle member selection
  const handleMemberChange = (memberId: string) => {
    form.setValue('memberId', memberId);
    fetchMemberDetails(memberId);
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!data.depositAmount && !data.installmentAmount) {
      toast({
        title: 'Validation Error',
        description: 'Either deposit or installment amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        memberId: data.memberId,
        date: format(data.depositDate, 'yyyy-MM-dd'),
        deposit: data.depositAmount,
        installment: data.installmentAmount,
        interest: data.interest,
        fine: data.fine,
        mode: data.paymentMode,
        note: data.note,
      };

      let response;
      if (editingEntry) {
        response = await fetch(`/api/client/passbook/update?id=${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/client/passbook/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: editingEntry ? 'Entry updated successfully' : 'Entry created successfully',
        });

        // Reset form and refresh data
        form.reset();
        setEditingEntry(null);
        setSelectedMember(null);
        fetchPassbookEntries();
        
        // Invalidate SWR cache
        mutate('/api/client/passbook');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save entry',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (entry: PassbookEntry) => {
    setEditingEntry(entry);
    form.setValue('memberId', entry.memberId);
    form.setValue('depositDate', new Date(entry.date));
    form.setValue('depositAmount', entry.deposit);
    form.setValue('installmentAmount', entry.installment);
    form.setValue('interest', entry.interest);
    form.setValue('fine', entry.fine);
    form.setValue('paymentMode', entry.mode);
    form.setValue('note', entry.description);
    
    fetchMemberDetails(entry.memberId);
  };

  // Handle delete
  const handleDelete = async (entryId: string) => {
    try {
      const response = await fetch(`/api/client/passbook/delete?id=${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Entry deleted successfully',
        });
        fetchPassbookEntries();
        mutate('/api/client/passbook');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete entry',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingEntry(null);
    form.reset();
    setSelectedMember(null);
  };

  const preview = calculatePreview();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ⚠️ DISABLED WARNING */}
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>⚠️ DISABLED:</strong> This is the old passbook page (PassbookPage_DISABLED_OLD). 
            Please use the new passbook system instead. This component is kept for reference only.
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Passbook Management (DISABLED)</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage member transactions and entries (OLD VERSION)</p>
          </div>
          {editingEntry && (
            <Badge variant="secondary" className="text-sm">
              Editing Entry #{editingEntry.id.slice(-8)}
            </Badge>
          )}
        </div>

        {/* Rest of the component remains the same but is disabled */}
        <div className="opacity-50 pointer-events-none">
          {/* Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </CardTitle>
              <CardDescription>
                {editingEntry ? 'Modify the transaction details' : 'Create a new passbook entry'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Member Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Member *</label>
                    <Controller
                      name="memberId"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={handleMemberChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingMembers ? (
                              <div className="p-2">
                                <Skeleton className="h-4 w-full" />
                              </div>
                            ) : (
                              members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {member.name} — {member.id.slice(-8)}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.memberId && (
                      <p className="text-sm text-red-600">{form.formState.errors.memberId.message}</p>
                    )}
                  </div>

                  {/* Deposit Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deposit Date *</label>
                    <Controller
                      name="depositDate"
                      control={form.control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {form.formState.errors.depositDate && (
                      <p className="text-sm text-red-600">{form.formState.errors.depositDate.message}</p>
                    )}
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Mode *</label>
                    <Controller
                      name="paymentMode"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModes.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.paymentMode && (
                      <p className="text-sm text-red-600">{form.formState.errors.paymentMode.message}</p>
                    )}
                  </div>

                  {/* Deposit Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deposit Amount</label>
                    <Controller
                      name="depositAmount"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    />
                    {form.formState.errors.depositAmount && (
                      <p className="text-sm text-red-600">{form.formState.errors.depositAmount.message}</p>
                    )}
                  </div>

                  {/* Installment Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Installment Amount</label>
                    <Controller
                      name="installmentAmount"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    />
                    {form.formState.errors.installmentAmount && (
                      <p className="text-sm text-red-600">{form.formState.errors.installmentAmount.message}</p>
                    )}
                  </div>

                  {/* Interest */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interest</label>
                    <Controller
                      name="interest"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    />
                    {form.formState.errors.interest && (
                      <p className="text-sm text-red-600">{form.formState.errors.interest.message}</p>
                    )}
                  </div>

                  {/* Fine */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fine</label>
                    <Controller
                      name="fine"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    />
                    {form.formState.errors.fine && (
                      <p className="text-sm text-red-600">{form.formState.errors.fine.message}</p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium">Note</label>
                    <Controller
                      name="note"
                      control={form.control}
                      render={({ field }) => (
                        <Textarea
                          placeholder="Enter any additional notes..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Member Info & Preview */}
                {selectedMember && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Member Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Member Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="font-medium">{selectedMember.member.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="font-medium">{selectedMember.member.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance:</span>
                          <span className="font-medium">₹{selectedMember.currentBalance.toLocaleString('en-IN')}</span>
                        </div>
                        {selectedMember.activeLoan && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Loan Balance:</span>
                              <span className="font-medium text-red-600">₹{selectedMember.activeLoan.outstandingBalance.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Loan Amount:</span>
                              <span className="font-medium">₹{selectedMember.activeLoan.loanAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Balance Preview */}
                    {preview && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Balance Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Previous Balance:</span>
                            <span className="font-medium">₹{preview.previousBalance.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Net Change:</span>
                            <span className={`font-medium ${preview.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {preview.netChange >= 0 ? '+' : ''}₹{preview.netChange.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between text-lg font-bold">
                              <span>New Balance:</span>
                              <span className={preview.newBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ₹{preview.newBalance.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {editingEntry && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Edit
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Create Entry')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Passbook Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Latest passbook transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : passbookEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No entries found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Member</th>
                        <th className="text-right py-3 px-4">Deposit</th>
                        <th className="text-right py-3 px-4">Installment</th>
                        <th className="text-right py-3 px-4">Interest</th>
                        <th className="text-right py-3 px-4">Fine</th>
                        <th className="text-right py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">Mode</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passbookEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4">{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{entry.memberName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {entry.deposit > 0 && (
                              <span className="text-green-600 font-medium">+₹{entry.deposit.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {entry.installment > 0 && (
                              <span className="text-red-600 font-medium">-₹{entry.installment.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {entry.interest > 0 && (
                              <span className="text-blue-600 font-medium">+₹{entry.interest.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {entry.fine > 0 && (
                              <span className="text-orange-600 font-medium">+₹{entry.fine.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ₹{entry.balance.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              {entry.mode}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {entry.description}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(entry)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this entry? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
        </div>
      </div>
    </div>
  );
}