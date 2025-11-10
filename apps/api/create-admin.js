// Create admin user in the database
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'topsteel',
  password: process.env.DB_PASSWORD || 'topsteel',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function createAdminUser() {
  try {
    const email = 'admin@topsteel.fr';
    const password = 'Admin2025!';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('\n👤 Creating admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('\n⚠️  Admin user already exists!');
      await pool.end();
      return;
    }

    // Create user
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, nom, prenom, email, password, role, actif)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, 'Admin', 'System', email, hashedPassword, 'SUPER_ADMIN', true]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: SUPER_ADMIN\n`);
    console.log('🎉 You can now log in at http://localhost:3005/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();
