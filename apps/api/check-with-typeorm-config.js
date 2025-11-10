// Check database using exact same config as TypeORM
const { Pool } = require('pg');
const { config } = require('dotenv');
const { ConfigService } = require('@nestjs/config');

// Load .env exactly like TypeORM does
config();

const configService = new ConfigService();

const dbConfig = {
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  user: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_AUTH_NAME', 'erp_topsteel_auth'),
};

console.log('\n🔍 TypeORM Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}\n`);

const pool = new Pool(dbConfig);

async function checkDatabase() {
  try {
    // Check connection
    const versionResult = await pool.query('SELECT version(), current_database()');
    console.log('✅ Connection successful!');
    console.log(`   PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}`);
    console.log(`   Connected to database: ${versionResult.rows[0].current_database}\n`);

    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`📋 Tables found: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(t => {
        console.log(`   - ${t.table_name}`);
      });
    } else {
      console.log('   ❌ No tables found!');
    }

    // Check migrations
    try {
      const migrationsResult = await pool.query('SELECT * FROM migrations ORDER BY timestamp');
      console.log(`\n📦 Migrations: ${migrationsResult.rows.length} migration(s)`);
      migrationsResult.rows.forEach(m => {
        console.log(`   - ${m.name} (${new Date(parseInt(m.timestamp)).toISOString()})`);
      });
    } catch (err) {
      console.log('\n❌ Migrations table does not exist');
    }

    // Check users
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n👥 Users: ${usersResult.rows[0].count} user(s)\n`);
    } catch (err) {
      console.log('\n❌ Users table does not exist\n');
    }

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
