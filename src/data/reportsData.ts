// Mock Reports Data for Saanify Society Management Platform

export interface ReportItem {
  id: string
  type: 'member' | 'loan' | 'income' | 'expense' | 'maturity'
  memberId?: string
  memberName?: string
  amount: number
  date: string
  status: 'active' | 'completed' | 'pending' | 'overdue' | 'paid'
  description: string
  category?: string
  dueDate?: string
}

export interface ReportSummary {
  totalMembers: number
  totalLoans: number
  totalIncome: number
  totalExpenses: number
  totalMaturityDue: number
  period: string
}

export interface ChartData {
  income: { month: string; amount: number }[]
  expenses: { month: string; amount: number }[]
  loanDistribution: { type: string; amount: number; count: number }[]
}

// Mock report items
export const mockReports: ReportItem[] = [
  // Member reports
  {
    id: 'r1',
    type: 'member',
    memberId: 'm1',
    memberName: 'Rajesh Kumar',
    amount: 5000,
    date: '2024-01-15',
    status: 'active',
    description: 'New member registration fee',
    category: 'Registration'
  },
  {
    id: 'r2',
    type: 'member',
    memberId: 'm2',
    memberName: 'Priya Sharma',
    amount: 5000,
    date: '2024-01-20',
    status: 'active',
    description: 'New member registration fee',
    category: 'Registration'
  },
  {
    id: 'r3',
    type: 'member',
    memberId: 'm3',
    memberName: 'Amit Patel',
    amount: 5000,
    date: '2024-02-01',
    status: 'active',
    description: 'New member registration fee',
    category: 'Registration'
  },

  // Loan reports
  {
    id: 'r4',
    type: 'loan',
    memberId: 'm1',
    memberName: 'Rajesh Kumar',
    amount: 50000,
    date: '2024-01-25',
    status: 'active',
    description: 'Personal loan - 12 months tenure',
    category: 'Personal Loan',
    dueDate: '2025-01-25'
  },
  {
    id: 'r5',
    type: 'loan',
    memberId: 'm2',
    memberName: 'Priya Sharma',
    amount: 75000,
    date: '2024-02-10',
    status: 'active',
    description: 'Emergency loan - 18 months tenure',
    category: 'Emergency Loan',
    dueDate: '2025-08-10'
  },
  {
    id: 'r6',
    type: 'loan',
    memberId: 'm4',
    memberName: 'Sunita Reddy',
    amount: 30000,
    date: '2024-02-15',
    status: 'completed',
    description: 'Education loan - 6 months tenure',
    category: 'Education Loan',
    dueDate: '2024-08-15'
  },

  // Income reports
  {
    id: 'r7',
    type: 'income',
    amount: 25000,
    date: '2024-01-31',
    status: 'paid',
    description: 'Monthly maintenance collection',
    category: 'Maintenance'
  },
  {
    id: 'r8',
    type: 'income',
    amount: 15000,
    date: '2024-02-05',
    status: 'paid',
    description: 'Event hall rental income',
    category: 'Rental Income'
  },
  {
    id: 'r9',
    type: 'income',
    amount: 8000,
    date: '2024-02-10',
    status: 'paid',
    description: 'Parking fees collection',
    category: 'Parking'
  },
  {
    id: 'r10',
    type: 'income',
    amount: 12000,
    date: '2024-02-15',
    status: 'pending',
    description: 'Late payment fees',
    category: 'Penalty'
  },

  // Expense reports
  {
    id: 'r11',
    type: 'expense',
    amount: 18000,
    date: '2024-02-01',
    status: 'paid',
    description: 'Security guard salaries',
    category: 'Salaries'
  },
  {
    id: 'r12',
    type: 'expense',
    amount: 8500,
    date: '2024-02-05',
    status: 'paid',
    description: 'Electricity bill payment',
    category: 'Utilities'
  },
  {
    id: 'r13',
    type: 'expense',
    amount: 12000,
    date: '2024-02-10',
    status: 'paid',
    description: 'Water bill payment',
    category: 'Utilities'
  },
  {
    id: 'r14',
    type: 'expense',
    amount: 6500,
    date: '2024-02-12',
    status: 'pending',
    description: 'Garden maintenance',
    category: 'Maintenance'
  },

  // Maturity reports
  {
    id: 'r15',
    type: 'maturity',
    memberId: 'm5',
    memberName: 'Vikram Singh',
    amount: 45000,
    date: '2024-02-15',
    status: 'overdue',
    description: 'Fixed deposit maturity - 1 year',
    category: 'Fixed Deposit',
    dueDate: '2024-02-10'
  },
  {
    id: 'r16',
    type: 'maturity',
    memberId: 'm6',
    memberName: 'Anjali Gupta',
    amount: 32000,
    date: '2024-02-20',
    status: 'pending',
    description: 'Recurring deposit maturity - 6 months',
    category: 'Recurring Deposit',
    dueDate: '2024-02-25'
  },
  {
    id: 'r17',
    type: 'maturity',
    memberId: 'm1',
    memberName: 'Rajesh Kumar',
    amount: 55000,
    date: '2024-03-01',
    status: 'pending',
    description: 'Fixed deposit maturity - 1 year',
    category: 'Fixed Deposit',
    dueDate: '2024-03-05'
  }
]

// Report summary data
export const mockReportSummary: ReportSummary = {
  totalMembers: 156,
  totalLoans: 1245000,
  totalIncome: 285000,
  totalExpenses: 142000,
  totalMaturityDue: 287000,
  period: 'Jan 2024 - Mar 2024'
}

// Chart data for visualizations
export const mockChartData: ChartData = {
  income: [
    { month: 'Jan', amount: 85000 },
    { month: 'Feb', amount: 92000 },
    { month: 'Mar', amount: 108000 }
  ],
  expenses: [
    { month: 'Jan', amount: 45000 },
    { month: 'Feb', amount: 48000 },
    { month: 'Mar', amount: 49000 }
  ],
  loanDistribution: [
    { type: 'Personal Loan', amount: 450000, count: 12 },
    { type: 'Emergency Loan', amount: 320000, count: 8 },
    { type: 'Education Loan', amount: 280000, count: 6 },
    { type: 'Business Loan', amount: 195000, count: 4 }
  ]
}

// Report type options
export const reportTypes = [
  { value: 'all', label: 'All Reports' },
  { value: 'member', label: 'Members' },
  { value: 'loan', label: 'Loans' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'maturity', label: 'Maturity' }
]

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'completed':
    case 'paid':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Type color mapping
export const getTypeColor = (type: string) => {
  switch (type) {
    case 'member':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'loan':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'income':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'expense':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'maturity':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Currency formatter
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Date formatter
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}