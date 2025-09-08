import { resolve } from 'node:path'
import * as bcrypt from 'bcrypt'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../../../../.env') })

const testUser = {
  email: 'test@topsteel.com',
  password: 'test123',
  nom: 'Test',
  prenom: 'User',
  role: 'ADMIN',
}

async function createTestUser() {
  // Créer une connexion directe à la base de données AUTH
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    synchronize: false,
    logging: false,
  })

  try {
    await dataSource.initialize()

    // Vérifier la structure de la table users
    const columns = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await dataSource.query('SELECT id, email FROM users WHERE email = $1', [
      testUser.email,
    ])

    if (existingUser.length > 0) {
      // Mettre à jour le mot de passe
      const hashedPassword = await bcrypt.hash(testUser.password, 10)
      await dataSource.query('UPDATE users SET password = $1 WHERE email = $2', [
        hashedPassword,
        testUser.email,
      ])

      // Vérifier les sociétés associées
      const userCompanies = await dataSource.query(
        `
        SELECT 
          usr.id,
          usr."userId",
          usr."societeId",
          usr."roleType",
          usr."isDefaultSociete",
          s.nom as societe_nom,
          s.code as societe_code
        FROM user_societe_roles usr
        LEFT JOIN societes s ON s.id = usr."societeId"
        WHERE usr."userId" = $1
      `,
        [existingUser[0].id]
      )

      // Si l'utilisateur n'a pas de société, en attribuer une
      if (userCompanies.length === 0) {
        const companies = await dataSource.query('SELECT id, nom, code FROM societes LIMIT 5')

        if (companies.length > 0) {
          // Attribuer la première société
          const companyId = companies[0].id
          await dataSource.query(
            `
            INSERT INTO user_societe_roles ("userId", "societeId", "roleType", "isDefaultSociete", "isActive")
            VALUES ($1, $2, $3, $4, $5)
          `,
            [existingUser[0].id, companyId, 'ADMIN', true, true]
          )
        }
      }
    } else {
      // Créer un nouvel utilisateur
      const hashedPassword = await bcrypt.hash(testUser.password, 10)
      // Vérifier quelles colonnes existent réellement
      const hasIsActive = columns.some(
        (col: unknown) => (col as { column_name: string }).column_name === 'isActive'
      )
      const hasActif = columns.some(
        (col: unknown) => (col as { column_name: string }).column_name === 'actif'
      )

      let insertQuery = ''
      let insertParams: unknown[] = []

      if (hasIsActive) {
        insertQuery = `
          INSERT INTO users (email, password, nom, prenom, role, "isActive")
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, email
        `
        insertParams = [
          testUser.email,
          hashedPassword,
          testUser.nom,
          testUser.prenom,
          testUser.role,
          true,
        ]
      } else if (hasActif) {
        insertQuery = `
          INSERT INTO users (email, password, nom, prenom, role, actif)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, email
        `
        insertParams = [
          testUser.email,
          hashedPassword,
          testUser.nom,
          testUser.prenom,
          testUser.role,
          true,
        ]
      } else {
        insertQuery = `
          INSERT INTO users (email, password, nom, prenom, role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email
        `
        insertParams = [
          testUser.email,
          hashedPassword,
          testUser.nom,
          testUser.prenom,
          testUser.role,
        ]
      }

      const newUser = await dataSource.query(insertQuery, insertParams)

      // Attribuer une société
      const companies = await dataSource.query('SELECT id, nom, code FROM societes LIMIT 1')
      if (companies.length > 0) {
        await dataSource.query(
          `
          INSERT INTO user_societe_roles ("userId", "societeId", "roleType", "isDefaultSociete", "isActive")
          VALUES ($1, $2, $3, $4, $5)
        `,
          [newUser[0].id, companies[0].id, 'ADMIN', true, true]
        )
      }
    }
    const hasIsActive = columns.some(
      (col: unknown) => (col as { column_name: string }).column_name === 'isActive'
    )
    const hasActif = columns.some(
      (col: unknown) => (col as { column_name: string }).column_name === 'actif'
    )

    let selectQuery = ''
    if (hasIsActive) {
      selectQuery = `
        SELECT 
          u.id,
          u.email,
          u.nom,
          u.prenom,
          u.role,
          u."isActive" as is_active,
          COUNT(usr.id) as company_count
        FROM users u
        LEFT JOIN user_societe_roles usr ON usr."userId" = u.id
        GROUP BY u.id, u.email, u.nom, u.prenom, u.role, u."isActive"
        ORDER BY u.email
      `
    } else if (hasActif) {
      selectQuery = `
        SELECT 
          u.id,
          u.email,
          u.nom,
          u.prenom,
          u.role,
          u.actif as is_active,
          COUNT(usr.id) as company_count
        FROM users u
        LEFT JOIN user_societe_roles usr ON usr."userId" = u.id
        GROUP BY u.id, u.email, u.nom, u.prenom, u.role, u.actif
        ORDER BY u.email
      `
    } else {
      selectQuery = `
        SELECT 
          u.id,
          u.email,
          u.nom,
          u.prenom,
          u.role,
          true as is_active,
          COUNT(usr.id) as company_count
        FROM users u
        LEFT JOIN user_societe_roles usr ON usr."userId" = u.id
        GROUP BY u.id, u.email, u.nom, u.prenom, u.role
        ORDER BY u.email
      `
    }

    const _allUsers = await dataSource.query(selectQuery)
  } catch (_error: unknown) {
  } finally {
    await dataSource.destroy()
  }
}

// Run the script
createTestUser().catch(console.error)
