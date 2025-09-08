/**
 * Générateur de données de test réalistes pour le système multi-tenant
 */

export interface TestSociete {
  id: string
  code: string
  nom: string
  email: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL'
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'
  databaseName: string
}

export interface TestUser {
  id: string
  email: string
  prenom: string
  nom: string
  role: string
  societeId: string
  societeCode: string
}

export namespace TestDataGenerator {
  /**
   * Génère un UUID v4
   */
  export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Génère une société de test
   */
  export function generateSociete(overrides?: Partial<TestSociete>): TestSociete {
    const id = overrides?.id || generateUUID()
    const code = overrides?.code || generateSocieteCode()

    return {
      id,
      code,
      nom: overrides?.nom || `${code} Industries SA`,
      email: overrides?.email || `contact@${code.toLowerCase()}.com`,
      status: overrides?.status || 'ACTIVE',
      plan: overrides?.plan || 'PROFESSIONAL',
      databaseName: overrides?.databaseName || `erp_topsteel_${code.toLowerCase()}`,
      ...overrides,
    }
  }

  /**
   * Génère un code de société unique
   */
  export function generateSocieteCode(): string {
    const prefixes = ['TOP', 'METAL', 'STEEL', 'IRON', 'ALU', 'TECH']
    const suffixes = ['STEEL', 'WORKS', 'FORGE', 'CRAFT', 'PRO', 'PLUS']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    return `${prefix}${suffix}`
  }

  /**
   * Génère un utilisateur de test
   */
  export function generateUser(societe?: TestSociete, overrides?: Partial<TestUser>): TestUser {
    const testSociete = societe || generateSociete()
    const prenoms = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Anne']
    const noms = ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Petit']

    const prenom = overrides?.prenom || prenoms[Math.floor(Math.random() * prenoms.length)]
    const nom = overrides?.nom || noms[Math.floor(Math.random() * noms.length)]
    const role = overrides?.role || 'user'

    return {
      id: overrides?.id || generateUUID(),
      email:
        overrides?.email ||
        `${prenom.toLowerCase()}.${nom.toLowerCase()}@${testSociete.code.toLowerCase()}.com`,
      prenom,
      nom,
      role,
      societeId: testSociete.id,
      societeCode: testSociete.code,
      ...overrides,
    }
  }

  /**
   * Génère un ensemble complet de données de test
   */
  export function generateTestEnvironment() {
    // Sociétés de test
    const societes = {
      topsteel: generateSociete({
        code: 'TOPSTEEL',
        nom: 'TopSteel SA',
        email: 'contact@topsteel.com',
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
      }),
      metalux: generateSociete({
        code: 'METALUX',
        nom: 'Metalux Industries',
        email: 'info@metalux.com',
        status: 'ACTIVE',
        plan: 'PROFESSIONAL',
      }),
      demo: generateSociete({
        code: 'DEMO',
        nom: 'Demo Company',
        email: 'demo@example.com',
        status: 'TRIAL',
        plan: 'STARTER',
      }),
    }

    // Utilisateurs de test
    const users = {
      // TopSteel users
      topsteelAdmin: generateUser(societes.topsteel, {
        email: 'admin@topsteel.com',
        prenom: 'Admin',
        nom: 'TopSteel',
        role: 'admin',
      }),
      topsteelUser: generateUser(societes.topsteel, {
        email: 'user@topsteel.com',
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'user',
      }),

      // Metalux users
      metaluxAdmin: generateUser(societes.metalux, {
        email: 'admin@metalux.com',
        prenom: 'Admin',
        nom: 'Metalux',
        role: 'admin',
      }),

      // Demo user
      demoUser: generateUser(societes.demo, {
        email: 'demo@example.com',
        prenom: 'Demo',
        nom: 'User',
        role: 'viewer',
      }),
    }

    return {
      societes,
      users,
    }
  }

  /**
   * Génère un token JWT pour un utilisateur spécifique
   */
  export function generateTokenPayload(user: TestUser, societe: TestSociete) {
    return {
      sub: user.id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      societeId: societe.id,
      societeCode: societe.code,
      societeName: societe.nom,
      role: user.role,
      permissions: getPermissionsByRole(user.role),
      isTest: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 heure
    }
  }

  /**
   * Retourne les permissions en fonction du rôle
   */
  export function getPermissionsByRole(role: string): string[] {
    const permissionsMap: Record<string, string[]> = {
      'super-admin': ['*'],
      admin: ['users:*', 'societes:read', 'settings:*', 'reports:*'],
      manager: ['users:read', 'users:update', 'reports:*', 'inventory:*'],
      user: ['inventory:read', 'inventory:update', 'reports:read'],
      viewer: ['inventory:read', 'reports:read'],
      guest: ['public:read'],
    }

    return permissionsMap[role] || ['read']
  }

  /**
   * Affiche les données de test générées
   */
  export function displayTestData() {
    const env = generateTestEnvironment()

    console.log('🏢 SOCIÉTÉS DE TEST')
    console.log('='.repeat(80))
    Object.entries(env.societes).forEach(([key, societe]) => {
      console.log(`\n${key.toUpperCase()}:`)
      console.log(`  ID: ${societe.id}`)
      console.log(`  Code: ${societe.code}`)
      console.log(`  Nom: ${societe.nom}`)
      console.log(`  Status: ${societe.status}`)
      console.log(`  Plan: ${societe.plan}`)
      console.log(`  Database: ${societe.databaseName}`)
    })

    console.log('\n👥 UTILISATEURS DE TEST')
    console.log('='.repeat(80))
    Object.entries(env.users).forEach(([key, user]) => {
      console.log(`\n${key}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Nom: ${user.prenom} ${user.nom}`)
      console.log(`  Rôle: ${user.role}`)
      console.log(`  Société: ${user.societeCode}`)
      console.log(`  Permissions: ${getPermissionsByRole(user.role).join(', ')}`)
    })
  }
}

// Export pour utilisation directe
export function generateTestEnvironment() {
  return TestDataGenerator.generateTestEnvironment()
}

export function generateUUID() {
  return TestDataGenerator.generateUUID()
}
