import { DataSource } from 'typeorm'
import { ParameterSystem } from '../modules/parameters/entities/parameter-system.entity'

/**
 * Script pour mettre à jour les paramètres existants avec les clés de traduction
 */
export async function updateExistingParametersWithTranslationKeys(dataSource: DataSource) {
  const systemRepo = dataSource.getRepository(ParameterSystem)

  console.log('🔄 Mise à jour des paramètres existants avec les clés de traduction...')

  // Mapping des rôles vers leurs clés de traduction
  const roleTranslationKeys = {
    'SUPER_ADMIN': 'roles.super_admin',
    'ADMIN': 'roles.admin', 
    'MANAGER': 'roles.manager',
    'COMMERCIAL': 'roles.commercial',
    'TECHNICIEN': 'roles.technician',
    'COMPTABLE': 'roles.accountant',
    'OPERATEUR': 'roles.operator',
    'USER': 'roles.user',
    'VIEWER': 'roles.viewer'
  }

  // Mettre à jour les rôles existants
  for (const [roleKey, translationKey] of Object.entries(roleTranslationKeys)) {
    const existingRole = await systemRepo.findOne({
      where: { group: 'user_roles', key: roleKey }
    })

    if (existingRole) {
      existingRole.translationKey = translationKey
      await systemRepo.save(existingRole)
      console.log(`✅ Rôle ${roleKey} mis à jour avec translationKey: ${translationKey}`)
    } else {
      console.log(`⚠️ Rôle ${roleKey} non trouvé`)
    }
  }

  // Mapping des statuts vers leurs clés de traduction
  const statusTranslationKeys = {
    'ACTIVE': 'status.active',
    'INACTIVE': 'status.inactive',
    'PENDING': 'status.pending'
  }

  // Mettre à jour les statuts existants
  for (const [statusKey, translationKey] of Object.entries(statusTranslationKeys)) {
    const existingStatus = await systemRepo.findOne({
      where: { group: 'system_statuses', key: statusKey }
    })

    if (existingStatus) {
      existingStatus.translationKey = translationKey
      await systemRepo.save(existingStatus)
      console.log(`✅ Statut ${statusKey} mis à jour avec translationKey: ${translationKey}`)
    } else {
      console.log(`⚠️ Statut ${statusKey} non trouvé`)
    }
  }

  // Autres paramètres système
  const otherTranslationKeys = {
    'system_modules.AVAILABLE_MODULES': 'system.modules.available',
    'system_permissions.DEFAULT_PERMISSIONS': 'system.permissions.default'
  }

  for (const [key, translationKey] of Object.entries(otherTranslationKeys)) {
    const [group, paramKey] = key.split('.')
    const existingParam = await systemRepo.findOne({
      where: { group, key: paramKey }
    })

    if (existingParam) {
      existingParam.translationKey = translationKey
      await systemRepo.save(existingParam)
      console.log(`✅ Paramètre ${group}.${paramKey} mis à jour avec translationKey: ${translationKey}`)
    } else {
      console.log(`⚠️ Paramètre ${group}.${paramKey} non trouvé`)
    }
  }

  console.log('✅ Mise à jour des paramètres existants terminée')
}

// Exécution directe si appelé en tant de script
if (require.main === module) {
  import('../database/data-source-auth').then(async (module) => {
    const dataSource = module.default
    try {
      await dataSource.initialize()
      await updateExistingParametersWithTranslationKeys(dataSource)
      await dataSource.destroy()
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    } catch (error) {
      console.error('❌ Erreur:', error)
      process.exit(1)
    }
  })
}