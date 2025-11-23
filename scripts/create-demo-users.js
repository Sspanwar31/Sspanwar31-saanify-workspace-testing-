const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    console.log('🚀 Creating demo users...');

    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@saanify.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'admin@saanify.com',
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Super Admin created:', {
      email: 'admin@saanify.com',
      password: 'admin123',
      role: 'SUPER_ADMIN'
    });

    // Create Demo Client
    const clientPassword = await bcrypt.hash('client123', 10);
    const client = await prisma.user.upsert({
      where: { email: 'client@demo.com' },
      update: {},
      create: {
        name: 'Demo Client',
        email: 'client@demo.com',
        password: clientPassword,
        role: 'CLIENT',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Demo Client created:', {
      email: 'client@demo.com',
      password: 'client123',
      role: 'CLIENT'
    });

    // Create Society Account for the client
    const societyAccount = await prisma.societyAccount.upsert({
      where: { email: 'client@demo.com' },
      update: {},
      create: {
        name: 'Demo Society',
        adminName: 'Demo Client',
        email: 'client@demo.com',
        phone: '+91 9876543210',
        address: '123 Demo Street, Demo City',
        subscriptionPlan: 'TRIAL',
        status: 'ACTIVE',
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true,
      },
    });

    console.log('✅ Society Account created:', societyAccount.name);

    // Link user to society account
    await prisma.user.update({
      where: { id: client.id },
      data: { societyAccountId: societyAccount.id },
    });

    // Create a demo society
    const society = await prisma.society.create({
      data: {
        name: 'Demo Housing Society',
        description: 'A beautiful demo society for testing purposes',
        address: '123 Demo Street, Demo City, State 123456',
        phone: '+91 9876543210',
        email: 'info@demo-society.com',
        societyAccountId: societyAccount.id,
        createdByUserId: client.id,
        isActive: true,
      },
    });

    console.log('✅ Demo Society created:', society.name);

    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('🔑 Super Admin:');
    console.log('   Email: admin@saanify.com');
    console.log('   Password: admin123');
    console.log('   Role: SUPER_ADMIN');
    console.log('\n🔑 Demo Client:');
    console.log('   Email: client@demo.com');
    console.log('   Password: client123');
    console.log('   Role: CLIENT');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();