const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data
    await prisma.user.deleteMany();
    await prisma.societyAccount.deleteMany();
    await prisma.society.deleteMany();
    console.log('🧹 Cleaned existing data');

    // Create users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: 'ADMIN@saanify.com',
        name: 'ADMIN',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    const clientUser = await prisma.user.create({
      data: {
        email: 'client@saanify.com',
        name: 'Demo Client',
        password: clientPassword,
        role: 'CLIENT',
        isActive: true,
      },
    });

    const trialUser = await prisma.user.create({
      data: {
        email: 'client1@gmail.com',
        name: 'Trial User',
        password: clientPassword,
        role: 'CLIENT',
        isActive: true,
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
    });

    console.log('✅ Created users:', { admin: adminUser.email, client: clientUser.email, trial: trialUser.email });

    // Create society accounts
    const societyAccount = await prisma.societyAccount.create({
      data: {
        name: 'Demo Society',
        adminName: 'Demo Admin',
        email: 'admin@demo.com',
        subscriptionPlan: 'TRIAL',
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    console.log('✅ Created society account:', societyAccount.name);

    // Create a society
    const society = await prisma.society.create({
      data: {
        name: 'Demo Society Main',
        description: 'A demo society for testing',
        address: '123 Demo Street',
        email: 'info@demo.com',
        societyAccountId: societyAccount.id,
        createdByUserId: adminUser.id,
        isActive: true,
      },
    });

    console.log('✅ Created society:', society.name);

    console.log('🎉 Database seeding completed successfully!');
    
    return {
      users: [adminUser, clientUser, trialUser],
      societyAccount,
      society,
    };

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });