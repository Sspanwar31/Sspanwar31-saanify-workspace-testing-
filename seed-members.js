const { PrismaClient } = require('@prisma/client');
const { membersData } = require('./src/data/membersData.ts');

const prisma = new PrismaClient();

async function seedMembers() {
  try {
    console.log('Starting to seed members...');
    
    for (const member of membersData) {
      await prisma.member.upsert({
        where: { id: member.id },
        update: {},
        create: {
          id: member.id,
          name: member.name,
          phone: member.phone,
          address: member.address,
          joiningDate: new Date(member.joinDate),
          status: member.status
        }
      });
      console.log(`Seeded member: ${member.name}`);
    }
    
    console.log('Members seeded successfully');
  } catch (error) {
    console.error('Error seeding members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMembers();