# TopSteel Marketplace - Developer Documentation

## Quick Start

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 15+
- Redis 7+
- pnpm 8+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/topsteel/marketplace.git
cd marketplace

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
pnpm migrate:run

# Seed database (development only)
pnpm seed

# Start development servers
pnpm dev
```

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/topsteel_marketplace
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=topsteel-marketplace
AWS_REGION=eu-west-1

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_LICENSE_KEY=
```

## Architecture

### Tech Stack

#### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **ORM**: TypeORM 0.3.x
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: Bull (Redis-based)
- **API**: REST + GraphQL (optional)
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

#### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript 5.x
- **State**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **Testing**: Vitest + Playwright

### Project Structure

```
topsteel/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── features/       # Feature modules
│   │   │   │   ├── marketplace/
│   │   │   │   │   ├── entities/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── tests/
│   │   │   ├── common/         # Shared utilities
│   │   │   ├── config/         # Configuration
│   │   │   └── main.ts         # Entry point
│   │   └── test/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── features/      # Feature modules
│   │   │   │   └── marketplace/
│   │   │   ├── components/    # Shared components
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── lib/          # Utilities
│   │   │   └── styles/       # Global styles
│   │   └── public/
│   └── e2e/                   # E2E tests
├── packages/
│   ├── shared/               # Shared types/utils
│   ├── ui/                   # UI component library
│   └── config/               # Shared configs
├── docs/                      # Documentation
├── scripts/                   # Build/deploy scripts
└── docker/                    # Docker configs
```

## API Development

### Creating a New Module

```typescript
// marketplace-module.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceProduct } from './entities/marketplace-product.entity';
import { MarketplaceProductService } from './services/marketplace-product.service';
import { MarketplaceProductController } from './controllers/marketplace-product.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceProduct]),
  ],
  controllers: [MarketplaceProductController],
  providers: [MarketplaceProductService],
  exports: [MarketplaceProductService],
})
export class MarketplaceModule {}
```

### Entity Definition

```typescript
// marketplace-product.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('marketplace_products')
@Index(['tenantId', 'sku'], { unique: true })
@Index(['tenantId', 'isActive', 'categoryId'])
export class MarketplaceProduct {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column()
  @ApiProperty({ example: 'topsteel-corp' })
  tenantId: string;

  @Column()
  @ApiProperty({ example: 'BEAM-001' })
  sku: string;

  @Column()
  @ApiProperty({ example: 'Steel Beam 10m' })
  name: string;

  @Column('text', { nullable: true })
  @ApiProperty({ example: 'High-quality steel beam for construction' })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ example: 299.99 })
  price: number;

  @Column('int', { default: 0 })
  @ApiProperty({ example: 100 })
  stockQuantity: number;

  @Column('jsonb', { nullable: true })
  @ApiProperty({ example: { length: '10m', weight: '150kg' } })
  specifications?: Record<string, any>;

  @Column({ default: true })
  @ApiProperty({ example: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Service Implementation

```typescript
// marketplace-product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class MarketplaceProductService {
  constructor(
    @InjectRepository(MarketplaceProduct)
    private productRepository: Repository<MarketplaceProduct>,
  ) {}

  async create(
    tenantId: string,
    createProductDto: CreateProductDto,
  ): Promise<MarketplaceProduct> {
    const product = this.productRepository.create({
      ...createProductDto,
      tenantId,
    });
    return this.productRepository.save(product);
  }

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<{
    items: MarketplaceProduct[];
    total: number;
    page: number;
    pages: number;
  }> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;

    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = :isActive', { isActive: true });

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy(`product.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<MarketplaceProduct> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    tenantId: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<MarketplaceProduct> {
    const product = await this.findOne(tenantId, id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const product = await this.findOne(tenantId, id);
    product.isActive = false;
    await this.productRepository.save(product);
  }
}
```

### Controller with Swagger

```typescript
// marketplace-product.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MarketplaceProductService } from '../services/marketplace-product.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantId } from '@/common/decorators/tenant-id.decorator';

@ApiTags('Products')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('marketplace/products')
export class MarketplaceProductController {
  constructor(private readonly productService: MarketplaceProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @TenantId() tenantId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(tenantId, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll(
    @TenantId() tenantId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.productService.findAll(tenantId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.productService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(tenantId, id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.productService.remove(tenantId, id);
  }
}
```

### DTO with Validation

```typescript
// product.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'BEAM-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'Steel Beam 10m' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'High-quality steel beam', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({ example: { length: '10m' }, required: false })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

## Frontend Development

### Page Component

```tsx
// app/marketplace/products/page.tsx
import { Suspense } from 'react';
import { ProductList } from '@/features/marketplace/components/ProductList';
import { ProductFilters } from '@/features/marketplace/components/ProductFilters';
import { ProductListSkeleton } from '@/features/marketplace/components/ProductListSkeleton';

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <ProductFilters />
        </aside>
        
        <main className="lg:col-span-3">
          <Suspense fallback={<ProductListSkeleton />}>
            <ProductList />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

### React Component

```tsx
// features/marketplace/components/ProductCard.tsx
import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useAddToCart } from '../hooks/useAddToCart';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const { mutate: addToCart, isLoading } = useAddToCart();

  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity: 1 });
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow">
      <Link href={`/marketplace/products/${product.id}`}>
        <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={product.imageUrl || '/placeholder.png'}
            alt={product.name}
            width={300}
            height={300}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
          />
        </div>
      </Link>

      <button
        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        aria-label="Add to wishlist"
      >
        <Heart className="w-5 h-5" />
      </button>

      <div className="p-4">
        <Link href={`/marketplace/products/${product.id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(product.price)}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stockQuantity}
          </span>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isLoading || product.stockQuantity === 0}
          className="w-full"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
};
```

### Custom Hook

```typescript
// features/marketplace/hooks/useAddToCart.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface AddToCartParams {
  productId: string;
  quantity: number;
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToCartParams) => {
      const response = await api.post('/marketplace/cart/add', params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Product added to cart');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });
}
```

### Redux Store Slice

```typescript
// features/marketplace/store/cartSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async () => {
    const response = await api.get('/marketplace/cart');
    return response.data;
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity }: { productId: string; quantity: number }) => {
    const response = await api.post('/marketplace/cart/add', {
      productId,
      quantity,
    });
    return response.data;
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find(i => i.productId === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        item.subtotal = item.price * item.quantity;
        state.total = state.items.reduce((sum, i) => sum + i.subtotal, 0);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cart';
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.total = action.payload.total;
      });
  },
});

export const { clearCart, updateQuantity } = cartSlice.actions;
export default cartSlice.reducer;
```

## Testing

### Unit Test

```typescript
// marketplace-product.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceProductService } from './marketplace-product.service';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { NotFoundException } from '@nestjs/common';

describe('MarketplaceProductService', () => {
  let service: MarketplaceProductService;
  let repository: Repository<MarketplaceProduct>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceProductService,
        {
          provide: getRepositoryToken(MarketplaceProduct),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MarketplaceProductService>(MarketplaceProductService);
    repository = module.get<Repository<MarketplaceProduct>>(
      getRepositoryToken(MarketplaceProduct),
    );
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      const product = { id: '1', name: 'Test Product' };
      mockRepository.findOne.mockResolvedValue(product);

      const result = await service.findOne('tenant-1', '1');
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', '999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

### E2E Test

```typescript
// marketplace.e2e-spec.ts
import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  test('should display products', async ({ page }) => {
    await page.goto('/marketplace/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Check if products are displayed
    const products = page.locator('[data-testid="product-card"]');
    await expect(products).toHaveCount(20); // Default pagination
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/marketplace/products');
    
    // Click first product's add to cart button
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
    
    // Check cart badge updated
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // Check toast notification
    await expect(page.locator('.toast')).toContainText('Product added to cart');
  });

  test('should complete checkout', async ({ page }) => {
    // Add product to cart
    await page.goto('/marketplace/products');
    await page.click('[data-testid="add-to-cart"]');
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    
    // Proceed to checkout
    await page.click('button:has-text("Checkout")');
    
    // Fill shipping info
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+33123456789');
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'Paris');
    await page.fill('input[name="postalCode"]', '75001');
    
    // Continue through checkout steps
    await page.click('button:has-text("Continue")');
    // ... more steps
    
    // Place order
    await page.click('button:has-text("Place Order")');
    
    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('h1')).toContainText('Order Confirmed');
  });
});
```

## Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build applications
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built applications
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Environment
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/apps/api/main.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: topsteel_marketplace
      POSTGRES_USER: topsteel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://topsteel:${DB_PASSWORD}@postgres:5432/topsteel_marketplace
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/deployment.yaml
            k8s/service.yaml
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

## Best Practices

### Code Style

```typescript
// ✅ Good
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
  ) {}

  async findOne(id: string): Promise<Product> {
    // Check cache first
    const cached = await this.cacheService.get(`product:${id}`);
    if (cached) return cached;

    // Fetch from database
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // Cache for 5 minutes
    await this.cacheService.set(`product:${id}`, product, 300);
    
    return product;
  }
}

// ❌ Bad
export class ProductService {
  async findOne(id) {
    const product = await this.productRepository.findOne(id);
    return product;
  }
}
```

### Security

1. **Input Validation**: Always validate and sanitize input
2. **Authentication**: Use JWT with proper expiration
3. **Authorization**: Implement RBAC (Role-Based Access Control)
4. **Rate Limiting**: Protect against abuse
5. **SQL Injection**: Use parameterized queries (TypeORM does this)
6. **XSS Protection**: Sanitize user content
7. **CSRF Protection**: Use CSRF tokens for state-changing operations
8. **Secrets Management**: Never commit secrets, use environment variables
9. **HTTPS**: Always use HTTPS in production
10. **Security Headers**: Use helmet.js for security headers

### Performance

1. **Database Indexes**: Add indexes for frequently queried columns
2. **Caching**: Use Redis for frequently accessed data
3. **Pagination**: Always paginate large datasets
4. **Lazy Loading**: Load related data only when needed
5. **Connection Pooling**: Configure database connection pools
6. **CDN**: Use CDN for static assets
7. **Compression**: Enable gzip/brotli compression
8. **Image Optimization**: Optimize and lazy load images
9. **Code Splitting**: Split code by route/component
10. **Monitoring**: Use APM tools (New Relic, DataDog)

## Troubleshooting

### Common Issues

#### Database Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Check PostgreSQL is running and credentials are correct

#### Redis Connection Error
```bash
Error: Redis connection to localhost:6379 failed
```
**Solution**: Start Redis server or check REDIS_URL

#### TypeORM Migration Error
```bash
QueryFailedError: relation "marketplace_products" already exists
```
**Solution**: Check migration history: `pnpm typeorm migration:show`

#### Build Error
```bash
Cannot find module '@/common/decorators/tenant-id.decorator'
```
**Solution**: Check tsconfig paths configuration

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io)
- [Stripe API Reference](https://stripe.com/docs/api)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)

## Support

- **Slack**: #marketplace-dev
- **Email**: dev-team@topsteel.com
- **Wiki**: https://wiki.topsteel.com/marketplace
- **Issues**: https://github.com/topsteel/marketplace/issues