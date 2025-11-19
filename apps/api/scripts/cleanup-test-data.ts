import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 Cleaning up test data...')

  try {
    // Delete test users (specific test emails only)
    const deleted = await prisma.user.deleteMany({
      where: {
        OR: [
          { username: 'testuser' },
          { username: 'newuser' },
          { username: 'invalidemail' },
          { username: 'weakpass' },
          { username: 'duplicateuser' },
          { email: 'test-user@topsteel.com' },
          { email: 'new-user@topsteel.com' },
          { email: 'test@topsteel.com' },
        ],
      },
    })

    console.log(`✅ Deleted ${deleted.count} test users`)
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
