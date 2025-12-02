// EMI Reminder Service - Runs on 10th of each month to send reminders for active loans
// This can be called by a cron job or scheduled task

import ZAI from 'z-ai-web-dev-sdk';

interface LoanReminder {
  memberId: string;
  memberName: string;
  loanId: string;
  loanAmount: number;
  emiAmount: number;
  dueDate: string;
  memberEmail?: string;
  memberPhone?: string;
}

async function getActiveLoans(): Promise<LoanReminder[]> {
  try {
    // This would connect to your database
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/client/loans`);
    if (response.ok) {
      const data = await response.json();
      return data.loans
        .filter((loan: any) => loan.status === 'active')
        .map((loan: any): LoanReminder => ({
          memberId: loan.memberId,
          memberName: loan.memberName,
          loanId: loan.id,
          loanAmount: loan.loanAmount,
          emiAmount: loan.emi || 0,
          dueDate: loan.nextEmiDate || loan.endDate,
          memberEmail: loan.memberEmail,
          memberPhone: loan.memberPhone
        }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching active loans:', error);
    return [];
  }
}

async function sendEMIReminder(loan: LoanReminder): Promise<boolean> {
  try {
    // Create passbook entry for the reminder
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/client/emi-reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        memberId: loan.memberId,
        loanId: loan.loanId,
        emiAmount: loan.emiAmount,
        dueDate: loan.dueDate
      }
    });

    // Here you could integrate with SMS service, Email service, or WhatsApp API
    // For now, we'll just create the passbook entry
    
    console.log(`EMI Reminder sent to ${loan.memberName} for Loan #${loan.loanId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send EMI reminder to ${loan.memberName}:`, error);
    return false;
  }
}

async function generatePersonalizedReminder(loan: LoanReminder): Promise<string> {
  const zai = await ZAI.create();

  const prompt = `
    Generate a personalized EMI reminder message for ${loan.memberName} with the following details:
    - Loan Amount: ₹${loan.loanAmount.toLocaleString('en-IN')}
    - Monthly EMI: ₹${loan.emiAmount.toLocaleString('en-IN')}
    - Due Date: ${loan.dueDate}
    - Member Contact: ${loan.memberEmail || loan.memberPhone || 'Not available'}
    
    Requirements:
    1. Keep it professional but friendly
    2. Include all key details clearly
    3. Add urgency (payment due soon)
    4. Include payment methods
    5. Keep it under 160 characters for SMS
    6. Add society contact information
    7. Mention late payment consequences if any
  `;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful loan reminder message generator. Create concise, professional messages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || 
      `EMI Reminder: Your loan EMI of ₹${loan.emiAmount} is due by ${loan.dueDate}. Please pay before the 15th to avoid late fees.`;
  } catch (error) {
    console.error('Error generating AI reminder:', error);
    return '';
  }
}

async function sendBulkEMIReminders(): Promise<void> {
  console.log('🔄 Starting EMI Reminder Service -', new Date().toISOString());
  
  try {
    const activeLoans = await getActiveLoans();
    
    if (activeLoans.length === 0) {
      console.log('✅ No active loans found. No reminders needed.');
      return;
    }

    console.log(`📊 Found ${activeLoans.length} active loans to process`);

    let successCount = 0;
    let failureCount = 0;

    for (const loan of activeLoans) {
      try {
        // Generate personalized reminder
        const personalizedMessage = await generatePersonalizedReminder(loan);
        
        // Create passbook entry
        const reminderSent = await sendEMIReminder(loan);
        
        if (reminderSent) {
          successCount++;
          console.log(`✅ EMI reminder sent to ${loan.memberName} for Loan #${loan.loanId}`);
        } else {
          failureCount++;
          console.log(`❌ Failed to send EMI reminder to ${loan.memberName} for Loan #${loan.loanId}`);
        }

        // Wait a bit between sending to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failureCount++;
        console.error(`❌ Error processing loan ${loan.loanId}:`, error);
      }
    }

    console.log('📋 EMI Reminder Service Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📊 Total Processed: ${activeLoans.length}`);
    console.log('🏁 EMI Reminder Service completed -', new Date().toISOString());

  } catch (error) {
    console.error('💥 EMI Reminder Service failed:', error);
  }
}

// Main execution
if (require.main === module) {
  // Check if today is the 10th of the month
  const today = new Date();
  const isTenthDay = today.getDate() === 10;
  
  if (isTenthDay) {
    console.log('📅 Today is the 10th - Running EMI Reminder Service');
    sendBulkEMIReminders();
  } else {
    console.log(`📅 Today is the ${today.getDate()}th - EMI reminders will run on the 10th`);
  }
}

export { 
  sendBulkEMIReminders,
  getActiveLoans,
  sendEMIReminder,
  generatePersonalizedReminder
};