# 📁 LOAN SYSTEM COMPLETE FILE & API MAPPING

## 🎯 OVERVIEW
This document provides the complete mapping of all files, APIs, and their relationships in the loan system.

---

## 📂 FILE STRUCTURE MAPPING

### 🎨 FRONTEND COMPONENTS

#### 📱 MEMBER SIDE COMPONENTS
```
src/components/loan/
├── LoanRequestForm.tsx              # Main loan request form
├── MemberLoanStatus.tsx             # Member's loan status display
├── LoanPayment.tsx                  # EMI payment interface
└── LoanHistory.tsx                  # Loan payment history
```

#### 👨‍💼 ADMIN SIDE COMPONENTS
```
src/components/loan/
├── LoanRequests.tsx                 # Pending loan requests list
├── LoanRequestCard.tsx              # Individual loan request card
├── EnhancedLoanApproval.tsx        # Enhanced approval modal
├── SimplifiedAllLoans.tsx           # Active loans table
├── LoanActions.tsx                  # Loan action buttons
└── LoanStatistics.tsx               # Loan statistics dashboard
```

#### 🎛️ SHARED COMPONENTS
```
src/components/loan/
├── LoanCard.tsx                     # Generic loan card
├── LoanStatusBadge.tsx              # Status display badge
├── LoanCalculator.tsx               # EMI calculator
└── LoanFilters.tsx                  # Filter controls
```

### 🌐 API ROUTES

#### 📤 MEMBER SIDE APIS
```
src/app/api/loans/
├── route.ts                         # POST - Create loan request
└── [id]/
    └── route.ts                     # GET - Get loan details

src/app/api/member/
└── loan-status/
    └── route.ts                     # GET - Get member's loan status

src/app/api/loan-payment/
└── route.ts                         # POST - Process EMI payment
```

#### 📡 ADMIN SIDE APIS
```
src/app/api/client/loan-requests/
├── pending/
│   └── route.ts                     # GET - Get pending requests
├── approve/
│   └── route.ts                     # POST - Approve loan
└── reject/
    └── route.ts                     # POST - Reject loan

src/app/api/client/loans/
├── route.ts                         # GET - Get all loans
├── [id]/
│   └── route.ts                     # GET - Get loan details
└── close/
    └── route.ts                     # POST - Close loan

src/app/api/client/notifications/
└── send/
    └── route.ts                     # POST - Send notifications
```

### 🗄️ DATABASE RELATED FILES

#### 📊 PRISMA SCHEMA
```
prisma/
└── schema.prisma                    # Database schema definition
```

#### 🔧 DATABASE UTILITIES
```
src/lib/
├── db.ts                           # Database connection
├── loan-utils.ts                   # Loan calculation utilities
├── validation.ts                   # Validation utilities
└── notifications.ts                # Notification utilities
```

---

## 🔗 COMPLETE API CHAIN MAPPING

### 1️⃣ LOAN REQUEST CREATION CHAIN

```
MEMBER INTERACTION
└── LoanRequestForm.tsx
    ├── onSubmit()
    ├── Validates form data
    ├── Calls API
    └── Handles response

API ENDPOINT
└── POST /api/loans/route.ts
    ├── Validate request
    ├── Check member eligibility
    ├── Calculate loan terms
    ├── Create loan record
    ├── Create passbook entry
    └── Return response

DATABASE OPERATIONS
├── Loan Table
│   ├── INSERT new record
│   ├── Set status = 'PENDING'
│   └── Store all loan parameters
├── PassbookEntry Table
│   ├── INSERT request entry
│   └── Log loan request
└── Notification Table
    └── INSERT notification (optional)
```

### 2️⃣ LOAN APPROVAL CHAIN

```
ADMIN INTERACTION
└── EnhancedLoanApproval.tsx
    ├── Calculate 80% limit
    ├── Validate override
    ├── Submit approval
    └── Handle response

API ENDPOINT
└── POST /api/client/loan-requests/approve/route.ts
    ├── Validate approval authority
    ├── Check 80% limit
    ├── Process override if needed
    ├── Update loan status
    ├── Calculate EMI
    ├── Create passbook entry
    ├── Send notification
    └── Return response

DATABASE OPERATIONS
├── Loan Table
│   ├── UPDATE status = 'APPROVED'
│   ├── SET approval dates
│   ├── SET EMI details
│   └── SET calculated amounts
├── PassbookEntry Table
│   ├── INSERT approval entry
│   └── Log approval transaction
└── Notification Table
    ├── INSERT approval notification
    └── Set member notification
```

### 3️⃣ LOAN REJECTION CHAIN

```
ADMIN INTERACTION
└── LoanRequestCard.tsx
    ├── Get rejection reason
    ├── Submit rejection
    └── Handle response

API ENDPOINT
└── POST /api/client/loan-requests/reject/route.ts
    ├── Validate rejection authority
    ├── Update loan status
    ├── Create passbook entry
    ├── Send notification
    └── Return response

DATABASE OPERATIONS
├── Loan Table
│   ├── UPDATE status = 'REJECTED'
│   ├── SET rejection reason
│   └── SET rejection date
├── PassbookEntry Table
│   ├── INSERT rejection entry
│   └── Log rejection transaction
└── Notification Table
    ├── INSERT rejection notification
    └── Set member notification
```

### 4️⃣ EMI PAYMENT CHAIN

```
MEMBER INTERACTION
└── LoanPayment.tsx
    ├── Get payment details
    ├── Process payment
    └── Handle response

API ENDPOINT
└── POST /api/loan-payment/route.ts
    ├── Validate payment amount
    ├── Check loan status
    ├── Process payment
    ├── Update loan balance
    ├── Create passbook entry
    ├── Update next EMI date
    └── Return response

DATABASE OPERATIONS
├── LoanPayment Table
│   ├── INSERT payment record
│   ├── SET payment details
│   └── Log transaction
├── Loan Table
│   ├── UPDATE paidAmount
│   ├── UPDATE remainingBalance
│   ├── UPDATE lastPaymentDate
│   └── UPDATE nextEmiDate
├── PassbookEntry Table
│   ├── INSERT payment entry
│   └── Log EMI transaction
└── Notification Table
    └── INSERT payment confirmation
```

### 5️⃣ LOAN CLOSURE CHAIN

```
ADMIN INTERACTION
└── LoanActions.tsx
    ├── Get closure reason
    ├── Submit closure
    └── Handle response

API ENDPOINT
└── POST /api/client/loans/close/route.ts
    ├── Validate closure authority
    ├── Check loan status
    ├── Process closure
    ├── Update loan status
    ├── Create passbook entry
    ├── Send notification
    └── Return response

DATABASE OPERATIONS
├── Loan Table
│   ├── UPDATE status = 'CLOSED'
│   ├── SET closure details
│   ├── SET remainingBalance = 0
│   └── SET closedAt date
├── PassbookEntry Table
│   ├── INSERT closure entry
│   └── Log closure transaction
└── Notification Table
    ├── INSERT closure notification
    └── Set member notification
```

---

## 📊 DATA MODELS MAPPING

### 🏦 LOAN MODEL
```typescript
interface Loan {
  id: string                    // Primary key
  memberId: string              // Foreign key to Member
  amount: number                // Principal amount
  description: string           // Loan purpose
  duration: number              // Loan duration in months
  interestRate: number          // Annual interest rate
  status: LoanStatus            // PENDING | APPROVED | REJECTED | ACTIVE | CLOSED
  startDate?: Date              // Loan start date
  endDate?: Date                // Loan end date
  approvedAt?: Date             // Approval date
  approvedBy?: string           // Approver ID
  rejectedAt?: Date             // Rejection date
  rejectedBy?: string           // Rejector ID
  rejectionReason?: string      // Rejection reason
  emiAmount?: number            // Monthly EMI amount
  totalInterest?: number        // Total interest amount
  totalPayable?: number         // Total payable amount
  paidAmount?: number           // Amount paid so far
  remainingBalance?: number     // Remaining balance
  lastPaymentDate?: Date        // Last payment date
  nextEmiDate?: Date            // Next EMI due date
  closedAt?: Date               // Closure date
  closedBy?: string             // Closer ID
  closeReason?: string          // Closure reason
  createdAt: Date               // Creation date
  updatedAt: Date               // Last update date
}
```

### 📖 PASSBOOK ENTRY MODEL
```typescript
interface PassbookEntry {
  id: string                    // Primary key
  memberId: string              // Foreign key to Member
  type: EntryType               // DEPOSIT | WITHDRAWAL | LOAN_APPROVED | LOAN_REJECTED | EMI_PAYMENT | LOAN_CLOSED
  amount: number                // Transaction amount
  description: string           // Transaction description
  referenceId?: string          // Reference to loan/transaction
  balance?: number              // Balance after transaction
  createdAt: Date               // Transaction date
  updatedAt: Date               // Last update date
}
```

### 💳 LOAN PAYMENT MODEL
```typescript
interface LoanPayment {
  id: string                    // Primary key
  loanId: string               // Foreign key to Loan
  memberId: string              // Foreign key to Member
  amount: number                // Payment amount
  paymentMethod: string         // Payment method
  paymentDate: Date             // Payment date
  referenceId?: string          // Transaction reference
  createdAt: Date               // Creation date
  updatedAt: Date               // Last update date
}
```

---

## 🔄 REQUEST/RESPONSE FORMATS

### 📤 LOAN REQUEST FORMAT
```typescript
// POST /api/loans
{
  memberId: string,
  amount: number,
  description: string,
  duration: number,
  interestRate: number
}

// Response
{
  success: boolean,
  message: string,
  data?: {
    id: string,
    status: string,
    reference: string
  },
  error?: string
}
```

### ✅ LOAN APPROVAL FORMAT
```typescript
// POST /api/client/loan-requests/approve
{
  loanId: string,
  memberId: string,
  amount: number,
  duration: number,
  interestRate: number,
  description: string,
  overrideLimit: boolean,
  approverId: string,
  approverName: string
}

// Response
{
  success: boolean,
  message: string,
  data?: {
    loanId: string,
    status: string,
    emiAmount: number,
    totalInterest: number,
    totalPayable: number,
    startDate: string,
    endDate: string
  },
  error?: string
}
```

### ❌ LOAN REJECTION FORMAT
```typescript
// POST /api/client/loan-requests/reject
{
  loanId: string,
  memberId: string,
  reason: string,
  rejectedBy: string
}

// Response
{
  success: boolean,
  message: string,
  data?: {
    loanId: string,
    status: string
  },
  error?: string
}
```

### 💳 EMI PAYMENT FORMAT
```typescript
// POST /api/loan-payment
{
  loanId: string,
  memberId: string,
  amount: number,
  paymentMethod: string,
  referenceId?: string
}

// Response
{
  success: boolean,
  message: string,
  data?: {
    paymentId: string,
    loanId: string,
    amount: number,
    remainingBalance: number,
    nextEmiDate: string
  },
  error?: string
}
```

---

## 🚨 ERROR HANDLING MAPPING

### 📋 ERROR CODES
```typescript
enum LoanErrorCodes {
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INSUFFICIENT_DEPOSIT = 'INSUFFICIENT_DEPOSIT',
  EXCEEDS_80_PERCENT_LIMIT = 'EXCEEDS_80_PERCENT_LIMIT',
  LOAN_NOT_FOUND = 'LOAN_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  CALCULATION_ERROR = 'CALCULATION_ERROR'
}
```

### 🔄 ERROR RESPONSE FORMAT
```typescript
{
  success: false,
  error: string,
  code: LoanErrorCodes,
  details?: any,
  timestamp: string
}
```

---

## 📈 PERFORMANCE CONSIDERATIONS

### 🚀 OPTIMIZATION POINTS
1. **Database Indexing**
   - Loan status index
   - Member ID index
   - Date range indexes

2. **API Response Caching**
   - Member deposit calculations
   - Pending loan requests
   - Active loan lists

3. **Batch Operations**
   - Multiple passbook entries
   - Bulk notifications
   - Batch loan updates

### 🔄 MONITORING POINTS
1. **API Response Times**
   - Loan creation time
   - Approval processing time
   - Payment processing time

2. **Database Performance**
   - Query execution times
   - Index usage
   - Connection pool usage

---

*File Mapping Version: v1.0*
*Last Updated: $(date)*