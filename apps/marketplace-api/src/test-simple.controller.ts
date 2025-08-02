import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'

@ApiTags('test')
@Controller('test-simple')
export class TestSimpleController {
  @Get('products')
  @ApiOperation({ summary: 'Simple test products without any guards or dependencies' })
  async getTestProducts() {
    return [
      {
        id: 'simple-test-1',
        erpArticleId: 'SIMPLE001',
        reference: 'SIMPLE001',
        designation: 'Produit de test simple',
        description: 'Test sans aucune dépendance',
        basePrice: 25.99,
        calculatedPrice: 25.99,
        stockDisponible: 100,
        images: [{ url: '/test-image.jpg', alt: 'Test image', isMain: true }],
        categories: ['Test'],
        tags: ['simple', 'test'],
        inStock: true,
        isActive: true,
        isFeatured: true,
        seo: {
          title: 'Produit de test simple',
          description: 'Test sans aucune dépendance',
          slug: 'simple-test-product'
        }
      }
    ]
  }

  @Get('health')
  @ApiOperation({ summary: 'Simple health check' })
  async simpleHealth() {
    return {
      status: 'ok',
      message: 'Controller simple fonctionne',
      timestamp: new Date().toISOString()
    }
  }
}