const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function checkUsers() {
  try {
    const users = await db.user.findMany();
    console.log('Total users:', users.length);
    if (users.length > 0) {
      console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    } else {
      console.log('No users found. Creating demo user...');
      const demoUser = await db.user.create({
        data: {
          email: 'client@saanify.com',
          name: 'Demo Client',
          role: 'CLIENT',
          password: 'demo123'
        }
      });
      console.log('Demo user created:', demoUser);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

checkUsers();