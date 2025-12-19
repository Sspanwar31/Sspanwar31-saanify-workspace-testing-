const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...')
    
    // Try to query user table
    try {
      const userCount = await prisma.user.count()
      console.log('✅ Users table found, count:', userCount)
      
      // List some users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        },
        take: 5
      })
      console.log('📋 Users:', users.map(u => `${u.email} (${u.role})`))
    } catch (userError) {
      console.error('❌ Users table error:', userError.message)
    }

    // Check other tables
    const tables = ['member', 'loan', 'passbookEntry', 'expense', 'societyAccount']
    for (const table of tables) {
      try {
        const model = prisma[table]
        if (model && typeof model.count === 'function') {
          const count = await model.count()
          console.log(`✅ ${table} table found, count: ${count}`)
        }
      } catch (error) {
        console.log(`❌ ${table} table error:`, error.message)
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()