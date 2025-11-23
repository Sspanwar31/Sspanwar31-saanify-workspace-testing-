// Mock Loans Data for Saanify Society Management Platform

export interface Loan {
  id: string
  member: string
  memberId: string
  loanAmount: number
  interestRate: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'CLOSED' | 'REJECTED'
  description?: string
  createdAt: string
  updatedAt: string
}

export interface LoanStats {
  totalLoans: number
  activeLoans: number
  pendingApprovals: number
  closedLoans: number
  totalAmount: number
}

export interface Member {
  id: string
  name: string
  email: string
  phone: string
}

// Mock members data for dropdown
export const membersData: Member[] = [
  { id: 'M001', name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '+91 98765 43210' },
  { id: 'M002', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 98765 43211' },
  { id: 'M003', name: 'Amit Patel', email: 'amit.patel@email.com', phone: '+91 98765 43212' },
  { id: 'M004', name: 'Sunita Reddy', email: 'sunita.reddy@email.com', phone: '+91 98765 43213' },
  { id: 'M005', name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 98765 43214' },
  { id: 'M006', name: 'Anjali Gupta', email: 'anjali.gupta@email.com', phone: '+91 98765 43215' },
  { id: 'M007', name: 'Mahesh Kumar', email: 'mahesh.kumar@email.com', phone: '+91 98765 43216' },
  { id: 'M008', name: 'Kavita Devi', email: 'kavita.devi@email.com', phone: '+91 98765 43217' },
]

// Mock loans data
export const loansData: Loan[] = [
  {
    id: 'L001',
    member: 'Rajesh Kumar',
    memberId: 'M001',
    loanAmount: 50000,
    interestRate: 12,
    totalInstallments: 12,
    paidInstallments: 3,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'APPROVED',
    description: 'Personal loan for home renovation',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: 'L002',
    member: 'Jane Smith',
    memberId: 'M002',
    loanAmount: 80000,
    interestRate: 10,
    totalInstallments: 24,
    paidInstallments: 10,
    startDate: '2024-03-01',
    endDate: '2026-02-28',
    status: 'APPROVED',
    description: 'Business expansion loan',
    createdAt: '2024-02-15T09:30:00Z',
    updatedAt: '2024-03-01T11:00:00Z'
  },
  {
    id: 'L003',
    member: 'Amit Patel',
    memberId: 'M003',
    loanAmount: 30000,
    interestRate: 15,
    totalInstallments: 6,
    paidInstallments: 6,
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    status: 'CLOSED',
    description: 'Emergency medical loan',
    createdAt: '2024-01-10T16:45:00Z',
    updatedAt: '2024-07-15T10:20:00Z'
  },
  {
    id: 'L004',
    member: 'Sunita Reddy',
    memberId: 'M004',
    loanAmount: 120000,
    interestRate: 8,
    totalInstallments: 36,
    paidInstallments: 0,
    startDate: '2024-04-01',
    endDate: '2027-03-31',
    status: 'PENDING',
    description: 'Education loan for higher studies',
    createdAt: '2024-03-20T13:15:00Z',
    updatedAt: '2024-03-20T13:15:00Z'
  },
  {
    id: 'L005',
    member: 'Vikram Singh',
    memberId: 'M005',
    loanAmount: 60000,
    interestRate: 11,
    totalInstallments: 18,
    paidInstallments: 8,
    startDate: '2024-02-01',
    endDate: '2025-07-31',
    status: 'APPROVED',
    description: 'Vehicle loan',
    createdAt: '2024-01-25T12:00:00Z',
    updatedAt: '2024-02-01T09:30:00Z'
  },
  {
    id: 'L006',
    member: 'Anjali Gupta',
    memberId: 'M006',
    loanAmount: 45000,
    interestRate: 13,
    totalInstallments: 12,
    paidInstallments: 2,
    startDate: '2024-03-15',
    endDate: '2025-02-28',
    status: 'APPROVED',
    description: 'Home appliance loan',
    createdAt: '2024-03-10T15:30:00Z',
    updatedAt: '2024-03-15T10:45:00Z'
  },
  {
    id: 'L007',
    member: 'Mahesh Kumar',
    memberId: 'M007',
    loanAmount: 90000,
    interestRate: 9,
    totalInstallments: 30,
    paidInstallments: 5,
    startDate: '2024-01-10',
    endDate: '2026-06-30',
    status: 'APPROVED',
    description: 'Agricultural loan',
    createdAt: '2024-01-05T11:20:00Z',
    updatedAt: '2024-01-10T14:00:00Z'
  },
  {
    id: 'L008',
    member: 'Kavita Devi',
    memberId: 'M008',
    loanAmount: 25000,
    interestRate: 14,
    totalInstallments: 9,
    paidInstallments: 0,
    startDate: '2024-04-15',
    endDate: '2025-01-15',
    status: 'REJECTED',
    description: 'Personal loan request',
    createdAt: '2024-04-10T16:00:00Z',
    updatedAt: '2024-04-12T09:15:00Z'
  }
]

// Calculate loan statistics
export const getLoanStats = (loans: Loan[]): LoanStats => {
  const totalLoans = loans.length
  const activeLoans = loans.filter(loan => loan.status === 'APPROVED').length
  const pendingApprovals = loans.filter(loan => loan.status === 'PENDING').length
  const closedLoans = loans.filter(loan => loan.status === 'CLOSED').length
  const totalAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0)

  return {
    totalLoans,
    activeLoans,
    pendingApprovals,
    closedLoans,
    totalAmount
  }
}

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
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

// Generate unique loan ID
export const generateLoanId = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `L${timestamp}${random}`
}

// Validation functions
export const validateLoanForm = (loan: Partial<Loan>) => {
  const errors: string[] = []

  if (!loan.memberId) errors.push('Member is required')
  if (!loan.loanAmount || loan.loanAmount <= 0) errors.push('Loan amount must be greater than 0')
  if (!loan.interestRate || loan.interestRate < 0) errors.push('Interest rate must be 0 or greater')
  if (!loan.totalInstallments || loan.totalInstallments <= 0) errors.push('Total installments must be greater than 0')
  if (loan.paidInstallments !== undefined && loan.paidInstallments < 0) errors.push('Paid installments cannot be negative')
  if (!loan.startDate) errors.push('Start date is required')
  if (!loan.endDate) errors.push('End date is required')
  
  if (loan.startDate && loan.endDate) {
    const start = new Date(loan.startDate)
    const end = new Date(loan.endDate)
    if (start >= end) errors.push('End date must be after start date')
  }

  if (loan.paidInstallments !== undefined && loan.totalInstallments && loan.paidInstallments > loan.totalInstallments) {
    errors.push('Paid installments cannot exceed total installments')
  }

  return errors
}

export default loansData