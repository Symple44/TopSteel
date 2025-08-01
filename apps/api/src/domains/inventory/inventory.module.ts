import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Article } from './entities/article.entity'
import { ArticleService } from './services/article.service'
import { ArticleRepositoryImpl } from './repositories/article-repository.impl'

/**
 * Module pour la gestion des articles/inventaire
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Article], 'tenant')
  ],
  controllers: [
    // Le contrôleur sera ajouté quand il sera créé
  ],
  providers: [
    ArticleService,
    {
      provide: 'IArticleRepository',
      useClass: ArticleRepositoryImpl
    }
  ],
  exports: [ArticleService]
})
export class InventoryModule {}