import { createConnection } from 'typeorm'

async function checkParametersSystem() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'erp_topsteel_auth',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
  })

  try {
    const roles = await connection.query(
      `SELECT key, value, metadata->>'icon' as icon, metadata->>'order' as order_num, "translationKey" 
       FROM parameters_system 
       WHERE "group" = 'user_roles' 
       ORDER BY (metadata->>'order')::int`
    )
    roles.forEach((_role: unknown) => {})

    // Vérifier si OWNER existe
    const hasOwner = roles.some((r: unknown) => (r as { key: string }).key === 'OWNER')
    if (hasOwner) {
    } else {
    }

    // Afficher les rôles manquants
    const expectedRoles = [
      'OWNER',
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'COMMERCIAL',
      'TECHNICIEN',
      'COMPTABLE',
      'OPERATEUR',
      'USER',
      'VIEWER',
    ]
    const existingKeys = roles.map((r: unknown) => (r as { key: string }).key)
    const missingRoles = expectedRoles.filter((role) => !existingKeys.includes(role))

    if (missingRoles.length > 0) {
    }
  } finally {
    await connection.close()
  }
}

checkParametersSystem().catch(console.error)
