import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import type { BusinessContext } from '../../core/interfaces/business-service.interface'
import type { User } from '../../users/entities/user.entity'
import type { CreateArticleDto, UpdateArticleDto } from '../dto'
import type { Article, ArticleStatus, ArticleType } from '../entities/article.entity'
import type {
  ArticleSearchCriteria,
  ArticleService,
  ArticleStatistics,
  StockValorisation,
} from '../services/article.service'

@ApiTags('Articles')
@Controller('api/business/articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir la liste des articles avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des articles récupérée avec succès' })
  async findAll(
    @CurrentUser() _user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: ArticleType,
    @Query('status') status?: ArticleStatus,
    @Query('famille') famille?: string,
    @Query('marque') marque?: string,
    @Query('stockCondition') stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ) {
    const criteria: ArticleSearchCriteria = {
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      designation: search,
      reference: search,
      type: type,
      status: status,
      famille: famille,
      marque: marque,
      stockCondition,
      sortBy: sortBy || 'reference',
      sortOrder: sortOrder || 'ASC',
    }

    return await this.articleService.searchArticles(criteria)
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtenir les statistiques des articles' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStatistics(@CurrentUser() user: User): Promise<ArticleStatistics> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.getStatistiques(context)
  }

  @Get('valorisation')
  @ApiOperation({ summary: 'Calculer la valorisation du stock' })
  @ApiResponse({ status: 200, description: 'Valorisation calculée avec succès' })
  async getValorisationStock(
    @CurrentUser() user: User,
    @Query('famille') famille?: string
  ): Promise<StockValorisation> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.calculerValorisationStock(famille, context)
  }

  @Get('rupture')
  @ApiOperation({ summary: 'Obtenir les articles en rupture' })
  @ApiResponse({ status: 200, description: 'Articles en rupture récupérés avec succès' })
  async getArticlesEnRupture(@CurrentUser() user: User): Promise<Article[]> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.getArticlesEnRupture(context)
  }

  @Get('sous-stock-mini')
  @ApiOperation({ summary: 'Obtenir les articles sous stock minimum' })
  @ApiResponse({ status: 200, description: 'Articles sous stock minimum récupérés avec succès' })
  async getArticlesSousStockMini(@CurrentUser() user: User): Promise<Article[]> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.getArticlesSousStockMini(context)
  }

  @Get('a-reapprovisionner')
  @ApiOperation({ summary: 'Obtenir les articles à réapprovisionner' })
  @ApiResponse({ status: 200, description: 'Articles à réapprovisionner récupérés avec succès' })
  async getArticlesAReapprovisionner(@CurrentUser() user: User): Promise<Article[]> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.getArticlesAReapprovisionner(context)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un article par son ID' })
  @ApiResponse({ status: 200, description: 'Article récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Article non trouvé' })
  async findById(@Param('id') id: string, @CurrentUser() user: User): Promise<Article> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    const article = await this.articleService.findById(id, context)
    if (!article) {
      throw new NotFoundException('Article introuvable')
    }
    return article
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel article' })
  @ApiResponse({ status: 201, description: 'Article créé avec succès' })
  async create(@Body() createData: CreateArticleDto, @CurrentUser() user: User): Promise<Article> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.create(createData as Partial<Article>, context)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un article' })
  @ApiResponse({ status: 200, description: 'Article modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Article non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateArticleDto,
    @CurrentUser() user: User
  ): Promise<Article> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.update(id, updateData as Partial<Article>, context)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un article' })
  @ApiResponse({ status: 204, description: 'Article supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Article non trouvé' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    await this.articleService.delete(id, context)
  }

  @Post(':id/inventaire')
  @ApiOperation({ summary: 'Effectuer un inventaire sur un article' })
  @ApiResponse({ status: 200, description: 'Inventaire effectué avec succès' })
  async effectuerInventaire(
    @Param('id') id: string,
    @Body() inventaireData: { stockPhysiqueReel: number; commentaire?: string },
    @CurrentUser() user: User
  ): Promise<Article> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.effectuerInventaire(
      id,
      inventaireData.stockPhysiqueReel,
      inventaireData.commentaire,
      context
    )
  }

  @Post(':id/dupliquer')
  @ApiOperation({ summary: 'Dupliquer un article' })
  @ApiResponse({ status: 201, description: 'Article dupliqué avec succès' })
  async dupliquer(
    @Param('id') id: string,
    @Body() duplicationData: { nouvelleReference: string; modifications?: Partial<Article> },
    @CurrentUser() user: User
  ): Promise<Article> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.dupliquerArticle(
      id,
      duplicationData.nouvelleReference,
      duplicationData.modifications,
      context
    )
  }

  @Post('reapprovisionner/:fournisseurId')
  @ApiOperation({ summary: 'Créer une commande de réapprovisionnement' })
  @ApiResponse({ status: 200, description: 'Commande créée avec succès' })
  async creerCommandeReapprovisionnement(
    @Param('fournisseurId') fournisseurId: string,
    @CurrentUser() user: User
  ): Promise<{ articles: Article[]; quantitesTotales: number }> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'a4a21147-ef1b-489c-8769-067bc45da723',
      userRoles: [user.role],
      permissions: [],
    }
    return await this.articleService.creerCommandeReapprovisionnement(fournisseurId, context)
  }
}
