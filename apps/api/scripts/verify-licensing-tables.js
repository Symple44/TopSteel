/**
 * Script to verify Licensing tables exist in PostgreSQL
 */

const { Client } = require('pg');

async function verifyLicensingTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://topsteel:topsteel@192.168.0.22:5432/topsteel',
  });

  try {
    await client.connect();

    // Check for tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('licenses', 'license_features', 'license_activations', 'license_usage')
      ORDER BY table_name;
    `);

    console.log('\n📊 Licensing Tables Status:\n');

    const expectedTables = ['license_activations', 'license_features', 'license_usage', 'licenses'];
    const foundTables = result.rows.map(r => r.table_name);

    expectedTables.forEach(table => {
      const exists = foundTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    // Check enums
    const enumsResult = await client.query(`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('LicenseType', 'LicenseStatus', 'BillingCycle', 'FeatureCategory', 'ActivationStatus', 'UsageMetricType')
      ORDER BY typname;
    `);

    console.log('\n📋 Enums Status:\n');
    const expectedEnums = ['ActivationStatus', 'BillingCycle', 'FeatureCategory', 'LicenseStatus', 'LicenseType', 'UsageMetricType'];
    const foundEnums = enumsResult.rows.map(r => r.typname);

    expectedEnums.forEach(enumType => {
      const exists = foundEnums.includes(enumType);
      console.log(`   ${exists ? '✅' : '❌'} ${enumType}`);
    });

    console.log('\n');

    if (foundTables.length === 4 && foundEnums.length === 6) {
      console.log('🎉 All Licensing tables and enums created successfully!\n');
    } else {
      console.log('⚠️  Some tables or enums are missing\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

verifyLicensingTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
