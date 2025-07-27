import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../modules/auth/auth.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function diagnoseAdminUser() {
  console.log('🔍 Diagnostic de l\'utilisateur admin...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);
  const dataSource = app.get(DataSource);

  try {
    // 1. Vérifier si l'utilisateur admin existe
    console.log('1. Recherche de l\'utilisateur admin@topsteel.tech...');
    const adminUser = await usersService.findByEmail('admin@topsteel.tech');
    
    if (adminUser) {
      console.log('✅ Utilisateur admin trouvé:');
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Nom: ${adminUser.nom} ${adminUser.prenom}`);
      console.log(`   - Rôle: ${adminUser.role}`);
      console.log(`   - Actif: ${adminUser.actif}`);
      console.log(`   - Acronyme: ${adminUser.acronyme}`);
      console.log(`   - Dernier login: ${adminUser.dernier_login || 'Jamais'}`);
      
      // 2. Tester la validation du mot de passe
      console.log('\n2. Test de validation du mot de passe...');
      try {
        const isPasswordValid = await bcrypt.compare('TopSteel44!', adminUser.password);
        if (isPasswordValid) {
          console.log('✅ Mot de passe correct');
          
          // 3. Tester la méthode de validation complète
          console.log('\n3. Test de la méthode validateUser...');
          try {
            const validatedUser = await authService.validateUser('admin@topsteel.tech', 'TopSteel44!');
            console.log('✅ Validation réussie:', {
              id: validatedUser.id,
              email: validatedUser.email,
              role: validatedUser.role
            });
          } catch (error) {
            console.log('❌ Erreur lors de la validation:', error.message);
          }
        } else {
          console.log('❌ Mot de passe incorrect dans la base de données');
          console.log('🔧 Le mot de passe sera réinitialisé...');
          
          // Réinitialiser le mot de passe
          const hashedPassword = await bcrypt.hash('TopSteel44!', 10);
          await dataSource.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hashedPassword, 'admin@topsteel.tech']
          );
          console.log('✅ Mot de passe réinitialisé');
        }
      } catch (error) {
        console.log('❌ Erreur lors du test du mot de passe:', error.message);
      }
      
    } else {
      console.log('❌ Utilisateur admin non trouvé');
      console.log('🔧 Création de l\'utilisateur admin...');
      
      // Créer l'utilisateur admin
      const hashedPassword = await bcrypt.hash('TopSteel44!', 10);
      const adminId = await dataSource.query(`
        INSERT INTO users (nom, prenom, email, password, role, actif, acronyme, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        'Admin',
        'System',
        'admin@topsteel.tech',
        hashedPassword,
        'ADMIN',
        true,
        'TOP'
      ]);
      
      console.log('✅ Utilisateur admin créé avec l\'ID:', adminId[0].id);
      console.log('📝 Identifiants:');
      console.log('   Email: admin@topsteel.tech');
      console.log('   Mot de passe: TopSteel44!');
    }
    
    // 4. Vérifier la structure de la table users
    console.log('\n4. Vérification de la structure de la table users...');
    const tableInfo = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table users:');
    tableInfo.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 5. Lister tous les utilisateurs
    console.log('\n5. Liste de tous les utilisateurs:');
    const allUsers = await dataSource.query(`
      SELECT id, email, nom, prenom, role, actif, acronyme, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    if (allUsers.length === 0) {
      console.log('   Aucun utilisateur trouvé');
    } else {
      allUsers.forEach((user: any) => {
        console.log(`   - ${user.email} | ${user.nom} ${user.prenom} | ${user.role} | ${user.actif ? 'Actif' : 'Inactif'}`);
      });
    }
    
    // 6. Vérifier les seeds
    console.log('\n6. Vérification du statut des seeds...');
    const seedsStatus = await dataSource.query(`
      SELECT name, executed_at FROM seeds_status ORDER BY executed_at DESC
    `);
    
    if (seedsStatus.length === 0) {
      console.log('   Aucun seed exécuté');
      console.log('🔧 Vous devez exécuter les seeds pour initialiser les données');
      console.log('   Commande: npm run seed ou redémarrer l\'application');
    } else {
      seedsStatus.forEach((seed: any) => {
        console.log(`   - ${seed.name}: ${seed.executed_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await app.close();
  }
}

// Exécuter le diagnostic
diagnoseAdminUser().catch(console.error);