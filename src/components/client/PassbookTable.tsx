'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PassbookTransaction } from '@/data/passbookMock';
import { format } from 'date-fns';

interface PassbookTableProps {
  transactions: PassbookTransaction[];
}

export default function PassbookTable({ transactions }: PassbookTableProps) {
  // Filter out notification entries
  const filteredTransactions = transactions.filter(transaction => transaction.mode !== "Notification");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.COMPLETED}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      CREDIT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      DEBIT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <Badge className={variants[type as keyof typeof variants]}>
        {type}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <span>Total Amount</span>
                      <span className="text-xs text-gray-500 font-normal">(Deposit + Installment + Interest + Fine)</span>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.reference}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(transaction.type)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.balance)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.reference}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No transactions found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}