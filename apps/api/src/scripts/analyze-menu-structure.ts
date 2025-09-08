/**
 * Script pour analyser la structure des menus et comprendre l'architecture de l'application
 */

import { DataSource } from 'typeorm'

async function analyzeMenuStructure() {
  console.log('🔍 Analyse de la structure des menus...\n')

  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'erp_topsteel_auth',
    synchronize: false,
  })

  try {
    await authDataSource.initialize()
    console.log('✅ Connecté à la base auth\n')

    // 1. Récupérer tous les menus actifs
    console.log('📋 STRUCTURE DES MENUS PRINCIPAUX:')
    console.log('='.repeat(50))

    const menus = await authDataSource.query(`
      SELECT 
        id,
        title,
        "programId",
        icon,
        type,
        "parentId",
        "order",
        route,
        component,
        permissions
      FROM menu_items
      WHERE "parentId" IS NULL
      ORDER BY "order"
    `)

    for (const menu of menus) {
      console.log(`\n📁 ${menu.title}`)
      console.log(`   ID: ${menu.programId}`)
      console.log(`   Route: ${menu.route || 'N/A'}`)
      console.log(`   Type: ${menu.type}`)
      console.log(`   Icon: ${menu.icon || 'N/A'}`)

      // Récupérer les sous-menus
      const subMenus = await authDataSource.query(
        `
        SELECT 
          title,
          "programId",
          route,
          type
        FROM menu_items
        WHERE "parentId" = $1
        ORDER BY "order"
      `,
        [menu.id]
      )

      if (subMenus.length > 0) {
        console.log('   Sous-menus:')
        for (const sub of subMenus) {
          console.log(`     - ${sub.title} (${sub.programId})`)
          console.log(`       Route: ${sub.route || 'N/A'}`)
        }
      }
    }

    // 2. Analyser les routes spécifiques pour les entités business
    console.log('\n\n📊 ROUTES BUSINESS DISPONIBLES:')
    console.log('='.repeat(50))

    const businessRoutes = await authDataSource.query(`
      SELECT DISTINCT
        "programId",
        title,
        route
      FROM menu_items
      WHERE route IS NOT NULL
        AND (
          route LIKE '%article%'
          OR route LIKE '%partner%'
          OR route LIKE '%client%'
          OR route LIKE '%fournisseur%'
          OR route LIKE '%material%'
          OR route LIKE '%projet%'
          OR route LIKE '%devis%'
          OR route LIKE '%facture%'
          OR route LIKE '%commande%'
          OR route LIKE '%stock%'
          OR route LIKE '%inventory%'
        )
      ORDER BY route
    `)

    if (businessRoutes.length > 0) {
      for (const route of businessRoutes) {
        console.log(`\n${route.title}:`)
        console.log(`  ProgramID: ${route.programId}`)
        console.log(`  Route: ${route.route}`)
      }
    } else {
      console.log('\n⚠️ Aucune route business trouvée dans les menus')
    }

    // 3. Analyser toutes les routes disponibles
    console.log('\n\n📍 TOUTES LES ROUTES DISPONIBLES:')
    console.log('='.repeat(50))

    const allRoutes = await authDataSource.query(`
      SELECT 
        title,
        "programId",
        route,
        type
      FROM menu_items
      WHERE route IS NOT NULL
        AND route != ''
      ORDER BY route
    `)

    const routesByCategory = new Map<string, any[]>()

    for (const item of allRoutes) {
      const category = item.route.split('/')[1] || 'root'
      if (!routesByCategory.has(category)) {
        routesByCategory.set(category, [])
      }
      routesByCategory.get(category)?.push(item)
    }

    for (const [category, items] of routesByCategory) {
      console.log(`\n/${category}/*:`)
      for (const item of items) {
        console.log(`  - ${item.route} => ${item.title} (${item.programId})`)
      }
    }

    // 4. Suggestion de mapping pour les entités de recherche
    console.log('\n\n💡 SUGGESTIONS DE MAPPING POUR LA RECHERCHE:')
    console.log('='.repeat(50))

    const suggestions = [
      { entity: 'article', suggested: 'À créer dans /inventory ou /stock' },
      { entity: 'client', suggested: '/partners (avec filtre type=CLIENT)' },
      { entity: 'fournisseur', suggested: '/partners (avec filtre type=SUPPLIER)' },
      { entity: 'material', suggested: 'À créer dans /materials ou /stock' },
      { entity: 'projet', suggested: 'À créer dans /projects' },
      { entity: 'devis', suggested: 'À créer dans /quotes ou /sales' },
      { entity: 'facture', suggested: 'À créer dans /invoices ou /billing' },
      { entity: 'commande', suggested: 'À créer dans /orders ou /sales' },
    ]

    for (const suggestion of suggestions) {
      console.log(`\n${suggestion.entity}:`)
      console.log(`  Suggestion: ${suggestion.suggested}`)
    }

    await authDataSource.destroy()
    console.log('\n\n✅ Analyse terminée')
  } catch (error) {
    console.error('❌ Erreur:', error)
    await authDataSource.destroy()
  }

  process.exit(0)
}

analyzeMenuStructure()
