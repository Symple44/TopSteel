#!/usr/bin/env ts-node

/**
 * Script de migration des entités métier de la base principale vers les bases tenant
 * Supprime les entités métier de la base principale après migration réussie
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface BusinessEntityMigration {
  tableName: string
  hasUserReference: boolean
  hasTenantFields: boolean
  customMigrationLogic?: (source: DataSource, target: DataSource, societeId: string) => Promise<void>
}

class BusinessEntityMigrator {
  private currentDataSource: DataSource
  private tenantDataSource: DataSource
  private societeId: string = ''

  // Définition des entités métier à migrer
  private businessEntities: BusinessEntityMigration[] = [
    {
      tableName: 'clients',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'fournisseurs',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'materiaux',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'stocks',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'commandes',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'projets',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'factures',
      hasUserReference: true,
      hasTenantFields: false
    },
    {
      tableName: 'devis',
      hasUserReference: true,
      hasTenantFields: false
    }
  ]

  constructor() {
    this.currentDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
    })

    // Base tenant par défaut (TopSteel)
    this.tenantDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'erp_topsteel_topsteel',
    })
  }

  async initialize(): Promise<void> {
    await this.currentDataSource.initialize()
    await this.tenantDataSource.initialize()
    
    // Récupérer l'ID de la société par défaut
    const authDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    })

    await authDataSource.initialize()
    
    try {
      const societes = await authDataSource.query('SELECT id FROM societes WHERE code = $1', ['TOPSTEEL'])
      if (societes.length > 0) {
        this.societeId = societes[0].id
        console.log(`🏢 Société TopSteel trouvée: ${this.societeId}`)
      } else {
        throw new Error('Société TopSteel non trouvée dans la base AUTH')
      }
    } finally {
      await authDataSource.destroy()
    }

    console.log('🔗 Connexions établies')
  }

  async destroy(): Promise<void> {
    if (this.currentDataSource.isInitialized) {
      await this.currentDataSource.destroy()
    }
    if (this.tenantDataSource.isInitialized) {
      await this.tenantDataSource.destroy()
    }
    console.log('🔌 Connexions fermées')
  }

  /**
   * Vérifier si une table existe
   */
  async tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
    const result = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName])
    
    return result[0].exists
  }

  /**
   * Obtenir la structure d'une table
   */
  async getTableStructure(dataSource: DataSource, tableName: string): Promise<any[]> {
    return await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName])
  }

  /**
   * Créer la table dans la base tenant si elle n'existe pas
   */
  async ensureTableInTenant(entity: BusinessEntityMigration): Promise<void> {
    const tableExists = await this.tableExists(this.tenantDataSource, entity.tableName)
    
    if (!tableExists) {
      console.log(`   📋 Création de la table '${entity.tableName}' dans la base tenant...`)
      
      // Obtenir la structure de la table source
      const sourceStructure = await this.getTableStructure(this.currentDataSource, entity.tableName)
      
      if (sourceStructure.length === 0) {
        console.log(`   ⚠️ Table '${entity.tableName}' n'existe pas dans la base source`)
        return
      }

      // Construire la requête CREATE TABLE
      const columns = sourceStructure.map(col => {
        let columnDef = `"${col.column_name}" ${col.data_type}`
        
        if (col.is_nullable === 'NO') {
          columnDef += ' NOT NULL'
        }
        
        if (col.column_default) {
          columnDef += ` DEFAULT ${col.column_default}`
        }
        
        return columnDef
      })

      // Ajouter les colonnes multi-tenant si nécessaire
      if (!entity.hasTenantFields) {
        columns.push('"societe_id" uuid NOT NULL')
        columns.push('"site_id" uuid')
      }

      const createTableSQL = `
        CREATE TABLE "${entity.tableName}" (
          ${columns.join(',\n  ')}
        )
      `

      await this.tenantDataSource.query(createTableSQL)
      console.log(`   ✅ Table '${entity.tableName}' créée dans la base tenant`)
    }
  }

  /**
   * Migrer les données d'une entité
   */
  async migrateEntityData(entity: BusinessEntityMigration): Promise<void> {
    console.log(`📦 Migration de '${entity.tableName}'...`)

    // Vérifier que la table existe dans la source
    const sourceExists = await this.tableExists(this.currentDataSource, entity.tableName)
    if (!sourceExists) {
      console.log(`   ⚠️ Table '${entity.tableName}' n'existe pas dans la base source`)
      return
    }

    // S'assurer que la table existe dans le tenant
    await this.ensureTableInTenant(entity)

    // Compter les enregistrements à migrer
    const countResult = await this.currentDataSource.query(`
      SELECT COUNT(*) as count 
      FROM "${entity.tableName}" 
      WHERE deleted_at IS NULL
    `)
    const totalRecords = parseInt(countResult[0].count)

    if (totalRecords === 0) {
      console.log(`   ℹ️ Aucun enregistrement à migrer pour '${entity.tableName}'`)
      return
    }

    console.log(`   📊 ${totalRecords} enregistrements à migrer`)

    // Logique de migration personnalisée ou générique
    if (entity.customMigrationLogic) {
      await entity.customMigrationLogic(this.currentDataSource, this.tenantDataSource, this.societeId)
    } else {
      await this.genericEntityMigration(entity)
    }

    console.log(`   ✅ Migration de '${entity.tableName}' terminée`)
  }

  /**
   * Migration générique d'une entité
   */
  async genericEntityMigration(entity: BusinessEntityMigration): Promise<void> {
    const batchSize = 1000
    let offset = 0

    while (true) {
      // Récupérer un lot d'enregistrements
      const records = await this.currentDataSource.query(`
        SELECT * 
        FROM "${entity.tableName}" 
        WHERE deleted_at IS NULL
        ORDER BY created_at
        LIMIT $1 OFFSET $2
      `, [batchSize, offset])

      if (records.length === 0) {
        break
      }

      // Migrer le lot
      for (const record of records) {
        // Ajouter les champs tenant
        if (!entity.hasTenantFields) {
          record.societe_id = this.societeId
          record.site_id = null // Site principal sera défini plus tard si nécessaire
        }

        // Construire la requête d'insertion
        const columns = Object.keys(record).map(col => `"${col}"`).join(', ')
        const values = Object.keys(record).map((_, index) => `$${index + 1}`).join(', ')
        const insertSQL = `
          INSERT INTO "${entity.tableName}" (${columns})
          VALUES (${values})
          ON CONFLICT (id) DO NOTHING
        `

        try {
          await this.tenantDataSource.query(insertSQL, Object.values(record))
        } catch (error) {
          console.error(`   ❌ Erreur lors de l'insertion de l'enregistrement ${record.id}:`, (error as Error).message)
          // Continuer avec les autres enregistrements
        }
      }

      offset += batchSize
      console.log(`   📈 ${Math.min(offset, records.length + offset - batchSize)} enregistrements migrés`)
    }
  }

  /**
   * Supprimer les entités métier de la base principale
   */
  async removeBusinessEntitiesFromMainDatabase(options: { dryRun?: boolean } = {}): Promise<void> {
    console.log('🗑️ Suppression des entités métier de la base principale...')

    if (options.dryRun) {
      console.log('   ℹ️ Mode DRY-RUN: aucune suppression ne sera effectuée')
    }

    for (const entity of this.businessEntities) {
      const tableExists = await this.tableExists(this.currentDataSource, entity.tableName)
      
      if (!tableExists) {
        console.log(`   ⚠️ Table '${entity.tableName}' n'existe pas dans la base principale`)
        continue
      }

      // Compter les enregistrements
      const countResult = await this.currentDataSource.query(`
        SELECT COUNT(*) as count FROM "${entity.tableName}"
      `)
      const recordCount = parseInt(countResult[0].count)

      console.log(`   📊 Table '${entity.tableName}': ${recordCount} enregistrements`)

      if (!options.dryRun) {
        try {
          // Supprimer la table
          await this.currentDataSource.query(`DROP TABLE IF EXISTS "${entity.tableName}" CASCADE`)
          console.log(`   ✅ Table '${entity.tableName}' supprimée`)
        } catch (error) {
          console.error(`   ❌ Erreur lors de la suppression de '${entity.tableName}':`, (error as Error).message)
        }
      } else {
        console.log(`   🔍 DRY-RUN: La table '${entity.tableName}' serait supprimée`)
      }
    }

    if (!options.dryRun) {
      console.log('   ✅ Suppression des entités métier terminée')
    } else {
      console.log('   ℹ️ DRY-RUN terminé: utilisez --execute pour effectuer les suppressions')
    }
  }

  /**
   * Valider la migration des entités
   */
  async validateEntityMigration(): Promise<boolean> {
    console.log('🔍 Validation de la migration des entités...')
    
    let allValid = true

    for (const entity of this.businessEntities) {
      try {
        // Vérifier si la table existe dans la source
        const sourceExists = await this.tableExists(this.currentDataSource, entity.tableName)
        if (!sourceExists) {
          continue
        }

        // Compter dans la source
        const sourceCount = await this.currentDataSource.query(`
          SELECT COUNT(*) as count 
          FROM "${entity.tableName}" 
          WHERE deleted_at IS NULL
        `)

        // Compter dans le tenant
        const tenantExists = await this.tableExists(this.tenantDataSource, entity.tableName)
        let tenantCount = [{ count: '0' }]
        
        if (tenantExists) {
          tenantCount = await this.tenantDataSource.query(`
            SELECT COUNT(*) as count 
            FROM "${entity.tableName}" 
            WHERE deleted_at IS NULL AND societe_id = $1
          `, [this.societeId])
        }

        const sourceTotal = parseInt(sourceCount[0].count)
        const tenantTotal = parseInt(tenantCount[0].count)

        if (sourceTotal === tenantTotal) {
          console.log(`   ✅ ${entity.tableName}: ${sourceTotal} enregistrements migrés correctement`)
        } else {
          console.log(`   ❌ ${entity.tableName}: ${sourceTotal} source vs ${tenantTotal} tenant`)
          allValid = false
        }

      } catch (error) {
        console.error(`   ❌ Erreur lors de la validation de '${entity.tableName}':`, (error as Error).message)
        allValid = false
      }
    }

    return allValid
  }

  /**
   * Générer un rapport de migration
   */
  generateMigrationReport(success: boolean): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const reportFile = path.join(__dirname, '../../../backups/post-migration', `business_entities_migration_${timestamp}.json`)

    // Créer le dossier si nécessaire
    const dir = path.dirname(reportFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const report = {
      timestamp: new Date().toISOString(),
      societeId: this.societeId,
      entitiesMigrated: this.businessEntities.map(e => e.tableName),
      success,
      conclusion: success ? 'MIGRATION_SUCCESS' : 'MIGRATION_FAILED'
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    console.log('\n' + '='.repeat(60))
    console.log('📋 RAPPORT DE MIGRATION DES ENTITÉS MÉTIER')
    console.log('='.repeat(60))
    console.log(`\n📊 RÉSULTATS:`)
    console.log(`   Société: ${this.societeId}`)
    console.log(`   Entités migrées: ${this.businessEntities.length}`)
    console.log(`   Statut: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    console.log(`   📁 Rapport: ${reportFile}`)
  }

  /**
   * Processus complet de migration des entités métier
   */
  async runBusinessEntityMigration(options: { 
    dryRun?: boolean
    skipValidation?: boolean
    removeFromMain?: boolean 
  } = {}): Promise<void> {
    console.log('📦 MIGRATION DES ENTITÉS MÉTIER')
    console.log('=' + '='.repeat(59))

    if (options.dryRun) {
      console.log('ℹ️ Mode DRY-RUN activé')
    }

    let migrationSuccess = false

    try {
      await this.initialize()

      // 1. Migrer chaque entité
      for (const entity of this.businessEntities) {
        if (!options.dryRun) {
          await this.migrateEntityData(entity)
        } else {
          console.log(`🔍 DRY-RUN: Migration de '${entity.tableName}' simulée`)
        }
      }

      // 2. Valider la migration
      if (!options.skipValidation && !options.dryRun) {
        migrationSuccess = await this.validateEntityMigration()
      } else {
        migrationSuccess = true // Assume success for dry-run
      }

      // 3. Supprimer de la base principale si demandé et si migration réussie
      if (options.removeFromMain && migrationSuccess) {
        await this.removeBusinessEntitiesFromMainDatabase({ dryRun: options.dryRun })
      }

      // 4. Générer le rapport
      if (!options.dryRun) {
        this.generateMigrationReport(migrationSuccess)
      }

      console.log('\n✅ MIGRATION DES ENTITÉS TERMINÉE')

    } catch (error) {
      console.error('💥 ERREUR LORS DE LA MIGRATION DES ENTITÉS')
      console.error('Erreur:', error)
      
      if (!options.dryRun) {
        this.generateMigrationReport(false)
      }
      
      throw error
    } finally {
      await this.destroy()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const skipValidation = args.includes('--skip-validation')
  const removeFromMain = args.includes('--remove-from-main')

  const migrator = new BusinessEntityMigrator()
  migrator.runBusinessEntityMigration({ 
    dryRun, 
    skipValidation, 
    removeFromMain 
  })
    .then(() => {
      console.log('\n✅ Migration des entités métier terminée.')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Migration des entités métier échouée:', error)
      process.exit(1)
    })
}

export { BusinessEntityMigrator }