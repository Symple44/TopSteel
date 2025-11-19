import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 Cleaning up test data...')

  try {
    // Delete test users
    const deleted = await prisma.user.deleteMany({
      where: {
        OR: [
          { username: 'testuser' },
          { email: 'test-user@topsteel.com' },
          { email: 'new-user@topsteel.com' },
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
