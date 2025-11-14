// Script pour exécuter les migrations de la base de données auth
const { DataSource } = require('typeorm');
const path = require('path');

// Import migrations
const CreateAuthTables = require('./src/core/database/migrations/auth/1737000001000-CreateAuthTables.ts').CreateAuthTables;
const AlignUserSessionsTable = require('./src/core/database/migrations/auth/1738701000000-AlignUserSessionsTable.ts').AlignUserSessionsTable;
const AlignRolesTableColumns = require('./src/core/database/migrations/auth/1738702000000-AlignRolesTableColumns.ts').AlignRolesTableColumns;
const ModernizePermissionsTable = require('./src/core/database/migrations/auth/1738703000000-ModernizePermissionsTable.ts').ModernizePermissionsTable;
const CreateMenuTables = require('./src/core/database/migrations/auth/1740200000000-CreateMenuTables.ts').CreateMenuTables;
const FixUserSocieteRoleColumns = require('./src/core/database/migrations/auth/1753814054666-015-FixUserSocieteRoleColumns.ts').FixUserSocieteRoleColumns;

const dataSource = new DataSource({
  type: 'postgres',
  host: '192.168.0.22',
  port: 5432,
  username: 'toptime',
  password: 'toptime',
  database: 'erp_topsteel_auth',
  synchronize: false,
  logging: true,
  migrations: [
    CreateAuthTables,
    AlignUserSessionsTable,
    AlignRolesTableColumns,
    ModernizePermissionsTable,
    CreateMenuTables,
    FixUserSocieteRoleColumns,
  ],
  migrationsRun: false,
});

async function runMigrations() {
  try {
    console.log('\n🔄 Initialisation de la connexion...\n');
    await dataSource.initialize();

    console.log('✅ Connexion établie\n');
    console.log('🔄 Exécution des migrations...\n');

    const migrations = await dataSource.runMigrations({
      transaction: 'each',
    });

    if (migrations.length === 0) {
      console.log('ℹ️  Aucune migration à exécuter (toutes déjà appliquées)\n');
    } else {
      console.log(`\n✅ ${migrations.length} migration(s) exécutée(s) avec succès:\n`);
      migrations.forEach(migration => {
        console.log(`   ✓ ${migration.name}`);
      });
    }

    await dataSource.destroy();
    console.log('\n✅ Migrations terminées avec succès!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des migrations:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
