import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

async function checkUserSocieteRolesStructure() {
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
    console.log('✅ Connecté à la base de données AUTH\n')

    // 1. Vérifier toutes les colonnes de user_societe_roles
    console.log('📊 Structure complète de user_societe_roles:')
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_societe_roles'
      ORDER BY ordinal_position
    `)

    columns.forEach((col: any) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`
      )
    })

    // 2. Vérifier le contenu de la table
    console.log('\n📋 Contenu de user_societe_roles:')
    const data = await dataSource.query(`
      SELECT * FROM user_societe_roles LIMIT 5
    `)

    if (data.length === 0) {
      console.log('   Table vide')
    } else {
      console.log(`   ${data.length} enregistrement(s):`)
      data.forEach((row: any) => {
        console.log('   ', JSON.stringify(row, null, 2))
      })
    }

    // 3. Vérifier les contraintes et index
    console.log('\n🔗 Contraintes et index:')
    const constraints = await dataSource.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'user_societe_roles'::regclass
    `)

    constraints.forEach((c: any) => {
      console.log(`   - ${c.constraint_name} (${c.constraint_type}): ${c.definition}`)
    })

    // 4. Essayer de joindre avec roles en utilisant différents noms de colonnes
    console.log('\n🧪 Test de jointures:')

    // Test 1: roleId
    try {
      const test1 = await dataSource.query(`
        SELECT COUNT(*) FROM user_societe_roles usr
        LEFT JOIN roles r ON usr."roleId" = r.id
      `)
      console.log('   ✅ Jointure avec "roleId" (camelCase avec quotes) fonctionne')
    } catch (e: any) {
      console.log('   ❌ Jointure avec "roleId" échoue:', e.message)
    }

    // Test 2: role_id
    try {
      const test2 = await dataSource.query(`
        SELECT COUNT(*) FROM user_societe_roles usr
        LEFT JOIN roles r ON usr.role_id = r.id
      `)
      console.log('   ✅ Jointure avec role_id (snake_case) fonctionne')
    } catch (e: any) {
      console.log('   ❌ Jointure avec role_id échoue:', e.message)
    }

    // Test 3: roleType
    try {
      const test3 = await dataSource.query(`
        SELECT COUNT(*) FROM user_societe_roles 
        WHERE role_type IS NOT NULL
      `)
      console.log('   ✅ Colonne role_type existe')
    } catch (e: any) {
      console.log("   ❌ Colonne role_type n'existe pas")
    }

    // 5. Afficher la requête correcte pour récupérer les rôles
    console.log('\n✨ Requête correcte pour user_societe_roles:')
    const correctQuery = await dataSource.query(`
      SELECT 
        usr.*,
        s.nom as societe_nom,
        s.code as societe_code
      FROM user_societe_roles usr
      LEFT JOIN societes s ON usr.societe_id = s.id
      WHERE usr.user_id = '0d2f2574-0ddf-4e50-ac45-58f7391367c8'
        AND usr.societe_id = '73416fa9-f693-42f6-99d3-7c919cefe4d5'
    `)

    if (correctQuery.length > 0) {
      console.log('   Résultat trouvé:', correctQuery[0])
    } else {
      console.log("   Aucun résultat trouvé pour l'utilisateur admin dans TopSteel")
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

checkUserSocieteRolesStructure().catch(console.error)
