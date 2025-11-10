/**
 * Script pour créer la société par défaut manuellement
 * Usage: node create-default-societe.js
 */

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'topsteel_user',
  password: process.env.DB_PASSWORD || 'topsteel2024!',
  database: 'topsteel_auth'
});

async function createDefaultSociete() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // Vérifier si des sociétés existent déjà
    const countResult = await client.query('SELECT COUNT(*) as count FROM societes');
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      console.log(`ℹ️  ${count} société(s) déjà présente(s). Aucune création nécessaire.`);
      return;
    }

    console.log('🏢 Création de la société par défaut...');

    // Créer la société par défaut
    const societeResult = await client.query(
      `
      INSERT INTO societes (
        nom, code, email, telephone, adresse, ville, code_postal, pays,
        actif, siret, tva_intra, forme_juridique, capital,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, nom, code
    `,
      [
        'TopSteel',
        'TS',
        'contact@topsteel.tech',
        '+33 1 23 45 67 89',
        '1 Avenue de la Métallurgie',
        'Paris',
        '75001',
        'France',
        true,
        '12345678901234',
        'FR12345678901',
        'SAS',
        100000,
      ]
    );

    const societe = societeResult.rows[0];
    console.log(`✅ Société créée: ${societe.nom} (code: ${societe.code}, ID: ${societe.id})`);

    // Créer un site par défaut
    const siteResult = await client.query(
      `
      INSERT INTO sites (
        societe_id, nom, code, adresse, ville, code_postal, pays,
        actif, type, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, nom, code
    `,
      [
        societe.id,
        'Siège Social',
        'HQ',
        '1 Avenue de la Métallurgie',
        'Paris',
        '75001',
        'France',
        true,
        'SIEGE',
      ]
    );

    const site = siteResult.rows[0];
    console.log(`✅ Site créé: ${site.nom} (code: ${site.code}, ID: ${site.id})`);

    console.log('\n🎉 Société et site par défaut créés avec succès!');
    console.log('Vous pouvez maintenant vous connecter et sélectionner la société "TopSteel (TS)"');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDefaultSociete();
