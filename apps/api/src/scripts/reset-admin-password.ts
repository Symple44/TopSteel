import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
dotenv.config({ path: '.env' })

async function resetAdminPassword() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  })

  try {
    await dataSource.initialize()

    // Récupérer le mot de passe depuis les arguments ou l'environnement
    const newPassword = process.argv[3] || process.env.RESET_PASSWORD

    if (!newPassword || newPassword.length < 8) {
      console.error('❌ Password must be provided and at least 8 characters')
      console.log('Usage: npm run reset-password <email> <new-password>')
      console.log('Or set RESET_PASSWORD environment variable')
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const result = await dataSource.query(
      `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING id, email
    `,
      [hashedPassword, 'admin@topsteel.tech']
    )

    if (result.length > 0) {
      // Vérifier que ça fonctionne
      const checkResult = await dataSource.query(
        `
        SELECT password FROM users WHERE email = $1
      `,
        ['admin@topsteel.tech']
      )

      await bcrypt.compare(newPassword, checkResult[0].password)
    } else {
    }
  } catch {
  } finally {
    await dataSource.destroy()
  }
}

setTimeout(() => {
  resetAdminPassword().catch(console.error)
}, 5000)
