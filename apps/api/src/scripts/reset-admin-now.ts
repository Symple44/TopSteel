import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
dotenv.config({ path: '.env' })

async function resetAdminPassword() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_AUTH_HOST || 'localhost',
    port: parseInt(process.env.DB_AUTH_PORT || '5432', 10),
    username: process.env.DB_AUTH_USERNAME || 'postgres',
    password: process.env.DB_AUTH_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'topsteel_auth',
  })

  try {
    console.log('🔌 Connexion à la base de données...')
    await dataSource.initialize()
    console.log('✅ Connecté!')

    const newPassword = 'TopSteel44!'
    const email = 'admin@topsteel.tech'

    console.log(`📧 Réinitialisation du mot de passe pour ${email}...`)

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Vérifier si l'utilisateur existe
    const checkUser = await dataSource.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    )

    if (checkUser.length === 0) {
      console.log('❌ Utilisateur non trouvé. Création d\'un nouvel admin...')

      // Créer l'utilisateur admin
      await dataSource.query(
        `INSERT INTO users (nom, prenom, email, password, role, actif, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        ['Admin', 'System', email, hashedPassword, 'SUPER_ADMIN', true]
      )

      console.log('✅ Utilisateur admin créé avec succès!')
    } else {
      console.log('✅ Utilisateur trouvé:', checkUser[0])

      // Mettre à jour le mot de passe
      const result = await dataSource.query(
        `UPDATE users
         SET password = $1, actif = true, updated_at = CURRENT_TIMESTAMP
         WHERE email = $2
         RETURNING id, email, role`,
        [hashedPassword, email]
      )

      console.log('✅ Mot de passe réinitialisé avec succès!')
      console.log('📊 Utilisateur mis à jour:', result[0])
    }

    // Vérifier que ça fonctionne
    const verify = await dataSource.query(
      'SELECT password FROM users WHERE email = $1',
      [email]
    )

    const isValid = await bcrypt.compare(newPassword, verify[0].password)

    if (isValid) {
      console.log('✅ Vérification: Le mot de passe fonctionne correctement!')
      console.log('\n📝 Identifiants de connexion:')
      console.log('   Email:', email)
      console.log('   Mot de passe:', newPassword)
    } else {
      console.log('❌ Erreur: Le mot de passe ne correspond pas!')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
      console.log('\n🔌 Déconnexion de la base de données')
    }
  }
}

resetAdminPassword().catch(console.error)
