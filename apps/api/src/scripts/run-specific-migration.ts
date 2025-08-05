import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'
import { AddCommercialPermissions1753820000016 } from '../core/database/migrations/auth/016-AddCommercialPermissions'

async function runSpecificMigration() {
  const dataSource = new DataSource(authDataSourceOptions)

  try {
    await dataSource.initialize()
    console.log('\n=== EXÉCUTION DE LA MIGRATION ADDCOMMERCIALPERMISSIONS ===\n')

    const migration = new AddCommercialPermissions1753820000016()

    // Vérifier si cette migration a déjà été exécutée
    const existing = await dataSource.query(
      `
      SELECT name FROM migrations WHERE name = $1
    `,
      [migration.name]
    )

    if (existing.length > 0) {
      console.log('✅ Cette migration a déjà été exécutée.')
      return
    }

    console.log('🚀 Exécution de la migration...')

    // Exécuter la migration
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.startTransaction()

    try {
      await migration.up(queryRunner)

      // Enregistrer la migration comme exécutée
      await queryRunner.query(
        `
        INSERT INTO migrations (name, timestamp) VALUES ($1, $2)
      `,
        [migration.name, Date.now().toString()]
      )

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }

    console.log('✅ Migration exécutée avec succès!')
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution de la migration:", error)

    // Afficher plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
  } finally {
    await dataSource.destroy()
  }
}

runSpecificMigration()
