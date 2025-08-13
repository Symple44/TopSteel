import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env' });

// Configuration de la datasource auth
const authDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE_AUTH || 'erp_topsteel_auth',
});

async function ensureArticlesMenu() {
  try {
    await authDataSource.initialize();
    console.log('✅ Connexion à la base de données établie\n');

    // 1. Vérifier si le menu Articles existe déjà
    console.log('🔍 Vérification de l\'existence du menu Articles...');
    
    const checkQuery = `
      SELECT id, title, "programId", "isVisible"
      FROM menu_items
      WHERE LOWER(title) LIKE '%article%'
         OR "programId" LIKE '%/inventory/articles%'
    `;
    
    const existingMenus = await authDataSource.query(checkQuery);
    
    if (existingMenus.length > 0) {
      console.log(`✅ ${existingMenus.length} menu(s) Articles trouvé(s):`);
      existingMenus.forEach((menu: any) => {
        console.log(`  - ${menu.title} (${menu.programId}) - Visible: ${menu.isVisible}`);
      });
      
      // Vérifier si au moins un est visible
      const visibleMenu = existingMenus.find((m: any) => m.isVisible);
      if (!visibleMenu) {
        console.log('\n⚠️ Aucun menu Articles visible. Mise à jour...');
        const updateQuery = `
          UPDATE menu_items
          SET "isVisible" = true
          WHERE "programId" LIKE '%/inventory/articles%'
        `;
        await authDataSource.query(updateQuery);
        console.log('✅ Menu Articles rendu visible');
      }
    } else {
      console.log('❌ Aucun menu Articles trouvé. Création...\n');
      
      // Obtenir un configId valide (prendre le premier disponible)
      const configQuery = `
        SELECT id FROM menu_configurations
        WHERE "isactive" = true
        LIMIT 1
      `;
      const configs = await authDataSource.query(configQuery);
      
      if (configs.length === 0) {
        console.log('❌ Aucune configuration de menu active trouvée');
        return;
      }
      
      const configId = configs[0].id;
      console.log(`📋 Utilisation de la configuration: ${configId}`);
      
      // Trouver le menu parent Inventory s'il existe
      const parentQuery = `
        SELECT id FROM menu_items
        WHERE LOWER(title) LIKE '%inventory%'
           OR LOWER(title) LIKE '%stock%'
           OR LOWER(title) LIKE '%inventaire%'
        LIMIT 1
      `;
      const parents = await authDataSource.query(parentQuery);
      const parentId = parents.length > 0 ? parents[0].id : null;
      
      if (parentId) {
        console.log(`📁 Menu parent trouvé: ${parentId}`);
      }
      
      // Créer le menu Articles
      const menuId = uuidv4();
      const insertQuery = `
        INSERT INTO menu_items (
          id,
          "configId",
          "parentId",
          title,
          "programId",
          type,
          "isVisible",
          "orderIndex",
          "createdAt",
          "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        )
      `;
      
      const params = [
        menuId,
        configId,
        parentId,
        'Articles',
        '/inventory/articles',
        'P', // Type Programme
        true, // Visible
        10 // Order
      ];
      
      await authDataSource.query(insertQuery, params);
      console.log('✅ Menu Articles créé avec succès');
      console.log(`   ID: ${menuId}`);
      console.log(`   Title: Articles`);
      console.log(`   Program: /inventory/articles`);
      console.log(`   Parent: ${parentId || 'Root'}`);
    }
    
    // Vérifier le résultat final
    console.log('\n📊 Vérification finale:');
    const finalCheck = `
      SELECT COUNT(*) as count
      FROM menu_items
      WHERE title = 'Articles'
        AND "isVisible" = true
    `;
    const result = await authDataSource.query(finalCheck);
    console.log(`✅ ${result[0].count} menu(s) Articles visible(s) dans la base`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await authDataSource.destroy();
    console.log('\n✅ Connexion fermée');
  }
}

// Lancer le script
ensureArticlesMenu();