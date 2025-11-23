import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create super admin user
  const superAdminEmail = 'superadmin@saanify.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })
    
    console.log('✅ Super admin created:', superAdmin.email)
  } else {
    console.log('✅ Super admin already exists:', existingAdmin.email)
  }

  // Create dummy society accounts as requested
  const dummySocieties = [
    {
      name: 'Green Valley Society',
      adminName: 'Robert Johnson',
      email: 'admin@greenvalley.com',
      phone: '+91 98765 43210',
      address: '123 Green Valley Road, Bangalore',
      subscriptionPlan: 'PRO' as const,
      status: 'ACTIVE' as const,
      trialEndsAt: null,
      subscriptionEndsAt: new Date('2024-12-31')
    },
    {
      name: 'Sunset Apartments',
      adminName: 'Maria Garcia',
      email: 'admin@sunsetapartments.com',
      phone: '+91 98765 43211',
      address: '456 Sunset Boulevard, Mumbai',
      subscriptionPlan: 'TRIAL' as const,
      status: 'TRIAL' as const,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      subscriptionEndsAt: null
    },
    {
      name: 'Royal Residency',
      adminName: 'William Chen',
      email: 'admin@royalresidency.com',
      phone: '+91 98765 43212',
      address: '789 Royal Street, Delhi',
      subscriptionPlan: 'BASIC' as const,
      status: 'EXPIRED' as const,
      trialEndsAt: null,
      subscriptionEndsAt: new Date('2024-01-31')
    },
    {
      name: 'Blue Sky Heights',
      adminName: 'Patricia Williams',
      email: 'admin@blueskyheights.com',
      phone: '+91 98765 43213',
      address: '321 Blue Sky Avenue, Pune',
      subscriptionPlan: 'ENTERPRISE' as const,
      status: 'LOCKED' as const,
      trialEndsAt: null,
      subscriptionEndsAt: new Date('2024-06-30')
    }
  ]

  for (const society of dummySocieties) {
    const existingSociety = await prisma.societyAccount.findUnique({
      where: { email: society.email }
    })

    if (!existingSociety) {
      // Create society account
      const createdSociety = await prisma.societyAccount.create({
        data: society
      })

      // Create admin user for the society
      const hashedPassword = await bcrypt.hash('Saanify@123', 12)
      
      await prisma.user.create({
        data: {
          email: society.email,
          name: society.adminName,
          password: hashedPassword,
          role: 'CLIENT',
          societyAccountId: createdSociety.id,
          isActive: society.status !== 'LOCKED'
        }
      })
      
      console.log(`✅ Dummy society created: ${society.name}`)
    } else {
      console.log(`✅ Society already exists: ${society.name}`)
    }
  }

  // Create demo client user
  const clientEmail = 'client@saanify.com'
  const existingClient = await prisma.user.findUnique({
    where: { email: clientEmail }
  })

  if (!existingClient) {
    const hashedPassword = await bcrypt.hash('client123', 12)
    
    // Get first society account for client
    const firstSociety = await prisma.societyAccount.findFirst()
    
    const client = await prisma.user.create({
      data: {
        email: clientEmail,
        name: 'Demo Client',
        password: hashedPassword,
        role: 'CLIENT',
        societyAccountId: firstSociety?.id,
        isActive: true
      }
    })
    
    console.log('✅ Demo client created:', client.email)
  } else {
    console.log('✅ Demo client already exists:', existingClient.email)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })