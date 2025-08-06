#!/usr/bin/env ts-node

/**
 * Script de migration des paramètres système vers la base AUTH
 * TopSteel ERP - Clean Architecture
 *
 * Problème identifié :
 * - Les paramètres système sont dans system_settings (base tenant)
 * - Ils devraient être dans parameters_system (base auth)
 *
 * Usage: npm run migrate:settings-to-auth
 */

import * as readline from 'node:readline'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

interface SystemSetting {
  id: string
  category: string
  key: string
  value: unknown
  label?: string
  description?: string
  type: string
  is_active: boolean
  metadata?: unknown
  created_at: Date
  updated_at: Date
}

interface ParameterSystem {
  group: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT' | 'ENUM'
  scope: 'SYSTEM' | 'TENANT' | 'USER'
  description?: string
  metadata?: unknown
  arrayValues?: unknown
  objectValues?: unknown
  isActive: boolean
  isReadonly: boolean
  defaultLanguage: string
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function migrateSystemSettingsToAuth() {
  // Connexion base tenant (source)
  const tenantDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel',
    logging: false,
  })

  // Connexion base auth (destination)
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    logging: false,
  })

  try {
    await tenantDataSource.initialize()
    await authDataSource.initialize()

    // Vérifier l'existence de system_settings dans tenant
    const settingsExist = await tenantDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      )
    `)

    if (!settingsExist[0].exists) {
      return
    }

    // Récupérer les paramètres existants
    const systemSettings: SystemSetting[] = await tenantDataSource.query(`
      SELECT * FROM system_settings ORDER BY category, key
    `)

    if (systemSettings.length === 0) {
      return
    }
    systemSettings.forEach(() => {})

    // Vérifier les conflits potentiels
    const conflictChecks = systemSettings
      .map((_s, i) => `("group" = $${i * 2 + 1} AND key = $${i * 2 + 2})`)
      .join(' OR ')

    const existingParams =
      systemSettings.length > 0
        ? await authDataSource.query(
            `
      SELECT "group", key FROM parameters_system 
      WHERE ${conflictChecks}
    `,
            systemSettings.flatMap((s) => [s.category, s.key])
          )
        : []

    if (existingParams.length > 0) {
      // Existing parameters found

      const continueWithConflicts = await askConfirmation(
        '\n❓ Continuer malgré les conflits? Les paramètres existants seront mis à jour (y/N): '
      )
      if (!continueWithConflicts) {
        return
      }
    }

    // Demander confirmation finale
    const confirmed = await askConfirmation(
      '\n❓ Confirmer la migration des paramètres vers la base auth? (y/N): '
    )
    if (!confirmed) {
      return
    }
    let migratedCount = 0
    let _errorCount = 0

    for (const setting of systemSettings) {
      try {
        // Mapper les types
        let paramType: ParameterSystem['type'] = 'STRING'
        const finalValue = setting.value

        switch (setting.type.toLowerCase()) {
          case 'array':
            paramType = 'ARRAY'
            break
          case 'object':
            paramType = 'OBJECT'
            break
          case 'number':
            paramType = 'NUMBER'
            break
          case 'boolean':
            paramType = 'BOOLEAN'
            break
          case 'enum':
            paramType = 'ENUM'
            break
          default:
            paramType = 'STRING'
        }

        // Préparer les valeurs selon le type
        let arrayValues = null
        let objectValues = null
        let stringValue = ''

        if (paramType === 'ARRAY' && typeof finalValue === 'object') {
          arrayValues = finalValue
          stringValue = JSON.stringify(finalValue)
        } else if (paramType === 'OBJECT' && typeof finalValue === 'object') {
          objectValues = finalValue
          stringValue = JSON.stringify(finalValue)
        } else {
          stringValue = typeof finalValue === 'string' ? finalValue : JSON.stringify(finalValue)
        }

        // Vérifier si le paramètre existe déjà
        const existingParam = await authDataSource.query(
          `
          SELECT id FROM parameters_system WHERE "group" = $1 AND key = $2
        `,
          [setting.category, setting.key]
        )

        if (existingParam.length > 0) {
          // Mettre à jour le paramètre existant
          await authDataSource.query(
            `
            UPDATE parameters_system SET
              value = $1,
              type = $2,
              description = $3,
              metadata = $4,
              "arrayValues" = $5,
              "objectValues" = $6,
              "isActive" = $7,
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE "group" = $8 AND key = $9
          `,
            [
              stringValue,
              paramType,
              setting.description || setting.label,
              setting.metadata || null,
              arrayValues,
              objectValues,
              setting.is_active,
              setting.category,
              setting.key,
            ]
          )
        } else {
          // Insérer un nouveau paramètre
          await authDataSource.query(
            `
            INSERT INTO parameters_system (
              "group", key, value, type, scope, description, metadata, 
              "arrayValues", "objectValues", "isActive", "isReadonly", "defaultLanguage"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `,
            [
              setting.category, // group
              setting.key,
              stringValue, // value
              paramType, // type
              'SYSTEM', // scope
              setting.description || setting.label,
              setting.metadata || null,
              arrayValues,
              objectValues,
              setting.is_active,
              false, // isReadonly
              'fr', // defaultLanguage
            ]
          )
        }

        migratedCount++
      } catch (_error: unknown) {
        _errorCount++
      }
    }

    if (migratedCount > 0) {
      // Proposer de nettoyer system_settings
      const cleanupConfirmed = await askConfirmation(
        '\n❓ Supprimer les paramètres de system_settings (base tenant)? (y/N): '
      )
      if (cleanupConfirmed) {
        await tenantDataSource.query('DELETE FROM system_settings')

        // Optionnel: supprimer la table si elle est vide
        const dropTableConfirmed = await askConfirmation(
          '\n❓ Supprimer complètement la table system_settings? (y/N): '
        )
        if (dropTableConfirmed) {
          await tenantDataSource.query('DROP TABLE IF EXISTS system_settings CASCADE')
        }
      }
    }
  } finally {
    if (tenantDataSource.isInitialized) {
      await tenantDataSource.destroy()
    }
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

// Exécution du script
async function main() {
  try {
    await migrateSystemSettingsToAuth()
  } catch (_error: unknown) {
    process.exit(1)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error)
}
