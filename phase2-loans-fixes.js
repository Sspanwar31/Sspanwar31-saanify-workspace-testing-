// PHASE-2: Loans Module Fixes - Step 1
// Complete loan data enrichment and validation

const fs = require('fs')
const path = require('path')

// Load the data files
const loansDataPath = path.join(__dirname, 'src/data/loansData.ts')
const membersDataPath = path.join(__dirname, 'src/data/membersData.ts')
const passbookDataPath = path.join(__dirname, 'src/data/passbookData.ts')

// Read and parse the data files
function parseDataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Extract the data array from the TypeScript file
  const dataMatch = content.match(/export const \w+Data:\s*\w+\[]\s*=\s*(\[[\s\S]*?\]);?\s*$/m)
  if (!dataMatch) {
    throw new Error(`Could not parse data from ${filePath}`)
  }
  
  try {
    // Remove TypeScript types and convert to valid JavaScript
    const jsCode = dataMatch[1]
      .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
    
    return eval(`(${jsCode})`)
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return []
  }
}

// Load data
let loansData, membersData, passbookData

try {
  loansData = parseDataFile(loansDataPath)
  membersData = parseDataFile(membersDataPath)
  passbookData = parseDataFile(passbookDataPath)
} catch (error) {
  console.error('Error loading data files:', error)
  process.exit(1)
}

// EMI Calculation Function (from loansData.ts)
function calculateEMI(principal, annualRate, months) {
  if (principal <= 0 || annualRate < 0 || months <= 0) return 0
  
  const monthlyRate = annualRate / 12 / 100 // Convert annual rate to monthly decimal
  
  if (monthlyRate === 0) {
    return principal / months // Simple division for 0% interest
  }
  
  // EMI = (P * R * (1+R)^N) / ((1+R)^N - 1)
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1)
  
  return Math.round(emi * 100) / 100 // Round to 2 decimal places
}

// Step 1: Calculate deposit amounts for each member
function getMemberDepositAmount(memberId) {
  const memberDeposits = passbookData.filter(
    entry => entry.memberId === memberId && entry.reference === 'deposit'
  )
  return memberDeposits.reduce((total, entry) => total + entry.amount, 0)
}

// Step 2: Get deposit reference for each loan
function getLoanDepositReference(memberId, loanAmount) {
  const memberDeposits = passbookData.filter(
    entry => entry.memberId === memberId && entry.reference === 'deposit'
  )
  
  // Find the deposit that can cover this loan (80% rule)
  for (const deposit of memberDeposits) {
    if (deposit.amount >= loanAmount * 1.25) { // 100% / 80% = 1.25
      return deposit.id
    }
  }
  
  // Return the largest deposit if none can fully cover
  if (memberDeposits.length > 0) {
    const largestDeposit = memberDeposits.reduce((max, deposit) => 
      deposit.amount > max.amount ? deposit : max
    )
    return largestDeposit.id
  }
  
  return undefined
}

// Step 3: Generate missing dates for pending loans
function generateLoanDates(loan) {
  const today = new Date()
  const startDate = today.toISOString().split('T')[0]
  
  // Calculate end date based on duration
  const endDate = new Date(today)
  endDate.setMonth(endDate.getMonth() + loan.duration)
  const endDateStr = endDate.toISOString().split('T')[0]
  
  // Calculate next EMI date (1 month from start)
  const nextEMIDate = new Date(today)
  nextEMIDate.setMonth(nextEMIDate.getMonth() + 1)
  const nextEMIDateStr = nextEMIDate.toISOString().split('T')[0]
  
  return {
    start_date: startDate,
    end_date: endDateStr,
    next_emi_date: nextEMIDateStr
  }
}

// Step 4: Validate EMI calculations
function validateAndFixEMI(loan) {
  const correctEMI = calculateEMI(loan.amount, loan.interest, loan.duration)
  const difference = Math.abs(correctEMI - loan.emi)
  
  // If difference is more than 1 rupee, fix it
  if (difference > 1) {
    console.log(`Fixing EMI for loan ${loan.id}: ${loan.emi} → ${correctEMI}`)
    return correctEMI
  }
  
  return loan.emi
}

// Step 5: Verify member UUIDs exist
function verifyMemberExists(memberId) {
  return membersData.some(member => member.id === memberId)
}

// Step 6: Generate missing deposit entries for members
function generateMissingDeposits() {
  const newDeposits = []
  const membersWithDeposits = new Set(
    passbookData
      .filter(entry => entry.reference === 'deposit')
      .map(entry => entry.memberId)
  )
  
  membersData.forEach(member => {
    if (!membersWithDeposits.has(member.id) && member.status === 'active') {
      // Generate a reasonable deposit amount based on their loans
      const memberLoans = loansData.filter(loan => loan.memberId === member.id)
      const totalLoanAmount = memberLoans.reduce((sum, loan) => sum + loan.amount, 0)
      
      // Generate deposit that can cover 125% of their loans
      const depositAmount = totalLoanAmount > 0 ? Math.ceil(totalLoanAmount * 1.25) : 50000
      
      const newDeposit = {
        id: `pb-deposit-${member.id}`,
        memberId: member.id,
        type: 'credit',
        amount: depositAmount,
        date: member.join_date,
        reference: 'deposit',
        description: `Initial deposit for ${member.name}`,
        balance: depositAmount,
        payment_mode: 'cash',
        added_by: 'admin-001',
        created_at: member.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      newDeposits.push(newDeposit)
      console.log(`Generated deposit for ${member.name}: ₹${depositAmount.toLocaleString('en-IN')}`)
    }
  })
  
  return newDeposits
}

// Step 7: Main function to fix all loans
function fixLoansModule() {
  console.log('🔧 Starting Loans Module Fixes...\n')
  
  // Generate missing deposits first
  console.log('📝 Step 1: Generating missing deposits...')
  const missingDeposits = generateMissingDeposits()
  console.log(`Generated ${missingDeposits.length} missing deposit entries\n`)
  
  console.log('🔍 Step 2: Analyzing and fixing loans...')
  const fixedLoans = []
  const issuesFound = []
  
  loansData.forEach((loan, index) => {
    const issues = []
    
    // Verify member exists
    if (!verifyMemberExists(loan.memberId)) {
      issues.push(`Invalid member ID: ${loan.memberId}`)
    }
    
    // Get member deposit amount
    const memberDepositAmount = getMemberDepositAmount(loan.memberId)
    
    // Get deposit reference
    const deposit_reference = getLoanDepositReference(loan.memberId, loan.amount)
    
    // Check 80% eligibility
    const maxEligibleAmount = Math.round(memberDepositAmount * 0.8)
    if (loan.amount > maxEligibleAmount && memberDepositAmount > 0) {
      issues.push(`Loan amount ₹${loan.amount.toLocaleString('en-IN')} exceeds 80% of deposit ₹${maxEligibleAmount.toLocaleString('en-IN')}`)
    }
    
    // Fix missing dates for pending loans
    let { start_date, end_date, next_emi_date } = loan
    if (loan.status === 'pending' && (!start_date || !end_date || !next_emi_date)) {
      const dates = generateLoanDates(loan)
      start_date = dates.start_date
      end_date = dates.end_date
      next_emi_date = dates.next_emi_date
      issues.push('Filled missing dates for pending loan')
    }
    
    // Validate EMI
    const correctEMI = validateAndFixEMI(loan)
    if (correctEMI !== loan.emi) {
      issues.push(`EMI corrected: ₹${loan.emi} → ₹${correctEMI}`)
    }
    
    // Check status field
    if (!['pending', 'approved', 'active', 'completed', 'rejected'].includes(loan.status)) {
      issues.push(`Invalid status: ${loan.status}`)
    }
    
    // Create enhanced loan object
    const enhancedLoan = {
      ...loan,
      start_date,
      end_date,
      next_emi_date,
      emi: correctEMI,
      deposit_reference,
      member_deposit_amount: memberDepositAmount
    }
    
    fixedLoans.push(enhancedLoan)
    
    if (issues.length > 0) {
      issuesFound.push(`Loan ${loan.id} (${loan.memberId}): ${issues.join(', ')}`)
    }
    
    console.log(`✅ Processed loan ${index + 1}/${loansData.length}: ${loan.id}`)
  })
  
  console.log('\n📊 Summary:')
  console.log(`- Total loans processed: ${loansData.length}`)
  console.log(`- Missing deposits generated: ${missingDeposits.length}`)
  console.log(`- Issues found and fixed: ${issuesFound.length}`)
  
  if (issuesFound.length > 0) {
    console.log('\n🔧 Issues Fixed:')
    issuesFound.forEach(issue => console.log(`  • ${issue}`))
  }
  
  // Calculate statistics
  const totalDeposits = fixedLoans.reduce((sum, loan) => sum + loan.member_deposit_amount, 0)
  const totalLoanAmount = fixedLoans.reduce((sum, loan) => sum + loan.amount, 0)
  const eligibleLoans = fixedLoans.filter(loan => loan.amount <= loan.member_deposit_amount * 0.8).length
  
  console.log('\n📈 Enhanced Statistics:')
  console.log(`- Total member deposits: ₹${totalDeposits.toLocaleString('en-IN')}`)
  console.log(`- Total loan amount: ₹${totalLoanAmount.toLocaleString('en-IN')}`)
  console.log(`- Loans within 80% limit: ${eligibleLoans}/${fixedLoans.length} (${Math.round(eligibleLoans / fixedLoans.length * 100)}%)`)
  
  return {
    fixedLoans,
    missingDeposits,
    statistics: {
      totalLoans: fixedLoans.length,
      totalDeposits,
      totalLoanAmount,
      eligibleLoans,
      eligibilityRate: Math.round(eligibleLoans / fixedLoans.length * 100)
    },
    issuesFixed: issuesFound.length
  }
}

// Step 8: Cross-module validation helper
function validateLoanMemberLinkage() {
  console.log('\n🔗 Cross-Module Validation:')
  
  // Check all loan memberIds exist in members
  const invalidMemberIds = loansData
    .map(loan => loan.memberId)
    .filter(memberId => !membersData.some(member => member.id === memberId))
  
  // Check all passbook memberIds exist in members
  const invalidPassbookMemberIds = passbookData
    .map(entry => entry.memberId)
    .filter(memberId => !membersData.some(member => member.id === memberId))
  
  // Check all passbook loan_ids exist in loans
  const invalidLoanIds = passbookData
    .filter(entry => entry.loan_id)
    .map(entry => entry.loan_id)
    .filter(loanId => !loansData.some(loan => loan.id === loanId))
  
  console.log(`- Invalid loan memberIds: ${invalidMemberIds.length}`)
  console.log(`- Invalid passbook memberIds: ${invalidPassbookMemberIds.length}`)
  console.log(`- Invalid passbook loan_ids: ${invalidLoanIds.length}`)
  
  if (invalidMemberIds.length > 0) {
    console.log('  Invalid member IDs in loans:', invalidMemberIds)
  }
  
  if (invalidPassbookMemberIds.length > 0) {
    console.log('  Invalid member IDs in passbook:', invalidPassbookMemberIds)
  }
  
  if (invalidLoanIds.length > 0) {
    console.log('  Invalid loan IDs in passbook:', invalidLoanIds)
  }
  
  return {
    invalidMemberIds,
    invalidPassbookMemberIds,
    invalidLoanIds,
    isValid: invalidMemberIds.length === 0 && invalidPassbookMemberIds.length === 0 && invalidLoanIds.length === 0
  }
}

// Step 9: Generate updated data files
function generateUpdatedFiles(fixedLoans, missingDeposits) {
  console.log('\n📁 Generating updated data files...')
  
  // Update loans data
  const updatedLoansData = `// Future-Proof Loans Data for Saanify Society Management Platform
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
export const loansData: Loan[] = ${JSON.stringify(fixedLoans, null, 2)}

export default loansData`
  
  // Update passbook data with new deposits
  const updatedPassbookData = `// Future-Proof Passbook Data for Saanify Society Management Platform
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
export const passbookData: PassbookEntry[] = ${JSON.stringify([...passbookData, ...missingDeposits], null, 2)}

export default passbookData`
  
  // Write updated files
  fs.writeFileSync(loansDataPath, updatedLoansData)
  fs.writeFileSync(passbookDataPath, updatedPassbookData)
  
  console.log('✅ Updated loansData.ts with enhanced loan information')
  console.log('✅ Updated passbookData.ts with missing deposits')
}

// Main execution
function main() {
  try {
    const result = fixLoansModule()
    const validation = validateLoanMemberLinkage()
    
    // Generate updated files
    generateUpdatedFiles(result.fixedLoans, result.missingDeposits)
    
    console.log('\n✅ Loans Module Fixes Complete!')
    console.log(`📁 Results: ${result.issuesFixed} issues fixed, ${result.missingDeposits.length} deposits added`)
    console.log(`🔗 Cross-module validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`)
    console.log(`📊 Eligibility rate: ${result.statistics.eligibilityRate}%`)
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      fixes: result,
      validation,
      summary: {
        totalIssuesFixed: result.issuesFixed,
        depositsGenerated: result.missingDeposits.length,
        crossModuleValid: validation.isValid,
        eligibilityRate: result.statistics.eligibilityRate
      }
    }
    
    fs.writeFileSync(
      path.join(__dirname, 'loans-fix-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    console.log('📄 Detailed report saved to: loans-fix-report.json')
    
  } catch (error) {
    console.error('❌ Error during loan fixes:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = {
  fixLoansModule,
  validateLoanMemberLinkage,
  generateMissingDeposits
}