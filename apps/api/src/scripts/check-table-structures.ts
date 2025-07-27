import { DataSource } from 'typeorm'

async function checkTableStructure() {
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

  try {
    await authDataSource.initialize()
    await sharedDataSource.initialize()

    console.log('🔍 === STRUCTURE DES TABLES ===')

    // Vérifier menu_configurations
    console.log('\n📋 MENU_CONFIGURATIONS:')
    
    console.log('\n🔸 AUTH:')
    const authConfigCols = await authDataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_configurations' 
      ORDER BY ordinal_position
    `)
    authConfigCols.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`))

    console.log('\n🔸 SHARED:')
    const sharedConfigCols = await sharedDataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_configurations' 
      ORDER BY ordinal_position
    `)
    sharedConfigCols.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`))

    await authDataSource.destroy()
    await sharedDataSource.destroy()

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (authDataSource.isInitialized) await authDataSource.destroy()
    if (sharedDataSource.isInitialized) await sharedDataSource.destroy()
  }
}

checkTableStructure()