import { OptimizedCacheService } from '../common/cache/redis-optimized.service';

async function testRedisConnection() {
  console.log('🔍 Test de connexion Redis...');
  
  // Vérifier les variables d'environnement
  console.log(`REDIS_ENABLED: ${process.env.REDIS_ENABLED}`);
  console.log(`REDIS_HOST: ${process.env.REDIS_HOST}`);
  console.log(`REDIS_PORT: ${process.env.REDIS_PORT}`);
  console.log(`REDIS_DB: ${process.env.REDIS_DB}`);
  
  if (process.env.REDIS_ENABLED !== 'true') {
    console.log('❌ Redis est désactivé dans la configuration');
    process.exit(1);
  }
  
  const cacheService = new OptimizedCacheService();
  
  try {
    // Test d'écriture
    console.log('📝 Test d\'écriture...');
    await cacheService.set('test:connection', { 
      message: 'Redis fonctionne!', 
      timestamp: new Date().toISOString() 
    }, 30);
    
    // Test de lecture
    console.log('📖 Test de lecture...');
    const result = await cacheService.get('test:connection');
    console.log('✅ Données récupérées:', result);
    
    // Test d'invalidation
    console.log('🗑️ Test d\'invalidation...');
    await cacheService.invalidatePattern('test:*');
    
    const afterDelete = await cacheService.get('test:connection');
    console.log('🔍 Après suppression:', afterDelete);
    
    if (afterDelete === null) {
      console.log('🎉 Tous les tests Redis sont passés !');
      console.log('✅ Redis est opérationnel avec votre configuration');
    } else {
      console.log('⚠️ Problème avec l\'invalidation des clés');
    }
    
  } catch (error: any) {
    console.error('❌ Erreur Redis:', error.message);
    console.log('💡 Vérifiez que Redis est démarré et accessible');
    process.exit(1);
  }
}

// Charger les variables d'environnement
import dotenv from 'dotenv';
import path from 'path';

// Charger depuis le fichier racine
dotenv.config({ path: path.join(__dirname, '../../../../.env.local') });

testRedisConnection().catch(console.error);