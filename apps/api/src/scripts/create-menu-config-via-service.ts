import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app/app.module'
import { MenuConfigurationService } from '../features/admin/services/menu-configuration.service'

async function bootstrap() {
  // Créer l'application NestJS
  const app = await NestFactory.createApplicationContext(AppModule)

  try {
    const menuConfigService = app.get(MenuConfigurationService)

    console.log('🔍 Vérification des configurations existantes...')
    const configs = await menuConfigService.findAllConfigurations()
    console.log(`✅ Trouvé ${configs.length} configuration(s)`)

    if (configs.length === 0) {
      console.log('📝 Création de la configuration par défaut...')
      const config = await menuConfigService.createDefaultConfiguration()
      console.log(`✅ Configuration créée: ${config.name} (ID: ${config.id})`)

      const menuTree = await menuConfigService.getMenuTree(config.id)
      console.log(`✅ Menu créé avec ${menuTree.length} élément(s) racine`)
    } else {
      console.log('ℹ️  Configuration(s) existante(s):')
      for (const config of configs) {
        const menuTree = await menuConfigService.getMenuTree(config.id)
        console.log(`  - ${config.name} (${config.isActive ? 'active' : 'inactive'}) - ${menuTree.length} éléments`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await app.close()
  }
}

bootstrap()
