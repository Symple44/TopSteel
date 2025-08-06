import { join } from 'node:path'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config({ path: join(__dirname, '../../.env') })

async function fixTopSteelCompany() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_auth',
    logging: true,
  })

  try {
    await dataSource.initialize()

    // Chercher l'utilisateur admin
    const adminUser = await dataSource.query(`
      SELECT id, email, nom, prenom FROM users 
      WHERE email = 'admin@topsteel.tech'
    `)

    if (adminUser.length === 0) {
      return
    }

    // Vérifier les sociétés existantes
    const societes = await dataSource.query(`
      SELECT id, nom, code FROM societes
    `)

    // Chercher la société TopSteel ou la première société
    let topsteelSociete = societes.find((s: unknown) => {
      const sTyped = s as { nom: string; code: string }
      return sTyped.nom.toLowerCase().includes('topsteel') || sTyped.code === 'TOPSTEEL'
    })

    if (!topsteelSociete && societes.length > 0) {
      // Si pas de société TopSteel, mettre à jour la première société
      topsteelSociete = societes[0]
      await dataSource.query(
        `
        UPDATE societes 
        SET nom = 'TopSteel SAS', 
            code = 'TOPSTEEL',
            updated_at = NOW()
        WHERE id = $1
      `,
        [(topsteelSociete as { id: string }).id]
      )
    }

    // Vérifier la relation user_societe_roles
    const userRoles = await dataSource.query(
      `
      SELECT * FROM user_societe_roles 
      WHERE "userId" = $1
    `,
      [adminUser[0].id]
    )

    if (userRoles.length === 0 && topsteelSociete) {
      // Créer la relation si elle n'existe pas
      await dataSource.query(
        `
        INSERT INTO user_societe_roles ("userId", "societeId", role, "isDefault", "isActive")
        VALUES ($1, $2, 'SUPER_ADMIN', true, true)
      `,
        [adminUser[0].id, (topsteelSociete as { id: string }).id]
      )
    }

    // Vérifier le résultat final
    await dataSource.query(
      `
      SELECT 
        s.id,
        s.nom,
        s.code,
        usr.role,
        usr."isDefault"
      FROM societes s
      JOIN user_societe_roles usr ON usr."societeId" = s.id
      WHERE usr."userId" = $1
    `,
      [adminUser[0].id]
    )
  } catch (_error: unknown) {
  } finally {
    await dataSource.destroy()
  }
}

fixTopSteelCompany()
