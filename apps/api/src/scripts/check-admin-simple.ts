import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
dotenv.config({ path: '.env' })

async function checkAdmin() {
  // Configuration directe de la connexion
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  })

  try {
    await dataSource.initialize()

    // Vérifier l'utilisateur admin
    const result = await dataSource.query(
      `
      SELECT id, email, password, role, actif, nom, prenom
      FROM users 
      WHERE email = $1
    `,
      ['admin@topsteel.tech']
    )

    if (result.length === 0) {
      await dataSource.query(`
        SELECT email, role, actif FROM users ORDER BY email
      `)
      // Available emails found
    } else {
      const user = result[0]
      const passwords = ['TopSteel44!', 'admin123', 'Admin123!', 'admin', 'password']

      for (const pwd of passwords) {
        try {
          if (user.password) {
            await bcrypt.compare(pwd, user.password)
          }
        } catch {
          // Ignore password comparison errors
        }
      }
    }
  } catch {
    // Ignore database connection errors
  } finally {
    await dataSource.destroy()
  }
}

checkAdmin().catch(console.error)
