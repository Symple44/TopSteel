import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleController } from './controllers/article.controller'
import { Article } from './entities/article.entity'
import { ArticleRepositoryImpl } from './repositories/article-repository.impl'
import { ArticleService } from './services/article.service'

/**
 * Module pour la gestion des articles/inventaire
 */
@Module({
  imports: [TypeOrmModule.forFeature([Article], 'tenant')],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    {
      provide: 'IArticleRepository',
      useClass: ArticleRepositoryImpl,
    },
  ],
  exports: [ArticleService],
})
export class InventoryModule {}
