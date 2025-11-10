import { DataSource } from 'typeorm'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const BASE_PATH = path.join(__dirname, 'src', 'core', 'database', 'migrations')

// Configuration pour la base AUTH
const authDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5439'),
  username: process.env.POSTGRES_USER || 'topsteel',
  password: process.env.POSTGRES_PASSWORD || 'topsteelpass',
  database: 'topsteel_auth',
  migrations: [
    path.join(BASE_PATH, 'auth', '*.ts'),
    path.join(BASE_PATH, '*.ts'),
  ],
  migrationsTableName: 'migrations',
  logging: true,
})

// Configuration pour la base SHARED
const sharedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5439'),
  username: process.env.POSTGRES_USER || 'topsteel',
  password: process.env.POSTGRES_PASSWORD || 'topsteelpass',
  database: 'topsteel',
  migrations: [path.join(BASE_PATH, 'shared', '*.ts')],
  migrationsTableName: 'migrations',
  logging: true,
})

// Configuration pour la base TENANT
const tenantDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5439'),
  username: process.env.POSTGRES_USER || 'topsteel',
  password: process.env.POSTGRES_PASSWORD || 'topsteelpass',
  database: 'topsteel',
  migrations: [
    path.join(BASE_PATH, 'tenant', '*.ts'),
    path.join(BASE_PATH, 'topsteel', '*.ts'),
  ],
  migrationsTableName: 'migrations',
  logging: true,
})

async function runMigrations(dataSource: DataSource, name: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🚀 Exécution des migrations pour: ${name}`)
  console.log(`Database: ${dataSource.options.database}`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    await dataSource.initialize()
    console.log(`✅ Connecté à ${dataSource.options.database}`)

    // Afficher les migrations en attente
    const pendingMigrations = await dataSource.showMigrations()
    if (pendingMigrations) {
      console.log(`📋 ${pendingMigrations ? 'Migrations en attente détectées' : 'Aucune migration en attente'}`)
    }

    // Exécuter les migrations
    const migrations = await dataSource.runMigrations({ transaction: 'all' })

    if (migrations.length === 0) {
      console.log(`✅ Aucune migration à exécuter pour ${name}`)
    } else {
      console.log(`✅ ${migrations.length} migration(s) exécutée(s) avec succès:`)
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`)
      })
    }

    await dataSource.destroy()
    console.log(`✅ Déconnecté de ${dataSource.options.database}`)

    return { success: true, count: migrations.length }
  } catch (error: any) {
    console.error(`❌ Erreur lors de l'exécution des migrations pour ${name}:`)
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }

    try {
      await dataSource.destroy()
    } catch (e) {
      // Ignorer les erreurs de déconnexion
    }

    return { success: false, count: 0, error: error.message }
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🔧 EXÉCUTION DE TOUTES LES MIGRATIONS')
  console.log('='.repeat(60))

  const results = []

  // Exécuter les migrations pour AUTH
  results.push({
    name: 'AUTH',
    ...(await runMigrations(authDataSource, 'AUTH (topsteel_auth)')),
  })

  // Exécuter les migrations pour SHARED
  results.push({
    name: 'SHARED',
    ...(await runMigrations(sharedDataSource, 'SHARED (topsteel)')),
  })

  // Exécuter les migrations pour TENANT
  results.push({
    name: 'TENANT',
    ...(await runMigrations(tenantDataSource, 'TENANT (topsteel)')),
  })

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(60))

  let totalMigrations = 0
  let successCount = 0
  let failureCount = 0

  results.forEach((result) => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED'
    console.log(`${status} - ${result.name}: ${result.count} migration(s)`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }

    totalMigrations += result.count
    if (result.success) {
      successCount++
    } else {
      failureCount++
    }
  })

  console.log(`\nTotal: ${totalMigrations} migration(s) exécutée(s)`)
  console.log(`Bases réussies: ${successCount}/${results.length}`)
  if (failureCount > 0) {
    console.log(`⚠️  Bases échouées: ${failureCount}`)
  }

  console.log('='.repeat(60) + '\n')

  process.exit(failureCount > 0 ? 1 : 0)
}

main()
