import { db } from './src/lib/db.js';

async function createTestData() {
  console.log('🧪 Creating test data for maturity system...');

  try {
    // Create test members
    const members = [
      {
        name: 'John Doe',
        phone: '+91 9876543210',
        address: '123 Test Street, Mumbai'
      },
      {
        name: 'Jane Smith',
        phone: '+91 9876543211',
        address: '456 Test Avenue, Delhi'
      },
      {
        name: 'Michael Brown',
        phone: '+91 9876543212',
        address: '789 Test Road, Bangalore'
      }
    ];

    for (const memberData of members) {
      // Check if member already exists
      const existingMember = await db.member.findFirst({
        where: { name: memberData.name }
      });

      if (!existingMember) {
        const member = await db.member.create({
          data: memberData
        });
        console.log(`✅ Created member: ${member.name}`);

        // Create some deposit entries with different dates
        const deposits = [
          { amount: 10000, monthsAgo: 24 },
          { amount: 5000, monthsAgo: 18 },
          { amount: 3000, monthsAgo: 12 }
        ];

        for (const deposit of deposits) {
          const depositDate = new Date();
          depositDate.setMonth(depositDate.getMonth() - deposit.monthsAgo);

          await db.passbookEntry.create({
            data: {
              memberId: member.id,
              depositAmount: deposit.amount,
              mode: 'CASH',
              transactionDate: depositDate,
              description: `Test deposit ${deposit.monthsAgo} months ago`
            }
          });
        }

        console.log(`💰 Created deposits for: ${member.name}`);
      } else {
        console.log(`⏭️ Member already exists: ${memberData.name}`);
      }
    }

    console.log('🎉 Test data creation completed!');
    
    // Generate maturity records
    console.log('🔄 Generating maturity records...');
    const response = await fetch('http://localhost:3000/api/maturity', {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Maturity records generated:', result);
    } else {
      console.log('❌ Failed to generate maturity records');
    }

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await db.$disconnect();
  }
}

createTestData();