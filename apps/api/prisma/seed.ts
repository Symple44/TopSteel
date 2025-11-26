import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

/**
 * Seed Script - Development/Test Data Only
 *
 * Essential system data (roles, permissions) are in the Prisma migration:
 * - migrations/20250126000000_essential_base_data/migration.sql
 *
 * This seed creates test data for development:
 * - Test users (admin, test)
 * - Test societe
 * - User-societe-role associations
 * - Menu configuration (requires societe_id)
 * - System parameters (requires societe_id)
 * - Notification templates (requires societe_id)
 */

async function main() {
  console.log('🌱 Starting seed (dev/test data)...')

  // Clean existing test data (preserves system roles/permissions from migration)
  console.log('🧹 Cleaning existing test data...')
  await prisma.notificationTemplate.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.menuConfiguration.deleteMany()
  await prisma.parameterSystem.deleteMany()
  await prisma.userSocieteRole.deleteMany()
  await prisma.societeUser.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.userMfa.deleteMany()
  await prisma.userSettings.deleteMany()
  await prisma.societe.deleteMany()
  await prisma.user.deleteMany()

  // Fetch existing roles from migration
  console.log('👥 Fetching system roles from migration...')
  const roles = await prisma.role.findMany({
    where: {
      isSystem: true,
    },
  })

  if (roles.length === 0) {
    console.error('❌ No system roles found! Run the migration first: npx prisma migrate deploy')
    process.exit(1)
  }

  console.log(`✅ Found ${roles.length} system roles`)

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

  // ============================================
  // PARAMÈTRES SYSTÈME PAR DÉFAUT
  // ============================================
  console.log('⚙️ Creating system parameters...')

  const systemParams = [
    {
      code: 'APP_NAME',
      label: 'Nom de l\'application',
      description: 'Nom affiché dans l\'interface',
      type: 'string',
      value: 'TopSteel ERP',
      defaultValue: 'TopSteel ERP',
      category: 'general',
      isRequired: true,
      isEditable: true,
      societeId: societe.id,
    },
    {
      code: 'SESSION_TIMEOUT',
      label: 'Timeout session (minutes)',
      description: 'Durée d\'inactivité avant déconnexion',
      type: 'number',
      value: '30',
      defaultValue: '30',
      category: 'security',
      isRequired: true,
      isEditable: true,
      societeId: societe.id,
    },
  ]

  for (const param of systemParams) {
    await prisma.parameterSystem.create({ data: param })
  }
  console.log(`✅ Created ${systemParams.length} system parameters`)

  // ============================================
  // CONFIGURATION MENU PAR DÉFAUT
  // ============================================
  console.log('📋 Creating menu configuration...')

  const menuConfig = await prisma.menuConfiguration.create({
    data: {
      name: 'DEFAULT_MENU',
      description: 'Configuration menu par défaut',
      isActive: true,
      isDefault: true,
      societeId: societe.id,
    },
  })

  // Create root menu items first
  const rootMenuItems = [
    {
      label: 'Tableau de bord',
      icon: 'LayoutDashboard',
      path: '/dashboard',
      order: 1,
      isActive: true,
      isVisible: true,
      menuConfigurationId: menuConfig.id,
    },
    {
      label: 'Administration',
      icon: 'Shield',
      path: '/admin',
      order: 2,
      isActive: true,
      isVisible: true,
      menuConfigurationId: menuConfig.id,
    },
    {
      label: 'Paramètres',
      icon: 'Settings',
      path: '/settings',
      order: 3,
      isActive: true,
      isVisible: true,
      menuConfigurationId: menuConfig.id,
    },
    {
      label: 'Profil',
      icon: 'User',
      path: '/profile',
      order: 4,
      isActive: true,
      isVisible: true,
      menuConfigurationId: menuConfig.id,
    },
  ]

  const createdRootItems: Record<string, { id: string }> = {}
  for (const item of rootMenuItems) {
    const created = await prisma.menuItem.create({ data: item })
    createdRootItems[item.path] = created
  }

  // Create admin sub-menu items
  const adminSubItems = [
    { label: 'Utilisateurs', icon: 'Users', path: '/admin/users', order: 1 },
    { label: 'Rôles', icon: 'ShieldCheck', path: '/admin/roles', order: 2 },
    { label: 'Groupes', icon: 'UsersRound', path: '/admin/groups', order: 3 },
    { label: 'Sociétés', icon: 'Building2', path: '/admin/societes', order: 4 },
    { label: 'Entreprise', icon: 'Building', path: '/admin/company', order: 5 },
    { label: 'Base de données', icon: 'Database', path: '/admin/database', order: 6 },
    { label: 'Configuration menus', icon: 'Menu', path: '/admin/menu-config', order: 7 },
    { label: 'Sessions', icon: 'Clock', path: '/admin/sessions', order: 8 },
    { label: 'Traductions', icon: 'Languages', path: '/admin/translations', order: 9 },
  ]

  for (const item of adminSubItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        parentId: createdRootItems['/admin'].id,
        isActive: true,
        isVisible: true,
        menuConfigurationId: menuConfig.id,
      },
    })
  }

  // Create settings sub-menu items
  const settingsSubItems = [
    { label: 'Personnalisation menu', icon: 'LayoutList', path: '/settings/menu', order: 1 },
    { label: 'Sécurité', icon: 'Lock', path: '/settings/security', order: 2 },
    { label: 'Notifications', icon: 'Bell', path: '/settings/notifications', order: 3 },
    { label: 'Apparence', icon: 'Palette', path: '/settings/appearance', order: 4 },
  ]

  for (const item of settingsSubItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        parentId: createdRootItems['/settings'].id,
        isActive: true,
        isVisible: true,
        menuConfigurationId: menuConfig.id,
      },
    })
  }

  const totalMenuItems = rootMenuItems.length + adminSubItems.length + settingsSubItems.length
  console.log(`✅ Created ${totalMenuItems} menu items (hierarchical structure)`)

  // ============================================
  // TEMPLATES NOTIFICATION PAR DÉFAUT
  // ============================================
  console.log('📧 Creating notification templates...')

  const notificationTemplates = [
    {
      code: 'WELCOME_USER',
      name: 'Bienvenue utilisateur',
      description: 'Email envoyé lors de la création d\'un compte',
      type: 'email',
      template: 'Bienvenue {{user.prenom}} {{user.nom}} sur TopSteel ERP !',
      isActive: true,
      societeId: societe.id,
    },
    {
      code: 'PASSWORD_RESET',
      name: 'Réinitialisation mot de passe',
      description: 'Email de réinitialisation de mot de passe',
      type: 'email',
      template: 'Votre lien de réinitialisation: {{resetLink}}',
      isActive: true,
      societeId: societe.id,
    },
  ]

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.create({ data: template })
  }
  console.log(`✅ Created ${notificationTemplates.length} notification templates`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Summary (Dev/Test Data):')
  console.log(`   - Test users: 2 (admin@topsteel.fr, test@topsteel.fr)`)
  console.log(`   - Password: admin123`)
  console.log(`   - System roles (from migration): ${roles.length}`)
  console.log(`   - Test societe: 1 (${societe.name})`)
  console.log(`   - System params: ${systemParams.length}`)
  console.log(`   - Menu items: ${totalMenuItems} (with hierarchy)`)
  console.log(`   - Notification templates: ${notificationTemplates.length}`)
  console.log('\n🔐 Test login credentials:')
  console.log(`   Email: admin@topsteel.fr`)
  console.log(`   Password: admin123`)
  console.log('\n📝 Note: System roles and permissions are managed by Prisma migrations')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
