// Future-Proof Passbook Data for Saanify Society Management Platform
// Auto transaction logic with credit/debit tracking
// ENHANCED: Added missing deposits for all active members

export interface PassbookEntry {
  id: string // UUID for future DB integration
  memberId: string // Links to members.id (UUID)
  type: 'credit' | 'debit'
  amount: number
  date: string // yyyy-mm-dd format
  reference: 'deposit' | 'loan_disbursement' | 'emi_payment' | 'fine' | 'interest' | 'manual'
  description: string
  balance: number // Running balance after this transaction
  loan_id?: string // Reference to loan if applicable
  emi_number?: number // EMI number if this is an EMI payment
  fine_amount?: number // Fine amount if applicable
  interest_amount?: number // Interest amount if applicable
  payment_mode: 'cash' | 'online' | 'cheque' | 'bank_transfer'
  added_by: string // User ID who added this entry
  created_at: string
  updated_at: string
}

// Enhanced passbook data with missing deposits added
export const passbookData: PassbookEntry[] = [
  {
    id: 'pb-uuid-001',
    memberId: 'uuid-001', // Rajesh Kumar
    type: 'credit',
    amount: 50000,
    date: '2024-01-15',
    reference: 'deposit',
    description: 'Initial deposit amount',
    balance: 50000,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: 'pb-uuid-002',
    memberId: 'uuid-001', // Rajesh Kumar
    type: 'credit',
    amount: 40000,
    date: '2024-01-16',
    reference: 'loan_disbursement',
    description: 'Loan disbursement for loan loan-uuid-001',
    balance: 90000,
    loan_id: 'loan-uuid-001',
    payment_mode: 'bank_transfer',
    added_by: 'admin-001',
    created_at: '2024-01-16T10:30:00Z',
    updated_at: '2024-01-16T10:30:00Z'
  },
  {
    id: 'pb-uuid-003',
    memberId: 'uuid-001', // Rajesh Kumar
    type: 'debit',
    amount: 3554,
    date: '2024-02-15',
    reference: 'emi_payment',
    description: 'EMI payment #1 for loan loan-uuid-001',
    balance: 86446,
    loan_id: 'loan-uuid-001',
    emi_number: 1,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-02-15T14:20:00Z',
    updated_at: '2024-02-15T14:20:00Z'
  },
  {
    id: 'pb-uuid-004',
    memberId: 'uuid-002', // Priya Sharma
    type: 'credit',
    amount: 75000,
    date: '2024-02-01',
    reference: 'deposit',
    description: 'Society deposit amount',
    balance: 75000,
    payment_mode: 'online',
    added_by: 'admin-001',
    created_at: '2024-02-01T11:00:00Z',
    updated_at: '2024-02-01T11:00:00Z'
  },
  {
    id: 'pb-uuid-005',
    memberId: 'uuid-002', // Priya Sharma
    type: 'credit',
    amount: 60000,
    date: '2024-03-02',
    reference: 'loan_disbursement',
    description: 'Loan disbursement for loan loan-uuid-002',
    balance: 135000,
    loan_id: 'loan-uuid-002',
    payment_mode: 'bank_transfer',
    added_by: 'admin-001',
    created_at: '2024-03-02T09:15:00Z',
    updated_at: '2024-03-02T09:15:00Z'
  },
  {
    id: 'pb-uuid-006',
    memberId: 'uuid-003', // Amit Patel
    type: 'credit',
    amount: 30000,
    date: '2024-01-10',
    reference: 'deposit',
    description: 'Initial deposit for membership',
    balance: 30000,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'pb-uuid-007',
    memberId: 'uuid-003', // Amit Patel
    type: 'debit',
    amount: 50,
    date: '2024-02-20',
    reference: 'fine',
    description: 'Late payment fine for EMI',
    balance: 29950,
    loan_id: 'loan-uuid-003',
    fine_amount: 50,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-02-20T16:45:00Z',
    updated_at: '2024-02-20T16:45:00Z'
  },
  {
    id: 'pb-uuid-008',
    memberId: 'uuid-001', // Rajesh Kumar
    type: 'credit',
    amount: 425,
    date: '2024-11-01',
    reference: 'interest',
    description: 'Monthly interest on deposits',
    balance: 86871,
    interest_amount: 425,
    payment_mode: 'bank_transfer',
    added_by: 'system-001',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z'
  },
  // NEW: Missing deposits for active members (with correct amounts from our analysis)
  {
    id: 'pb-deposit-uuid-005',
    memberId: 'uuid-005', // Vikram Singh
    type: 'credit',
    amount: 100000,
    date: '2024-02-15',
    reference: 'deposit',
    description: 'Initial deposit for Vikram Singh',
    balance: 100000,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2025-11-30T17:57:32Z'
  },
  {
    id: 'pb-deposit-uuid-006',
    memberId: 'uuid-006', // Anjali Gupta
    type: 'credit',
    amount: 43750,
    date: '2024-04-05',
    reference: 'deposit',
    description: 'Initial deposit for Anjali Gupta',
    balance: 43750,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-04-05T10:00:00Z',
    updated_at: '2025-11-30T17:57:32Z'
  },
  {
    id: 'pb-deposit-uuid-007',
    memberId: 'uuid-007', // Mahesh Kumar
    type: 'credit',
    amount: 62500,
    date: '2024-03-25',
    reference: 'deposit',
    description: 'Initial deposit for Mahesh Kumar',
    balance: 62500,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-03-25T10:00:00Z',
    updated_at: '2025-11-30T17:57:32Z'
  },
  {
    id: 'pb-deposit-uuid-008',
    memberId: 'uuid-008', // Kavita Devi
    type: 'credit',
    amount: 50000,
    date: '2024-05-12',
    reference: 'deposit',
    description: 'Initial deposit for Kavita Devi',
    balance: 50000,
    payment_mode: 'cash',
    added_by: 'admin-001',
    created_at: '2024-05-12T10:00:00Z',
    updated_at: '2025-11-30T17:57:32Z'
  }
]

export default passbookData