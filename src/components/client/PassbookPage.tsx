'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PassbookTransaction } from '@/data/passbookMock';
import { passbookMockData } from '@/data/passbookMock';
import PassbookHeader from './PassbookHeader';
import PassbookFilters from './PassbookFilters';
import PassbookTable from './PassbookTable';
import PassbookMobileCards from './PassbookMobileCards';
import PassbookSummaryPanel from './PassbookSummaryPanel';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

export default function PassbookPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const { toast } = useToast();

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalCredits = passbookMockData
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = passbookMockData
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = passbookMockData.length > 0 
      ? passbookMockData[passbookMockData.length - 1].balance 
      : 0;

    return {
      currentBalance,
      totalCredits,
      totalDebits
    };
  }, []);

  // Filter transactions based on all criteria
  const filteredTransactions = useMemo(() => {
    let filtered = [...passbookMockData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(transaction => 
        transaction.category === selectedCategory
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (dateRange) {
        case '7days':
          cutoffDate = subDays(now, 7);
          break;
        case '30days':
          cutoffDate = subDays(now, 30);
          break;
        case '90days':
          cutoffDate = subDays(now, 90);
          break;
        default:
          cutoffDate = new Date(0); // Beginning of time
      }

      filtered = filtered.filter(transaction => 
        new Date(transaction.date) >= cutoffDate
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchTerm, selectedCategory, selectedType, dateRange]);

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Description', 'Category', 'Type', 'Amount', 'Balance', 'Status', 'Reference'],
        ...filteredTransactions.map(t => [
          t.date,
          t.description,
          t.category,
          t.type,
          t.amount.toString(),
          t.balance.toString(),
          t.status,
          t.reference
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passbook-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredTransactions.length} transactions to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export transactions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedCategory('all');
    setDateRange('all');
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset",
    });
  };

  const toggleFilters = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PassbookHeader
          totalBalance={summaryStats.currentBalance}
          totalCredits={summaryStats.totalCredits}
          totalDebits={summaryStats.totalDebits}
          onExport={handleExport}
          onFilterToggle={toggleFilters}
        />

        {/* Filters */}
        <AnimatePresence>
          <PassbookFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedType={selectedType}
            setSelectedType={setSelectedCategory}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onClearFilters={handleClearFilters}
            isFilterVisible={isFilterVisible}
          />
        </AnimatePresence>

        {/* Summary Panel */}
        <div className="hidden lg:block">
          <PassbookSummaryPanel
            transactions={filteredTransactions}
            currentBalance={summaryStats.currentBalance}
          />
        </div>

        {/* Transaction List - Desktop Table */}
        <div className="hidden md:block">
          <PassbookTable transactions={filteredTransactions} />
        </div>

        {/* Transaction List - Mobile Cards */}
        <div className="md:hidden">
          <PassbookMobileCards transactions={filteredTransactions} />
        </div>

        {/* Results Summary */}
        {filteredTransactions.length !== passbookMockData.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-gray-600 dark:text-gray-400"
          >
            Showing {filteredTransactions.length} of {passbookMockData.length} transactions
          </motion.div>
        )}
      </div>
    </div>
  );
}