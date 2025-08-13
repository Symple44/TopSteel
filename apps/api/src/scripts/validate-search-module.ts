#!/usr/bin/env ts-node

/**
 * Script de validation du module de recherche globale
 * Vérifie que toutes les entités sont configurées correctement
 */

import { SEARCHABLE_ENTITIES, getAccessibleEntities, generateSearchQuery } from '../features/search/config/searchable-entities.config'

console.log('🔍 Validation du module de recherche globale TopSteel')
console.log('=' . repeat(60))

// 1. Vérifier la configuration des entités
console.log('\n📋 Entités configurées:')
SEARCHABLE_ENTITIES.forEach(entity => {
  const status = entity.enabled ? '✅' : '❌'
  const permission = entity.requiresPermission ? `[${entity.requiresPermission}]` : ''
  const roles = entity.requiresRole ? `[${entity.requiresRole.join(', ')}]` : ''
  
  console.log(`  ${status} ${entity.displayName} (${entity.type})`)
  console.log(`      DB: ${entity.database}, Priority: ${entity.priority}`)
  console.log(`      Champs primaires: ${entity.searchableFields.primary.map(f => f.name).join(', ')}`)
  console.log(`      URL: ${entity.urlPattern}`)
  
  if (permission || roles) {
    console.log(`      Sécurité: ${permission} ${roles}`)
  }
  console.log('')
})

// 2. Test de génération de requêtes SQL
console.log('\n🗄️ Test de génération de requêtes SQL:')

const testCases = [
  { type: 'client', searchTerm: 'Dupont' },
  { type: 'article', searchTerm: 'ACIER' },
  { type: 'menu', searchTerm: 'facture' }
]

testCases.forEach(({ type, searchTerm }) => {
  const entity = SEARCHABLE_ENTITIES.find(e => e.type === type)
  if (entity) {
    const { query, params } = generateSearchQuery(entity, searchTerm, 'tenant-123')
    console.log(`\n  ${entity.displayName} - Recherche: "${searchTerm}"`)
    console.log(`  Requête: ${query.replace(/\n\s+/g, ' ').trim()}`)
    console.log(`  Paramètres: [${params.map(p => `"${p}"`).join(', ')}]`)
  }
})

// 3. Test de filtrage par permissions/rôles
console.log('\n🔐 Test de filtrage de sécurité:')

const testPermissions = ['users.read', 'pricing.read']
const testRoles = ['admin', 'user']

const accessibleEntities = getAccessibleEntities(testPermissions, testRoles)

console.log(`\nUtilisateur avec permissions: [${testPermissions.join(', ')}]`)
console.log(`Rôles: [${testRoles.join(', ')}]`)
console.log(`\nEntités accessibles: ${accessibleEntities.length}/${SEARCHABLE_ENTITIES.filter(e => e.enabled).length}`)

accessibleEntities.forEach(entity => {
  console.log(`  ✅ ${entity.displayName}`)
})

const restrictedEntities = SEARCHABLE_ENTITIES.filter(e => 
  e.enabled && !accessibleEntities.includes(e)
)

if (restrictedEntities.length > 0) {
  console.log(`\nEntités restreintes:`)
  restrictedEntities.forEach(entity => {
    console.log(`  🔒 ${entity.displayName} - ${entity.requiresPermission || entity.requiresRole?.join(', ')}`)
  })
}

// 4. Statistiques finales
const enabledEntities = SEARCHABLE_ENTITIES.filter(e => e.enabled)
const entitiesByDatabase = {
  auth: enabledEntities.filter(e => e.database === 'auth').length,
  shared: enabledEntities.filter(e => e.database === 'shared').length,
  tenant: enabledEntities.filter(e => e.database === 'tenant').length
}

console.log('\n📊 Statistiques:')
console.log(`  Entités totales: ${SEARCHABLE_ENTITIES.length}`)
console.log(`  Entités activées: ${enabledEntities.length}`)
console.log(`  Base de données:`)
console.log(`    - Auth: ${entitiesByDatabase.auth}`)
console.log(`    - Shared: ${entitiesByDatabase.shared}`)
console.log(`    - Tenant: ${entitiesByDatabase.tenant}`)

console.log('\n✨ Validation terminée !')