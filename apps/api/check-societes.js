const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5439,
  username: 'topsteel',
  password: 'topsteelpass',
  database: 'topsteel'
});

ds.initialize()
  .then(async () => {
    console.log('=== Vérification des SOCIETES ===');
    const societes = await ds.query('SELECT id, nom, code, actif FROM societes LIMIT 5');
    console.log(`Societes trouvées: ${societes.length}`);
    societes.forEach(s => {
      console.log(`  ID: ${s.id}`);
      console.log(`  Nom: ${s.nom}`);
      console.log(`  Code: ${s.code}`);
      console.log(`  Actif: ${s.actif}`);
      console.log('  ---');
    });

    console.log('\n=== Vérification de la colonne deleted_at dans users ===');
    try {
      const result = await ds.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'deleted_at'
      `);
      if (result.length > 0) {
        console.log('✅ Colonne deleted_at EXISTE');
      } else {
        console.log('❌ Colonne deleted_at N\'EXISTE PAS');
      }
    } catch (e) {
      console.error('Erreur:', e.message);
    }

    await ds.destroy();
  })
  .catch(e => {
    console.error('Erreur de connexion:', e.message);
    process.exit(1);
  });
