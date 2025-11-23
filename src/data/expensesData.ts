// Mock Expenses Data for Saanify Society Management Platform

export interface Expense {
  id: string
  date: string
  category: 'Maintenance' | 'Repair' | 'Event' | 'Salary' | 'Utilities' | 'Other'
  amount: number
  mode: 'Cash' | 'Online' | 'Cheque'
  description: string
  addedBy: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseStats {
  totalExpenses: number
  thisMonthExpenses: number
  topCategory: string
  categoryBreakdown: {
    category: string
    amount: number
    count: number
  }[]
  monthlyTrend: {
    month: string
    amount: number
  }[]
}

// Mock expenses data with realistic society expenses
export const expensesData: Expense[] = [
  {
    id: 'E001',
    date: '2024-09-10',
    category: 'Maintenance',
    amount: 2500,
    mode: 'Online',
    description: 'Building maintenance and repairs',
    addedBy: 'Admin',
    createdAt: '2024-09-10T09:00:00Z',
    updatedAt: '2024-09-10T09:00:00Z'
  },
  {
    id: 'E002',
    date: '2024-09-15',
    category: 'Repair',
    amount: 1800,
    mode: 'Cash',
    description: 'Water pump repair and replacement',
    addedBy: 'Treasurer',
    createdAt: '2024-09-15T14:30:00Z',
    updatedAt: '2024-09-15T14:30:00Z'
  },
  {
    id: 'E003',
    date: '2024-09-20',
    category: 'Event',
    amount: 3500,
    mode: 'Online',
    description: 'Ganesh Chaturthi festival celebration',
    addedBy: 'Admin',
    createdAt: '2024-09-20T11:00:00Z',
    updatedAt: '2024-09-20T11:00:00Z'
  },
  {
    id: 'E004',
    date: '2024-09-25',
    category: 'Utilities',
    amount: 4200,
    mode: 'Online',
    description: 'Monthly electricity bill',
    addedBy: 'Treasurer',
    createdAt: '2024-09-25T16:45:00Z',
    updatedAt: '2024-09-25T16:45:00Z'
  },
  {
    id: 'E005',
    date: '2024-10-01',
    category: 'Salary',
    amount: 15000,
    mode: 'Cheque',
    description: 'Staff salary for September',
    addedBy: 'Admin',
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z'
  },
  {
    id: 'E006',
    date: '2024-10-05',
    category: 'Maintenance',
    amount: 3200,
    mode: 'Cash',
    description: 'Lift maintenance and AMC',
    addedBy: 'Treasurer',
    createdAt: '2024-10-05T13:20:00Z',
    updatedAt: '2024-10-05T13:20:00Z'
  },
  {
    id: 'E007',
    date: '2024-10-10',
    category: 'Other',
    amount: 1200,
    mode: 'Online',
    description: 'Office supplies and stationery',
    addedBy: 'Admin',
    createdAt: '2024-10-10T09:15:00Z',
    updatedAt: '2024-10-10T09:15:00Z'
  },
  {
    id: 'E008',
    date: '2024-10-15',
    category: 'Utilities',
    amount: 2800,
    mode: 'Online',
    description: 'Water bill and sewage charges',
    addedBy: 'Treasurer',
    createdAt: '2024-10-15T15:30:00Z',
    updatedAt: '2024-10-15T15:30:00Z'
  },
  {
    id: 'E009',
    date: '2024-10-20',
    category: 'Repair',
    amount: 4500,
    mode: 'Cash',
    description: 'Generator repair and servicing',
    addedBy: 'Admin',
    createdAt: '2024-10-20T11:45:00Z',
    updatedAt: '2024-10-20T11:45:00Z'
  },
  {
    id: 'E010',
    date: '2024-10-25',
    category: 'Event',
    amount: 2800,
    mode: 'Online',
    description: 'Diwali celebration and sweets distribution',
    addedBy: 'Treasurer',
    createdAt: '2024-10-25T14:00:00Z',
    updatedAt: '2024-10-25T14:00:00Z'
  },
  {
    id: 'E011',
    date: '2024-11-01',
    category: 'Maintenance',
    amount: 3800,
    mode: 'Online',
    description: 'Society compound cleaning and pest control',
    addedBy: 'Admin',
    createdAt: '2024-11-01T10:30:00Z',
    updatedAt: '2024-11-01T10:30:00Z'
  },
  {
    id: 'E012',
    date: '2024-11-05',
    category: 'Utilities',
    amount: 3500,
    mode: 'Online',
    description: 'Monthly internet and cable charges',
    addedBy: 'Treasurer',
    createdAt: '2024-11-05T16:20:00Z',
    updatedAt: '2024-11-05T16:20:00Z'
  }
]

// Calculate expense statistics
export const getExpenseStats = (expenses: Expense[]): ExpenseStats => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Calculate this month's expenses
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + expense.amount, 0)
  
  // Calculate category breakdown
  const categoryMap = new Map<string, { amount: number; count: number }>()
  expenses.forEach(expense => {
    const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 }
    categoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1
    })
  })
  
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount)
  
  const topCategory = categoryBreakdown[0]?.category || 'N/A'
  
  // Calculate monthly trend (last 6 months)
  const monthlyTrend = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    const monthExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === monthDate.getMonth() && 
               expenseDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    monthlyTrend.push({
      month: monthName,
      amount: monthExpenses
    })
  }
  
  return {
    totalExpenses,
    thisMonthExpenses,
    topCategory,
    categoryBreakdown,
    monthlyTrend
  }
}

// Category color mapping
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Maintenance':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'Repair':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'Event':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'Salary':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'Utilities':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
    case 'Other':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Category icon mapping
export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Maintenance':
      return '🔧'
    case 'Repair':
      return '🔨'
    case 'Event':
      return '🎉'
    case 'Salary':
      return '💰'
    case 'Utilities':
      return '⚡'
    case 'Other':
      return '📋'
    default:
      return '📋'
  }
}

// Payment mode color mapping
export const getPaymentModeColor = (mode: string) => {
  switch (mode) {
    case 'Cash':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'Online':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'Cheque':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Generate unique expense ID
export const generateExpenseId = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `E${timestamp}${random}`
}

// Validation functions
export const validateExpenseForm = (expense: Partial<Expense>, isEdit: boolean = false) => {
  const errors: string[] = []

  if (!expense.date) {
    errors.push('Date is required')
  }

  if (!expense.category) {
    errors.push('Category is required')
  }

  if (!expense.amount || expense.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }

  if (!expense.mode) {
    errors.push('Payment mode is required')
  }

  if (!expense.description || expense.description.trim().length < 3) {
    errors.push('Description must be at least 3 characters long')
  }

  return errors
}

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format currency for display
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default expensesData