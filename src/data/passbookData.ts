// Mock Passbook Data for Saanify Society Management Platform

export interface PassbookEntry {
  id: string
  memberId: string
  memberName: string
  memberEmail: string
  date: string
  depositAmount: number
  loanInstallment: number
  interestRate: number
  fine: number
  mode: 'Cash' | 'Online' | 'Chequeque'
  balance: number
  addedBy: string
  createdAt: string
  updatedAt: string
}

export interface PassbookStats {
  totalDeposits: number
  totalLoans: number
  totalInterest: number
  totalFine: number
  activeMembers: number
  thisMonthDeposits: number
  thisMonthInterest: number
  topPerformer: string
  paymentModeBreakdown: {
    Cash: number
    Online: number
    Cheque: number
  }
}

// Mock passbook data with realistic society entries
export const passbookData: PassbookEntry[] = [
  {
    id: 'PB001',
    memberId: 'M001',
    memberName: 'Amit Sharma',
    memberEmail: 'amit@saanify.com',
    date: '2024-01-15',
    depositAmount: 50000,
    loanInstallment: 0,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cash',
    balance: 50000,
    addedBy: 'Admin',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'PB002',
    memberId: 'M002',
    memberName: 'Ravi Verma',
    memberEmail: 'ravi@saanify.com',
    date: '2024-01-20',
    depositAmount: 30000,
    loanInstallment: 2000,
    interestRate: 8.5,
    fine: 50,
    mode: 'Online',
    balance: 28000,
    addedBy: 'Treasurer',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'PB003',
    memberId: 'M003',
    memberName: 'Sneha Patel',
    memberEmail: 'sneha@saanify.com',
    date: '2024-02-01',
    depositAmount: 25000,
    loanInstallment: 1500,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cheque',
    balance: 23500,
    addedBy: 'Admin',
    createdAt: '2024-02-01T11:00:00Z',
    updatedAt: '2024-02-01T11:00:00Z'
  },
  {
    id: 'PB004',
    memberId: 'M004',
    memberName: 'Anjali Singh',
    memberEmail: 'anjali@saanify.com',
    date: '2024-02-15',
    depositAmount: 40000,
    loanInstallment: 3000,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cash',
    balance: 37000,
    addedBy: 'Treasurer',
    createdAt: '2024-02-15T16:45:00Z',
    updatedAt: '2024-02-15T16:45:00Z'
  },
  {
    id: 'PB005',
    memberId: 'M005',
    memberName: 'Rajesh Kumar',
    memberEmail: 'rajesh@saanify.com',
    date: '2024-03-01',
    depositAmount: 35000,
    loanInstallment: 2500,
    interestRate: 8.5,
    fine: 0,
    mode: 'Online',
    balance: 32500,
    addedBy: 'Admin',
    createdAt: '2024-03-01T10:15:00Z',
    updatedAt: '2024-03-01T10:15:00Z'
  },
  {
    id: 'PB006',
    memberId: 'M006',
    memberName: 'Priya Nair',
    memberEmail: 'priya@saanify.com',
    date: '2024-03-15',
    depositAmount: 20000,
    loanInstallment: 1500,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cash',
    balance: 18500,
    addedBy: 'Treasurer',
    createdAt: '2024-03-15T14:20:00Z',
    updatedAt: '2024-03-15T14:20:00Z'
  },
  {
    id: 'PB007',
    memberId: 'M007',
    memberName: 'Vikram Malhotra',
    memberEmail: 'vikram@saanify.com',
    date: '2024-04-01',
    depositAmount: 45000,
    loanInstallment: 3500,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cheque',
    balance: 41500,
    addedBy: 'Admin',
    createdAt: '2024-04-01T12:30:00Z',
    updatedAt: '2024-04-01T12:30:00Z'
  },
  {
    id: 'PB008',
    memberId: 'M008',
    memberName: 'Kavita Reddy',
    memberEmail: 'kavita@saanify.com',
    date: '2024-05-01',
    depositAmount: 30000,
    loanInstallment: 2000,
    interestRate: 8.5,
    fine: 0,
    mode: 'Online',
    balance: 28000,
    addedBy: 'Treasurer',
    createdAt: '2024-05-01T09:00:00Z',
    updatedAt: '2024-05-01T09:00:00Z'
  },
  {
    id: 'PB009',
    memberId: 'M009',
    memberName: 'Mohammed Ali',
    memberEmail: 'mohammed@saanify.com',
    date: '2024-06-01',
    depositAmount: 15000,
    loanInstallment: 1000,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cash',
    balance: 14000,
    addedBy: 'Admin',
    createdAt: '2024-06-01T11:00:00Z',
    updatedAt: '2024-06-01T11:00:00Z'
  },
  {
    id: 'PB010',
    memberId: 'M010',
    memberName: 'Deepika Rao',
    memberEmail: 'deepika@saanify.com',
    date: '2024-07-01',
    depositAmount: 25000,
    loanInstallment: 2000,
    interestRate: 8.5,
    fine: 0,
    mode: 'Online',
    balance: 23000,
    addedBy: 'Treasurer',
    createdAt: '2024-07-01T15:00:00Z',
    updatedAt: '2024-07-01T15:00:00Z'
  },
  {
    id: 'PB011',
    memberId: 'M011',
    memberName: 'Sanjay Gupta',
    memberEmail: 'sanjay@saanify.com',
    date: '2024-08-01',
    depositAmount: 20000,
    loanInstallment: 1500,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cash',
    balance: 18500,
    addedBy: 'Admin',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 'PB012',
    memberName: 'Neha Sharma',
    memberEmail: 'neha@saanify.com',
    date: '2024-09-01',
    depositAmount: 18000,
    loanInstallment: 1200,
    interestRate: 8.5,
    fine: 0,
    mode: 'Cash',
    balance: 16800,
    addedBy: 'Admin',
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-09-01T08:00:00Z'
  }
]

// Calculate passbook statistics
export const getPassbookStats = (passbook: Passbook[]): PassbookStats => {
  const totalDeposits = passbook.reduce((sum, entry) => sum + entry.depositAmount, 0)
  const totalLoans = passbook.length
  const totalInterest = passbook.reduce((sum, entry) => sum + (entry.interest || 0), 0)
  const totalFine = passbook.reduce((sum, entry) => sum + (entry.fine || 0), 0)
  const activeMembers = passbook.length
  const thisMonthDeposits = passbook.filter(entry => {
    const entryDate = new Date(entry.date)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
  }).reduce((sum, entry) => sum + entry.depositAmount, 0)
  
  // Calculate top performer
  const memberPerformance = passbook.reduce((acc, entry) => {
    const balance = entry.balance
    const deposits = passbook.filter(e => e.memberId === entry.memberId).reduce((sum, e) => sum + e.depositAmount, 0)
    acc[entry.memberId] = { deposits, balance }
    return acc
  }, {} as Record<string, { deposits: number; balance: number }>)
  
  const topPerformer = Object.entries(memberPerformance)
    .sort(([, { deposits, balance }]) => balance - deposits)
    .slice(0, 1)
  
  const topPerformerName = topPerformer[0]?.memberId ? 
    passbook.find(m => m.id === topPerformer[0]?.memberId)?.name : 'N/A'

  // Calculate payment mode breakdown
  const paymentModeBreakdown = {
    Cash: passbook.filter(entry => entry.mode === 'Cash').length,
    Online: passbook.filter(entry => entry.mode === 'Online').length,
    Cheque: passbook.filter(entry => entry.mode === 'Cheque').length
  }

  return {
    totalDeposits,
    totalLoans,
    totalInterest,
    totalFine,
    activeMembers,
    thisMonthDeposits,
    thisMonthInterest,
    topPerformerName,
    paymentModeBreakdown
  }
}

// Category color mapping
export const getAmountColor = (amount: number, status: string) => {
  if (amount >= 50000) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  } else if (amount >= 30000) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  } else if (amount >= 10000) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
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

// Generate unique passbook entry ID
export const generatePassbookId = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PB${timestamp}${random}`
}

// Validation functions
export const validatePassbookForm = (entry: Partial<PassbookEntry>, isEdit: boolean = false) => {
  const errors: string[] = []

  if (!entry.memberId) {
    errors.push('Member is required')
  }

  if (!entry.date) {
    errors.push('Date is required')
  }

  if (!entry.depositAmount || entry.depositAmount <= 0) {
    errors.push('Deposit amount must be greater than 0')
  }

  if (!entry.loanInstallment || entry.loanInstallment < 0) {
    errors.push('Loan installment must be 0 or greater')
  }

  if (!entry.interestRate || entry.interestRate < 0) {
    errors.push('Interest rate must be 0 or greater')
  }

  if (!entry.fine || entry.fine < 0) {
    errors.push('Fine must be 0 or greater')
  }

  if (!entry.mode) {
    errors.push('Payment mode is required')
  }

  if (!entry.description || entry.description.trim().length < 3) {
    errors.push('Description must be at least 3 characters long')
  }

  return errors
}

// Email validation for uniqueness (mock implementation)
export const isEmailUnique = (email: string, passbook: PassbookEntry[], excludeId?: string) => {
  return !passbook.some(entry => 
    entry.memberEmail.toLowerCase() === email.toLowerCase() && entry.id !== excludeId
  )
}

export default passbookData