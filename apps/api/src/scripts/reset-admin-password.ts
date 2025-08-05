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
    console.log('✅ Connecté à la base de données\n')

    const newPassword = 'TopSteel44!'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log('🔐 Réinitialisation du mot de passe admin...')

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
      console.log(`✅ Mot de passe réinitialisé pour ${result[0].email}`)
      console.log(`   - Nouveau mot de passe: ${newPassword}`)

      // Vérifier que ça fonctionne
      const checkResult = await dataSource.query(
        `
        SELECT password FROM users WHERE email = $1
      `,
        ['admin@topsteel.tech']
      )

      const isValid = await bcrypt.compare(newPassword, checkResult[0].password)
      console.log(`   - Vérification: ${isValid ? '✅ OK' : '❌ Erreur'}`)
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet email')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

// Demander confirmation
console.log('⚠️  ATTENTION: Ce script va réinitialiser le mot de passe admin!')
console.log('   Email: admin@topsteel.tech')
console.log('   Nouveau mot de passe: TopSteel44!')
console.log('\nAppuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...')

setTimeout(() => {
  resetAdminPassword().catch(console.error)
}, 5000)
