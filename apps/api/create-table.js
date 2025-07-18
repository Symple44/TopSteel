const { Client } = require('pg');

async function createTable() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'erp_topsteel',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });
  
  try {
    await client.connect();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS discovered_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id VARCHAR UNIQUE NOT NULL,
        title VARCHAR NOT NULL,
        href VARCHAR NOT NULL,
        description TEXT,
        icon VARCHAR,
        category VARCHAR NOT NULL,
        subcategory VARCHAR,
        required_permissions TEXT,
        required_roles TEXT,
        module_id VARCHAR,
        is_enabled BOOLEAN DEFAULT true,
        is_visible BOOLEAN DEFAULT true,
        default_access_level VARCHAR DEFAULT 'ADMIN',
        default_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_discovered_pages_page_id ON discovered_pages(page_id);
      CREATE INDEX IF NOT EXISTS idx_discovered_pages_category ON discovered_pages(category);
      CREATE INDEX IF NOT EXISTS idx_discovered_pages_is_enabled ON discovered_pages(is_enabled);
    `;
    
    await client.query(sql);
    console.log('Table discovered_pages créée avec succès');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.end();
  }
}

createTable();