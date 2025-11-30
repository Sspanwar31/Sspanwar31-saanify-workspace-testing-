// Future-Proof Loans Data for Saanify Society Management Platform
// Ready for Database Integration with UUID member linking
// ENHANCED: Added deposit references and validation

export interface Loan {
  id: string // UUID for future DB integration
  memberId: string // Links to members.id (UUID)
  amount: number
  interest: number // Annual interest rate in %
  duration: number // Duration in months
  emi: number // Calculated EMI amount
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected'
  remaining_balance: number
  start_date: string // yyyy-mm-dd format
  end_date: string // yyyy-mm-dd format
  next_emi_date: string // yyyy-mm-dd format
  description?: string
  approved_by?: string
  approved_date?: string
  created_at: string
  updated_at: string
  deposit_reference?: string // Reference to passbook deposit entry
  member_deposit_amount: number // Total deposit amount for 80% calculation
}

// Enhanced loans data with deposit references and validation
export const loansData: Loan[] = [
  {
    id: 'loan-uuid-001',
    memberId: 'uuid-001',
    amount: 40000,
    interest: 12,
    duration: 12,
    emi: 3553.95,
    status: 'active',
    remaining_balance: 35540,
    start_date: '2024-01-15',
    end_date: '2025-01-15',
    next_emi_date: '2024-12-15',
    description: 'Personal loan for home renovation',
    approved_by: 'admin-001',
    approved_date: '2024-01-14',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-11-15T14:30:00Z',
    deposit_reference: 'pb-uuid-001',
    member_deposit_amount: 50000
  },
  {
    id: 'loan-uuid-002',
    memberId: 'uuid-002',
    amount: 60000,
    interest: 10,
    duration: 18,
    emi: 3603.42,
    status: 'active',
    remaining_balance: 47255,
    start_date: '2024-03-01',
    end_date: '2025-08-01',
    next_emi_date: '2024-12-01',
    description: 'Business expansion loan',
    approved_by: 'admin-001',
    approved_date: '2024-02-28',
    created_at: '2024-02-20T09:30:00Z',
    updated_at: '2024-11-01T16:45:00Z',
    deposit_reference: 'pb-uuid-004',
    member_deposit_amount: 75000
  },
  {
    id: 'loan-uuid-003',
    memberId: 'uuid-003',
    amount: 25000,
    interest: 15,
    duration: 6,
    emi: 4350.85,
    status: 'completed',
    remaining_balance: 0,
    start_date: '2024-01-15',
    end_date: '2024-07-15',
    next_emi_date: '',
    description: 'Emergency medical loan',
    approved_by: 'admin-001',
    approved_date: '2024-01-14',
    created_at: '2024-01-10T16:45:00Z',
    updated_at: '2024-07-15T10:20:00Z',
    deposit_reference: 'pb-uuid-006',
    member_deposit_amount: 30000
  },
  {
    id: 'loan-uuid-004',
    memberId: 'uuid-005',
    amount: 80000,
    interest: 8,
    duration: 24,
    emi: 3618.18,
    status: 'pending',
    remaining_balance: 86880,
    start_date: '2025-11-30',
    end_date: '2027-11-30',
    next_emi_date: '2025-12-30',
    description: 'Education loan for higher studies',
    approved_by: '',
    approved_date: '',
    created_at: '2024-11-20T13:15:00Z',
    updated_at: '2024-11-20T13:15:00Z',
    deposit_reference: 'pb-deposit-uuid-005',
    member_deposit_amount: 100000
  },
  {
    id: 'loan-uuid-005',
    memberId: 'uuid-006',
    amount: 35000,
    interest: 11,
    duration: 12,
    emi: 3093.36,
    status: 'active',
    remaining_balance: 18500,
    start_date: '2024-06-01',
    end_date: '2025-06-01',
    next_emi_date: '2024-12-01',
    description: 'Home appliance loan',
    approved_by: 'admin-001',
    approved_date: '2024-05-30',
    created_at: '2024-05-25T15:30:00Z',
    updated_at: '2024-11-01T09:15:00Z',
    deposit_reference: 'pb-deposit-uuid-006',
    member_deposit_amount: 43750
  },
  {
    id: 'loan-uuid-006',
    memberId: 'uuid-007',
    amount: 50000,
    interest: 9,
    duration: 15,
    emi: 3536.82,
    status: 'active',
    remaining_balance: 28437,
    start_date: '2024-04-10',
    end_date: '2025-07-10',
    next_emi_date: '2024-12-10',
    description: 'Agricultural loan',
    approved_by: 'admin-001',
    approved_date: '2024-04-08',
    created_at: '2024-04-05T11:20:00Z',
    updated_at: '2024-11-10T14:00:00Z',
    deposit_reference: 'pb-deposit-uuid-007',
    member_deposit_amount: 62500
  }
]

export default loansData