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
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  })

  try {
    await dataSource.initialize()
    console.log('✅ Connecté à la base de données\n')

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
      console.log("❌ Aucun utilisateur trouvé avec l'email admin@topsteel.tech")

      // Lister tous les emails existants
      console.log('\n📧 Emails existants dans la base:')
      const allEmails = await dataSource.query(`
        SELECT email, role, actif FROM users ORDER BY email
      `)
      allEmails.forEach((u: any) => {
        console.log(`   - ${u.email} (${u.role}) - Actif: ${u.actif}`)
      })
    } else {
      const user = result[0]
      console.log('✅ Utilisateur trouvé:')
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Nom: ${user.nom} ${user.prenom}`)
      console.log(`   - Role: ${user.role}`)
      console.log(`   - Actif: ${user.actif}`)

      // Tester les mots de passe
      console.log('\n🔐 Test des mots de passe:')
      const passwords = ['TopSteel44!', 'admin123', 'Admin123!', 'admin', 'password']

      for (const pwd of passwords) {
        try {
          if (user.password) {
            const isValid = await bcrypt.compare(pwd, user.password)
            console.log(`   - "${pwd}": ${isValid ? '✅ VALIDE' : '❌ Invalide'}`)
          }
        } catch (err: any) {
          console.log(`   - "${pwd}": ❌ Erreur: ${err.message}`)
        }
      }

      // Afficher le début du hash
      console.log(`\n🔑 Hash stocké: ${user.password?.substring(0, 30)}...`)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkAdmin().catch(console.error)
