import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { UsersService } from '../modules/users/users.service';

async function testAdminLogin() {
  console.log('🧪 Test de connexion utilisateur admin...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);

  try {
    // Test 1: Vérifier que l'utilisateur existe
    console.log('1. Vérification de l\'existence de l\'utilisateur...');
    const adminUser = await usersService.findByEmail('admin@topsteel.tech');
    
    if (!adminUser) {
      console.log('❌ Utilisateur admin@topsteel.tech non trouvé');
      console.log('🔧 Exécutez d\'abord: npm run script:create-admin-user');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      actif: adminUser.actif
    });
    
    // Test 2: Test avec email
    console.log('\n2. Test de connexion avec email...');
    try {
      const result = await authService.validateUser('admin@topsteel.tech', 'TopSteel44!');
      console.log('✅ Validation avec email réussie:', {
        id: result.id,
        email: result.email,
        role: result.role
      });
    } catch (error) {
      console.log('❌ Échec de la validation avec email:', error.message);
    }
    
    // Test 3: Test avec acronyme
    console.log('\n3. Test de connexion avec acronyme...');
    try {
      const result = await authService.validateUser('TOP', 'TopSteel44!');
      console.log('✅ Validation avec acronyme réussie:', {
        id: result.id,
        email: result.email,
        role: result.role
      });
    } catch (error) {
      console.log('❌ Échec de la validation avec acronyme:', error.message);
    }
    
    // Test 4: Tester un mot de passe incorrect
    console.log('\n4. Test avec mot de passe incorrect (doit échouer)...');
    try {
      await authService.validateUser('admin@topsteel.tech', 'WrongPassword');
      console.log('❌ PROBLÈME: Validation réussie avec un mauvais mot de passe !');
    } catch (error) {
      console.log('✅ Échec attendu avec mauvais mot de passe:', error.message);
    }
    
    // Test 5: Login complet
    console.log('\n5. Test de login complet...');
    try {
      const loginResult = await authService.login({
        login: 'admin@topsteel.tech',
        password: 'TopSteel44!'
      });
      
      if (loginResult.requiresMFA) {
        console.log('⚠️  MFA requis pour cet utilisateur');
        console.log('Méthodes disponibles:', loginResult.availableMethods);
      } else {
        console.log('✅ Login complet réussi');
        console.log('Access Token généré:', loginResult.accessToken ? '✅' : '❌');
        console.log('Refresh Token généré:', loginResult.refreshToken ? '✅' : '❌');
      }
    } catch (error) {
      console.log('❌ Échec du login complet:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await app.close();
  }
}

// Exécuter le test
testAdminLogin().catch(console.error);