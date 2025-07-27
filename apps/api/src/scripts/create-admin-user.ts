import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  console.log('🔧 Création/Réinitialisation de l\'utilisateur admin...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash('TopSteel44!', 10);
    
    // Créer ou mettre à jour l'utilisateur admin
    const result = await dataSource.query(`
      INSERT INTO users (nom, prenom, email, password, role, actif, acronyme, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        password = $4,
        role = $5,
        actif = $6,
        acronyme = $7,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, nom, prenom, role, actif, acronyme
    `, [
      'Admin',
      'System', 
      'admin@topsteel.tech',
      hashedPassword,
      'SUPER_ADMIN',
      true,
      'TOP'
    ]);
    
    console.log('✅ Utilisateur admin créé/mis à jour avec succès:');
    console.log(`   - ID: ${result[0].id}`);
    console.log(`   - Email: ${result[0].email}`);
    console.log(`   - Nom: ${result[0].nom} ${result[0].prenom}`);
    console.log(`   - Rôle: ${result[0].role}`);
    console.log(`   - Actif: ${result[0].actif}`);
    console.log(`   - Acronyme: ${result[0].acronyme}`);
    
    console.log('\n📝 Identifiants de connexion:');
    console.log('   Email: admin@topsteel.tech');
    console.log('   Mot de passe: TopSteel44!');
    console.log('   Ou avec acronyme: TOP / TopSteel44!');
    
    console.log('\n⚠️  N\'oubliez pas de changer le mot de passe en production !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error);
  } finally {
    await app.close();
  }
}

// Exécuter la création
createAdminUser().catch(console.error);