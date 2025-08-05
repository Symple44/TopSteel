import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function debugLoginSocieteError() {
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  })

  try {
    await authDataSource.initialize()
    console.log('✅ Connecté à la base de données AUTH\n')

    // 1. Vérifier l'utilisateur admin
    console.log("1️⃣ Vérification de l'utilisateur admin...")
    const users = await authDataSource.query(`
      SELECT id, email, role, actif, nom, prenom
      FROM users 
      WHERE email = 'admin@topsteel.tech'
    `)

    if (users.length === 0) {
      console.log('❌ Utilisateur admin non trouvé!')
      return
    }

    const adminUser = users[0]
    console.log('✅ Utilisateur trouvé:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      actif: adminUser.actif,
    })

    // 2. Vérifier les sociétés disponibles
    console.log('\n2️⃣ Vérification des sociétés...')
    const societes = await authDataSource.query(`
      SELECT id, nom, code, status, deleted_at
      FROM societes
      WHERE deleted_at IS NULL
    `)

    console.log(`✅ ${societes.length} société(s) trouvée(s):`)
    societes.forEach((s: any) => {
      console.log(`   - ${s.nom} (${s.code}) - ID: ${s.id} - Status: ${s.status}`)
    })

    if (societes.length === 0) {
      console.log('⚠️  Aucune société active trouvée!')
      return
    }

    const firstSociete = societes[0]

    // 3. Vérifier les rôles user-société
    console.log('\n3️⃣ Vérification des rôles user-société...')
    const userSocieteRoles = await authDataSource.query(
      `
      SELECT usr.*, r.name as role_name
      FROM user_societe_roles usr
      LEFT JOIN roles r ON usr.role_id = r.id
      WHERE usr.user_id = $1 AND usr.societe_id = $2
    `,
      [adminUser.id, firstSociete.id]
    )

    if (userSocieteRoles.length === 0) {
      console.log('⚠️  Aucun rôle user-société trouvé pour cet utilisateur')

      // Pour SUPER_ADMIN, c'est normal de ne pas avoir de rôle explicite
      if (adminUser.role === 'SUPER_ADMIN') {
        console.log("✅ C'est normal pour un SUPER_ADMIN - accès virtuel OWNER")
      }
    } else {
      console.log('✅ Rôle user-société trouvé:')
      userSocieteRoles.forEach((r: any) => {
        console.log(`   - Role: ${r.role_type || r.role_name}`)
        console.log(`   - Active: ${r.is_active}`)
        console.log(`   - Default: ${r.is_default_societe}`)
      })
    }

    // 4. Vérifier la structure des tables
    console.log('\n4️⃣ Vérification de la structure des tables...')

    // Vérifier les colonnes de user_societe_roles
    const usrColumns = await authDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_societe_roles'
      ORDER BY ordinal_position
    `)

    console.log('📊 Structure de user_societe_roles:')
    const requiredColumns = ['user_id', 'societe_id', 'role_type', 'is_active', 'deleted_at']
    requiredColumns.forEach((col) => {
      const found = usrColumns.find((c: any) => c.column_name === col)
      if (found) {
        console.log(`   ✅ ${col}: ${found.data_type}`)
      } else {
        console.log(`   ❌ ${col}: MANQUANTE`)
      }
    })

    // 5. Tester une requête similaire à celle du service
    console.log('\n5️⃣ Test de requête TypeORM simulée...')
    try {
      const testQuery = await authDataSource.query(
        `
        SELECT 
          usr.*,
          s.id as societe_id,
          s.nom as societe_nom,
          s.code as societe_code,
          r.id as role_id,
          r.name as role_name
        FROM user_societe_roles usr
        LEFT JOIN societes s ON usr.societe_id = s.id
        LEFT JOIN roles r ON usr.role_id = r.id
        WHERE usr.user_id = $1 
          AND usr.societe_id = $2
          AND usr.is_active = true
          AND (usr.deleted_at IS NULL)
          AND (s.deleted_at IS NULL)
          AND (r.deleted_at IS NULL OR r.deleted_at IS NULL)
      `,
        [adminUser.id, firstSociete.id]
      )

      if (testQuery.length === 0) {
        console.log('⚠️  Aucun résultat avec toutes les jointures')
      } else {
        console.log('✅ Requête avec jointures réussie')
      }
    } catch (error: any) {
      console.log('❌ Erreur dans la requête:', error.message)
    }

    // 6. Vérifier la table roles
    console.log('\n6️⃣ Vérification de la table roles...')
    const roles = await authDataSource.query(`
      SELECT id, name, type, deleted_at
      FROM roles
      WHERE deleted_at IS NULL
    `)

    console.log(`✅ ${roles.length} rôle(s) trouvé(s):`)
    roles.forEach((r: any) => {
      console.log(`   - ${r.name} (${r.type || 'N/A'}) - ID: ${r.id}`)
    })

    console.log('\n🔍 Diagnostic terminé!')
    console.log("\n💡 Causes possibles de l'erreur 500:")
    console.log('   1. Problème de jointure avec des tables ayant deleted_at')
    console.log('   2. Colonnes manquantes dans user_societe_roles')
    console.log('   3. Problème de relations TypeORM non chargées')
    console.log('   4. Erreur dans le service UnifiedRolesService')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await authDataSource.destroy()
  }
}

debugLoginSocieteError().catch(console.error)
