const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_topsteel',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Créer la table migrations si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" bigint NOT NULL,
        "name" varchar NOT NULL,
        CONSTRAINT "UQ_migrations_timestamp" UNIQUE ("timestamp")
      );
    `);

    // Lire et exécuter le script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create_query_builder_tables_simple.sql'), 'utf8');
    
    console.log('Executing migration script...');
    const result = await client.query(sqlScript);
    
    console.log('Migration completed successfully!');
    console.log('Result:', result[result.length - 1]?.rows?.[0]?.message || 'Done');

  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();