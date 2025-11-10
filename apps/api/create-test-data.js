const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestData() {
  const client = new Client({
    host: '192.168.0.22',
    port: 5432,
    user: 'topsteel',
    password: 'topsteel',
    database: 'topsteel_auth'
  });

  try {
    await client.connect();
    console.log('✅ Connected to topsteel_auth\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);

    // Create admin user if not exists
    const userCheck = await client.query(`SELECT id FROM users WHERE email = 'admin@topsteel.tech'`);

    if (userCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO users (nom, prenom, email, password, role, actif, acronyme, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, ['Admin', 'System', 'admin@topsteel.tech', hashedPassword, 'SUPER_ADMIN', true, 'TOP']);
      console.log('✅ Admin user created: admin@topsteel.tech / ChangeMe123!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create default societe if not exists
    const societeCheck = await client.query(`SELECT id FROM societes LIMIT 1`);

    if (societeCheck.rows.length === 0) {
      const societeResult = await client.query(`
        INSERT INTO societes (
          nom, code, email, telephone, adresse,
          status, plan, database_name, siret,
          created_at, updated_at, configuration
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10)
        RETURNING id
      `, [
        'TopSteel',
        'TS',
        'contact@topsteel.tech',
        '+33 1 23 45 67 89',
        '1 Avenue de la Métallurgie, 75001 Paris, France',
        'ACTIVE',
        'PROFESSIONAL',
        'erp_topsteel_societe_topsteel',
        '12345678901234',
        '{}'
      ]);

      const societeId = societeResult.rows[0].id;
      console.log('✅ Société créée: TopSteel');

      // Create default site
      await client.query(`
        INSERT INTO sites (
          societe_id, nom, code, adresse,
          actif, type, created_at, updated_at, configuration
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)
      `, [
        societeId,
        'Siège Social',
        'HQ',
        '1 Avenue de la Métallurgie, 75001 Paris, France',
        true,
        'PRODUCTION',
        '{}'
      ]);
      console.log('✅ Site créé: Siège Social');
    } else {
      console.log('ℹ️  Société already exists');
    }

    console.log('\n✅ Test data created successfully!');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@topsteel.tech');
    console.log('  Password: ChangeMe123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTestData();
