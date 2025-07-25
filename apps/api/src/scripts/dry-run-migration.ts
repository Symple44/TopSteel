#!/usr/bin/env ts-node
/**
 * Simulation de la migration des menus (dry run)
 * Teste la logique de migration sans modifier la base de données
 */

interface MenuItemSimulation {
  id: string
  title: string
  href?: string
  parent_id?: string
}

function simulateMigration() {
  console.log('🧪 Simulation de la migration des types de menu...\n')

  // Données d'exemple représentant différents cas
  const testMenuItems: MenuItemSimulation[] = [
    { id: '1', title: 'Dashboard', href: '/dashboard' },
    { id: '2', title: 'Administration' },
    { id: '3', title: 'Users', href: '/admin/users', parent_id: '2' },
    { id: '4', title: 'Roles', href: '/admin/roles', parent_id: '2' },
    { id: '5', title: 'Settings', parent_id: '2' },
    { id: '6', title: 'Database', href: '/admin/settings/db', parent_id: '5' },
    { id: '7', title: 'Query Builder', href: '/query-builder' },
    { id: '8', title: 'Reports', href: '' },
    { id: '9', title: 'Monthly Report', href: '/reports/monthly', parent_id: '8' }
  ]

  console.log('📋 Données d\'entrée simulées:')
  testMenuItems.forEach(item => {
    console.log(`  ${item.id}: ${item.title} (href: ${item.href || 'null'}, parent: ${item.parent_id || 'null'})`)
  })

  console.log('\n🔄 Simulation des étapes de migration...\n')

  // Étape 1: Identifier les parents
  const parentIds = new Set(
    testMenuItems
      .filter(item => item.parent_id)
      .map(item => item.parent_id)
  )

  console.log('👨‍👩‍👧‍👦 IDs identifiés comme parents:', Array.from(parentIds))

  // Étape 2: Appliquer la logique de migration
  const migratedItems = testMenuItems.map(item => {
    let type: string
    let program_id: string | undefined = undefined
    let external_url: string | undefined = undefined
    let query_builder_id: string | undefined = undefined

    // Logique de la migration
    if (item.href && item.href.trim() !== '') {
      // Items avec href deviennent des programmes (P)
      type = 'P'
      program_id = item.href
    } else if (parentIds.has(item.id)) {
      // Items qui sont parents mais sans href deviennent des dossiers (M)
      type = 'M'
    } else {
      // Items sans href qui ne sont pas parents restent en type P par défaut
      type = 'P'
    }

    return {
      ...item,
      type,
      program_id,
      external_url,
      query_builder_id
    }
  })

  // Étape 3: Afficher les résultats
  console.log('\n📊 Résultats de la migration simulée:')
  
  let typeCounts = { M: 0, P: 0, L: 0, D: 0 }
  
  migratedItems.forEach(item => {
    const typeLabel = getTypeLabel(item.type)
    typeCounts[item.type as keyof typeof typeCounts]++
    
    console.log(`  ${getTypeEmoji(item.type)} ${item.title}`)
    console.log(`    • Type: ${item.type} (${typeLabel})`)
    if (item.program_id) {
      console.log(`    • program_id: ${item.program_id}`)
    }
    if (item.external_url) {
      console.log(`    • external_url: ${item.external_url}`)
    }
    if (item.query_builder_id) {
      console.log(`    • query_builder_id: ${item.query_builder_id}`)
    }
    console.log()
  })

  console.log('📈 Statistiques de migration:')
  console.log(`  📁 Dossiers (M): ${typeCounts.M}`)
  console.log(`  🔗 Programmes (P): ${typeCounts.P}`)
  console.log(`  🌐 Liens externes (L): ${typeCounts.L}`)
  console.log(`  📊 Vues Data (D): ${typeCounts.D}`)

  // Validation
  console.log('\n✅ Tests de validation:')
  
  // Test 1: Tous les éléments ont un type
  const itemsWithoutType = migratedItems.filter(item => !item.type)
  console.log(`  • Éléments sans type: ${itemsWithoutType.length} (devrait être 0)`)
  
  // Test 2: Les dossiers n'ont pas d'URL
  const foldersWithUrl = migratedItems.filter(item => 
    item.type === 'M' && (item.program_id || item.external_url || item.query_builder_id)
  )
  console.log(`  • Dossiers avec URL: ${foldersWithUrl.length} (devrait être 0)`)
  
  // Test 3: Les programmes avec href ont program_id
  const programsWithHref = migratedItems.filter(item => 
    item.type === 'P' && item.href && !item.program_id
  )
  console.log(`  • Programmes avec href mais sans program_id: ${programsWithHref.length} (devrait être 0)`)

  console.log('\n🎉 Simulation terminée!')
  console.log('   Cette logique sera appliquée lors de la vraie migration.')
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'M': return 'Dossier'
    case 'P': return 'Programme'
    case 'L': return 'Lien externe'
    case 'D': return 'Vue Data'
    default: return 'Inconnu'
  }
}

function getTypeEmoji(type: string): string {
  switch (type) {
    case 'M': return '📁'
    case 'P': return '🔗'
    case 'L': return '🌐'
    case 'D': return '📊'
    default: return '❓'
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  simulateMigration()
}

export { simulateMigration }