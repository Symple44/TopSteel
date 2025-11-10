const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_AUTH_NAME,
  synchronize: true,
  logging: true,
  entities: ['dist/**/*.entity.js'], // Utiliser les fichiers compilés
});

async function testSync() {
  try {
    console.log('\n🔄 Test de synchronize avec TypeORM...\n');
    await dataSource.initialize();
    console.log('\n✅ DataSource initialisé avec synchronize=true');
    console.log('📊 Vérification des tables créées...\n');
    
    const tables = await dataSource.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log(`📋 Tables trouvées: ${tables.length}`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));
    
    await dataSource.destroy();
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

testSync();
