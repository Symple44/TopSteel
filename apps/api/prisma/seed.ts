import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data (optional - comment out if you want to keep data)
  console.log('🧹 Cleaning existing data...')
  await prisma.userSocieteRole.deleteMany()
  await prisma.societeUser.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.userMfa.deleteMany()
  await prisma.userSettings.deleteMany()
  await prisma.role.deleteMany()
  await prisma.societe.deleteMany()
  await prisma.user.deleteMany()

  // Create Roles
  console.log('👥 Creating roles...')
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'OWNER',
        label: 'Propriétaire',
        description: 'Propriétaire de la société',
        level: 100,
        isSystem: true,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        name: 'ADMIN',
        label: 'Administrateur',
        description: 'Administrateur de la société',
        level: 90,
        isSystem: true,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        name: 'MANAGER',
        label: 'Manager',
        description: 'Manager',
        level: 80,
        isSystem: true,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        name: 'USER',
        label: 'Utilisateur',
        description: 'Utilisateur standard',
        level: 30,
        isSystem: true,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${roles.length} roles`)

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create Admin User
  console.log('👤 Creating admin user...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@topsteel.fr',
      password: hashedPassword,
      nom: 'Admin',
      prenom: 'System',
      role: 'SUPER_ADMIN',
      actif: true,
      acronyme: 'ADM',
      metadata: {
        createdBy: 'seed',
        description: 'Admin user created by seed script',
      },
    },
  })

  console.log(`✅ Created admin user: ${adminUser.email}`)

  // Create Test User
  console.log('👤 Creating test user...')
  const testUser = await prisma.user.create({
    data: {
      email: 'test@topsteel.fr',
      password: hashedPassword,
      nom: 'Test',
      prenom: 'User',
      role: 'OPERATEUR',
      actif: true,
      acronyme: 'TST',
      metadata: {
        createdBy: 'seed',
        description: 'Test user created by seed script',
      },
    },
  })

  console.log(`✅ Created test user: ${testUser.email}`)

  // Create Test Societe
  console.log('🏢 Creating test societe...')
  const societe = await prisma.societe.create({
    data: {
      code: 'TST001',
      name: 'TopSteel Test',
      databaseName: 'topsteel_test',
      legalName: 'TopSteel Métallerie Test',
      siret: '12345678900001',
      address: '123 Rue de la Métallurgie',
      city: 'Lyon',
      postalCode: '69000',
      country: 'France',
      phone: '+33 4 12 34 56 78',
      email: 'contact@topsteel-test.fr',
      website: 'https://topsteel-test.fr',
      isActive: true,
    },
  })

  console.log(`✅ Created societe: ${societe.name} (${societe.code})`)

  // Associate Admin User to Societe with OWNER role
  console.log('🔗 Associating admin user to societe...')
  const ownerRole = roles.find((r) => r.name === 'OWNER')!

  await prisma.userSocieteRole.create({
    data: {
      userId: adminUser.id,
      societeId: societe.id,
      roleId: ownerRole.id,
      isActive: true,
      permissions: {
        additional: ['*'],
        restricted: [],
      },
    },
  })

  // Associate Test User to Societe with USER role
  const userRole = roles.find((r) => r.name === 'USER')!

  await prisma.userSocieteRole.create({
    data: {
      userId: testUser.id,
      societeId: societe.id,
      roleId: userRole.id,
      isActive: true,
      permissions: {
        additional: [],
        restricted: [],
      },
    },
  })

  console.log(`✅ Associated users to societe with roles`)

  // Create User Settings for Admin
  console.log('⚙️ Creating user settings...')
  await prisma.userSettings.create({
    data: {
      userId: adminUser.id,
      profile: {
        firstName: adminUser.prenom,
        lastName: adminUser.nom,
        email: adminUser.email,
      },
      company: {
        name: societe.name,
        address: societe.address,
        city: societe.city,
        postalCode: societe.postalCode,
        country: societe.country,
      },
      preferences: {
        language: 'fr',
        timezone: 'Europe/Paris',
        theme: 'vibrant',
        notifications: {
          email: true,
          push: true,
          sms: false,
          emailTypes: {
            newMessages: true,
            systemAlerts: true,
            taskReminders: false,
            weeklyReports: true,
            securityAlerts: true,
            maintenanceNotice: false,
          },
          pushTypes: {
            enabled: true,
            sound: true,
            urgent: true,
            normal: false,
            quiet: true,
          },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '07:00',
          },
        },
        appearance: {
          theme: 'vibrant',
          language: 'fr',
          fontSize: 'medium',
          sidebarWidth: 'normal',
          density: 'comfortable',
          accentColor: 'blue',
          contentWidth: 'compact',
        },
      },
    },
  })

  console.log(`✅ Created user settings for admin`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - Users: 2 (admin@topsteel.fr, test@topsteel.fr)`)
  console.log(`   - Password: admin123`)
  console.log(`   - Roles: ${roles.length}`)
  console.log(`   - Societes: 1 (${societe.name})`)
  console.log('\n🔐 Login credentials:')
  console.log(`   Email: admin@topsteel.fr`)
  console.log(`   Password: admin123`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
