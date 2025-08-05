import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkAllAdmins() {
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

    // Rechercher tous les admins
    console.log('🔍 Recherche de tous les comptes administrateurs...\n')

    const admins = await dataSource.query(`
      SELECT id, email, role, actif, nom, prenom, created_at, updated_at
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
         OR LOWER(email) LIKE '%admin%'
         OR LOWER(email) LIKE '%topsteel.tech%'
      ORDER BY role, email
    `)

    if (admins.length === 0) {
      console.log('❌ Aucun compte administrateur trouvé')
    } else {
      console.log(`📊 ${admins.length} compte(s) trouvé(s):\n`)

      admins.forEach((admin: any, index: number) => {
        console.log(`${index + 1}. ${admin.email}`)
        console.log(`   - ID: ${admin.id}`)
        console.log(`   - Nom: ${admin.nom} ${admin.prenom}`)
        console.log(`   - Role: ${admin.role}`)
        console.log(`   - Actif: ${admin.actif}`)
        console.log(`   - Créé le: ${new Date(admin.created_at).toLocaleDateString('fr-FR')}`)
        console.log(`   - Modifié le: ${new Date(admin.updated_at).toLocaleDateString('fr-FR')}`)
        console.log('')
      })
    }

    // Vérifier s'il y a des variations de l'email admin
    console.log("🔍 Recherche de variations possibles de l'email admin@topsteel.tech:\n")

    const variations = await dataSource.query(
      `
      SELECT email, role 
      FROM users 
      WHERE LOWER(REPLACE(email, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
    `,
      ['admin@topsteel.tech']
    )

    if (variations.length > 0) {
      variations.forEach((v: any) => {
        console.log(`   - "${v.email}" (${v.role})`)
      })
    } else {
      console.log('   Aucune variation trouvée')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkAllAdmins().catch(console.error)
