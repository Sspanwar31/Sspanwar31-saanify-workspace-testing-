import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Security layer to prevent accidental superadmin role creation
 * This function runs on app startup to ensure no superadmin roles exist
 */
export async function lockRoleSystem() {
  try {
    // Check for any users with superadmin role variations
    const blockedUsers = await db.user.findMany({
      where: {
        OR: [
          { role: 'superadmin' },
          { role: 'Superadmin' },
          { role: 'SUPERADMIN' }
        ]
      }
    });

    if (blockedUsers.length > 0) {
      // Remove superadmin role from any found users
      await db.user.updateMany({
        where: {
          OR: [
            { role: 'superadmin' },
            { role: 'Superadmin' },
            { role: 'SUPERADMIN' }
          ]
        },
        data: {
          role: 'CLIENT' // Reset to default role
        }
      });

      console.warn(`⚠️ SECURITY: Found and removed superadmin role from ${blockedUsers.length} user(s)`);
      console.warn('⚠️ Superadmin role has been reset to CLIENT for security reasons');
      
      // Log details for monitoring (without sensitive data)
      blockedUsers.forEach(user => {
        console.warn(`⚠️ User ${user.id} role was reset from ${user.role} to CLIENT`);
      });
    }

    console.log('✅ Role system security check completed - no superadmin roles found');
  } catch (error) {
    console.error('❌ Error during role system security check:', error);
  }
}

// Initialize security lock on module load
if (typeof window === 'undefined') {
  // Only run on server-side
  lockRoleSystem().catch(console.error);
}