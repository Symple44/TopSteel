import { DataSource } from 'typeorm'

const authDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_auth',
})

const sharedDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_shared',
})

async function migrateMenuToShared() {
  try {
    await authDataSource.initialize()
    await sharedDataSource.initialize()
    console.log('✅ Connexions aux bases de données établies')

    // 1. Sauvegarder les configurations depuis AUTH
    console.log('\n📋 Migration des configurations...')
    const configurations = await authDataSource.query('SELECT * FROM menu_configurations')
    
    for (const config of configurations) {
      await sharedDataSource.query(`
        INSERT INTO menu_configurations (id, name, description, isactive, issystem, metadata, createdat, updatedat, createdby, updatedby)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          isactive = EXCLUDED.isactive,
          issystem = EXCLUDED.issystem,
          metadata = EXCLUDED.metadata,
          updatedat = EXCLUDED.updatedat,
          updatedby = EXCLUDED.updatedby
      `, [
        config.id, config.name, config.description, config.isactive, 
        config.issystem, config.metadata, config.createdat, config.updatedat,
        config.createdby, config.updatedby
      ])
    }
    console.log(`✅ ${configurations.length} configurations migrées`)

    // 2. Sauvegarder les items depuis AUTH
    console.log('\n📊 Migration des items de menu...')
    const items = await authDataSource.query('SELECT * FROM menu_items ORDER BY "orderIndex"')
    
    for (const item of items) {
      await sharedDataSource.query(`
        INSERT INTO menu_items (
          id, "configId", "parentId", title, type, "programId", "externalUrl", 
          "queryBuilderId", "orderIndex", "isVisible", metadata, "createdAt", 
          "updatedAt", "createdBy", "updatedBy"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          type = EXCLUDED.type,
          "programId" = EXCLUDED."programId",
          "externalUrl" = EXCLUDED."externalUrl",
          "queryBuilderId" = EXCLUDED."queryBuilderId",
          "orderIndex" = EXCLUDED."orderIndex",
          "isVisible" = EXCLUDED."isVisible",
          metadata = EXCLUDED.metadata,
          "updatedAt" = EXCLUDED."updatedAt",
          "updatedBy" = EXCLUDED."updatedBy"
      `, [
        item.id, item.configId, item.parentId, item.title, item.type,
        item.programId, item.externalUrl, item.queryBuilderId, item.orderIndex,
        item.isVisible, item.metadata, item.createdAt, item.updatedAt,
        item.createdBy, item.updatedBy
      ])
    }
    console.log(`✅ ${items.length} items de menu migrés`)

    // 3. Vérifier la migration
    console.log('\n🔍 Vérification de la migration...')
    const sharedConfigs = await sharedDataSource.query('SELECT COUNT(*) FROM menu_configurations')
    const sharedItems = await sharedDataSource.query('SELECT COUNT(*) FROM menu_items')
    
    console.log(`📋 SHARED - Configurations: ${sharedConfigs[0].count}`)
    console.log(`📊 SHARED - Items: ${sharedItems[0].count}`)

    // 4. Supprimer les données de AUTH (optionnel - décommentez si vous voulez supprimer)
    console.log('\n🗑️  Suppression des données de AUTH...')
    // await authDataSource.query('DELETE FROM menu_items')
    // await authDataSource.query('DELETE FROM menu_configurations')
    // console.log('✅ Données supprimées de AUTH')

    console.log('\n✅ Migration terminée avec succès!')
    console.log('ℹ️  Les données sont maintenant dans SHARED')
    console.log('ℹ️  Les données AUTH sont conservées pour sécurité (décommentez pour supprimer)')

    await authDataSource.destroy()
    await sharedDataSource.destroy()

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    if (authDataSource.isInitialized) await authDataSource.destroy()
    if (sharedDataSource.isInitialized) await sharedDataSource.destroy()
  }
}

migrateMenuToShared()