/**
 * Test direct de recherche PostgreSQL sans NestJS
 */

import { DataSource } from 'typeorm'

async function testDirectPostgreSQLSearch() {
  console.log('🔍 Test direct de recherche PostgreSQL...')

  // Connexion à la base tenant
  const tenantDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel_topsteel',
    synchronize: false,
  })

  try {
    await tenantDataSource.initialize()
    console.log('✅ Connecté à la base de données')

    // Test 1: Recherche d'articles avec "IPE"
    console.log('\n🔎 Recherche d\'articles contenant "IPE"')

    const query = `
      SELECT 
        id,
        designation,
        reference,
        description,
        societe_id
      FROM articles
      WHERE 
        (
          designation ILIKE $1 OR
          reference ILIKE $1 OR
          description ILIKE $1
        )
        AND societe_id = $2
      LIMIT 10
    `

    const searchTerm = '%IPE%'
    const tenantId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'

    const results = await tenantDataSource.query(query, [searchTerm, tenantId])

    console.log(`Résultats trouvés: ${results.length}`)

    if (results.length > 0) {
      console.log('\nPremiers résultats:')
      results.slice(0, 5).forEach((r: any) => {
        console.log(`  - ${r.designation || r.reference}`)
        console.log(`    Reference: ${r.reference}`)
        console.log(`    Société: ${r.societe_id}`)
      })
    }

    // Test 2: Compter tous les articles de cette société
    console.log('\n📊 Statistiques pour la société')
    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles
      WHERE societe_id = $1
    `

    const countResult = await tenantDataSource.query(countQuery, [tenantId])
    console.log(`Total d'articles pour cette société: ${countResult[0].total}`)

    // Test 3: Recherche plus précise "IPE 300"
    console.log('\n🔎 Recherche d\'articles "IPE 300"')

    const preciseQuery = `
      SELECT 
        id,
        designation,
        reference,
        description,
        societe_id
      FROM articles
      WHERE 
        (
          designation ILIKE $1 OR
          reference ILIKE $1 OR
          description ILIKE $1 OR
          designation ILIKE $2 OR
          reference ILIKE $2
        )
        AND societe_id = $3
      LIMIT 10
    `

    const preciseResults = await tenantDataSource.query(preciseQuery, [
      '%IPE 300%',
      '%IPE%300%',
      tenantId,
    ])

    console.log(`Résultats trouvés: ${preciseResults.length}`)

    if (preciseResults.length > 0) {
      console.log('\nRésultats:')
      preciseResults.forEach((r: any) => {
        console.log(`  - ${r.designation || r.reference}`)
        if (r.description) {
          console.log(`    Description: ${r.description.substring(0, 50)}...`)
        }
      })
    }

    // Test 4: Vérifier la structure de la table
    console.log('\n📋 Vérification de la structure de la table articles')
    const schemaQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'articles' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
      LIMIT 10
    `

    const schema = await tenantDataSource.query(schemaQuery)
    console.log('Colonnes principales:')
    schema.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    await tenantDataSource.destroy()
    console.log('\n✅ Test terminé')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    await tenantDataSource.destroy()
    process.exit(1)
  }
}

testDirectPostgreSQLSearch()
