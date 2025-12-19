const { PrismaClient } = require('@prisma/client')

async function testDifferentDatabases() {
  console.log('🔍 Testing different database connections...')
  
  // Test 1: Default connection (from env)
  try {
    const prisma1 = new PrismaClient()
    const userCount1 = await prisma1.user.count()
    console.log('✅ Default DB connection works, users:', userCount1)
    await prisma1.$disconnect()
  } catch (error) {
    console.error('❌ Default DB connection failed:', error.message)
  }

  // Test 2: Explicit SQLite connection
  try {
    const prisma2 = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./db/custom.db'
        }
      }
    })
    const userCount2 = await prisma2.user.count()
    console.log('✅ Custom DB connection works, users:', userCount2)
    await prisma2.$disconnect()
  } catch (error) {
    console.error('❌ Custom DB connection failed:', error.message)
  }

  // Test 3: Check if PostgreSQL connection is being attempted
  try {
    // This would be the case if DATABASE_URL is set to PostgreSQL
    const prisma3 = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    const userCount3 = await prisma3.user.count()
    console.log('✅ ENV DB connection works, users:', userCount3)
    await prisma3.$disconnect()
  } catch (error) {
    console.error('❌ ENV DB connection failed:', error.message)
  }

  console.log('📋 DATABASE_URL from env:', process.env.DATABASE_URL)
}

testDifferentDatabases()