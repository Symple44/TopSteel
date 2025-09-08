import { createConnection } from 'typeorm'

async function addOwnerRole() {
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
    // Vérifier si OWNER existe déjà
    const existing = await connection.query(
      `SELECT * FROM parameters_system WHERE "group" = 'user_roles' AND key = 'OWNER'`
    )

    if (existing.length > 0) {
      return
    }

    // Ajouter le rôle OWNER
    await connection.query(`
      INSERT INTO parameters_system (
        id,
        "group",
        key,
        value,
        type,
        scope,
        description,
        "translationKey",
        "isReadonly",
        metadata,
        "isActive",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        'user_roles',
        'OWNER',
        'Propriétaire',
        'ENUM',
        'AUTH',
        'Propriétaire de la société - Accès complet',
        'roles.owner',
        true,
        '{"icon": "🏛️", "color": "destructive", "order": 1, "category": "administration", "permissions": ["*"]}'::jsonb,
        true,
        NOW(),
        NOW()
      )
    `)

    // Mettre à jour l'ordre de SUPER_ADMIN
    await connection.query(`
      UPDATE parameters_system 
      SET metadata = jsonb_set(metadata, '{order}', '2'::jsonb)
      WHERE "group" = 'user_roles' AND key = 'SUPER_ADMIN'
    `)

    // Afficher tous les rôles
    const _allRoles = await connection.query(
      `SELECT key, value, metadata->>'icon' as icon, metadata->>'order' as order_num 
       FROM parameters_system 
       WHERE "group" = 'user_roles' 
       ORDER BY (metadata->>'order')::int`
    )
    // All roles checked
  } finally {
    await connection.close()
  }
}

addOwnerRole().catch(console.error)
