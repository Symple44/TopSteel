# Architecture Technique TopSteel ERP

## Vue d'ensemble

TopSteel ERP est une application d'entreprise moderne construite sur une architecture microservices modulaire, utilisant les dernières technologies web pour offrir performance, scalabilité et maintenabilité.

## Stack technologique

### Frontend

#### Application principale (Next.js 15)
- **Framework**: Next.js 15 avec App Router
- **Language**: TypeScript 5.9
- **UI Library**: React 19
- **State Management**: Zustand 5.0
- **Data Fetching**: TanStack Query v5
- **Styling**: Tailwind CSS 4 + Radix UI
- **Forms**: React Hook Form + Zod validation
- **Build Tool**: Turbo + pnpm

#### Architecture Frontend

```
apps/web/
├── src/
│   ├── app/                 # App Router pages
│   │   ├── (auth)/          # Routes authentification
│   │   ├── (dashboard)/     # Routes protégées
│   │   └── api/             # Route handlers
│   ├── components/          # Composants React
│   │   ├── ui/             # Composants UI de base
│   │   ├── layout/         # Composants de layout
│   │   └── features/       # Composants métier
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilitaires et configs
│   ├── stores/             # Stores Zustand
│   └── types/              # Types TypeScript
```

### Backend

#### API principale (NestJS)
- **Framework**: NestJS 11
- **Language**: TypeScript 5.9
- **ORM**: TypeORM 0.3
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: Bull (Redis-based)
- **Documentation**: Swagger/OpenAPI
- **Authentication**: JWT + Passport

#### Architecture Backend

```
apps/api/
├── src/
│   ├── app/                # Module principal
│   ├── core/               # Services core
│   │   ├── database/       # Configuration DB
│   │   ├── config/         # Configuration app
│   │   └── common/         # Services partagés
│   ├── domains/            # Domaines métier
│   │   ├── auth/          # Authentification
│   │   ├── inventory/     # Gestion stocks
│   │   ├── partners/      # Partenaires
│   │   └── production/    # Production
│   ├── features/           # Features transverses
│   │   ├── search/        # Recherche globale
│   │   ├── notifications/ # Notifications
│   │   └── pricing/       # Tarification
│   └── infrastructure/     # Infrastructure
│       ├── cache/         # Cache Redis
│       ├── monitoring/    # Métriques
│       └── security/      # Sécurité
```

## Patterns architecturaux

### Domain-Driven Design (DDD)

```typescript
// Exemple d'entité métier
// domains/inventory/entities/article.entity.ts
@Entity('articles')
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  designation: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @OneToMany(() => StockMovement, movement => movement.article)
  movements: StockMovement[];

  // Domain logic
  calculateStockValue(): number {
    return this.quantity * this.price;
  }

  canBeDeleted(): boolean {
    return this.movements.length === 0;
  }
}
```

### Repository Pattern

```typescript
// domains/inventory/repositories/article.repository.ts
@Injectable()
export class ArticleRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {}

  async findByCode(code: string): Promise<Article | null> {
    return this.repository.findOne({
      where: { code },
      relations: ['movements'],
    });
  }

  async searchArticles(criteria: SearchCriteria): Promise<PaginatedResult<Article>> {
    const qb = this.repository.createQueryBuilder('article');

    if (criteria.search) {
      qb.where('article.designation ILIKE :search OR article.code ILIKE :search', {
        search: `%${criteria.search}%`,
      });
    }

    if (criteria.category) {
      qb.andWhere('article.category = :category', {
        category: criteria.category,
      });
    }

    const [items, total] = await qb
      .skip(criteria.offset)
      .take(criteria.limit)
      .getManyAndCount();

    return {
      items,
      total,
      page: criteria.page,
      pageSize: criteria.limit,
    };
  }
}
```

### Service Layer

```typescript
// domains/inventory/services/article.service.ts
@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createArticle(dto: CreateArticleDto): Promise<Article> {
    // Validation métier
    await this.validateArticleCode(dto.code);

    // Transaction
    const article = await this.articleRepository.save(dto);

    // Cache invalidation
    await this.cacheService.invalidate(`articles:*`);

    // Event emission
    this.eventEmitter.emit('article.created', {
      articleId: article.id,
      userId: dto.createdBy,
    });

    return article;
  }

  @Cacheable({ ttl: 300 })
  async getArticleByCode(code: string): Promise<Article> {
    const article = await this.articleRepository.findByCode(code);
    
    if (!article) {
      throw new NotFoundException(`Article ${code} not found`);
    }

    return article;
  }
}
```

## Communication inter-services

### API REST

```typescript
// controllers/article.controller.ts
@Controller('articles')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiTags('Articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @ApiOperation({ summary: 'Create new article' })
  @ApiResponse({ status: 201, type: Article })
  async create(@Body() dto: CreateArticleDto): Promise<Article> {
    return this.articleService.createArticle(dto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get article by code' })
  @ApiParam({ name: 'code', description: 'Article code' })
  async getByCode(@Param('code') code: string): Promise<Article> {
    return this.articleService.getArticleByCode(code);
  }

  @Get()
  @ApiOperation({ summary: 'Search articles' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  async search(@Query() query: SearchDto): Promise<PaginatedResult<Article>> {
    return this.articleService.searchArticles(query);
  }
}
```

### WebSocket (Real-time)

```typescript
// gateways/notifications.gateway.ts
@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  async handleConnection(client: Socket) {
    try {
      // Authentifier le socket
      const user = await this.authenticateSocket(client);
      
      // Enregistrer la connexion
      this.registerUserSocket(user.id, client.id);
      
      // Joindre les rooms
      client.join(`user:${user.id}`);
      client.join(`tenant:${user.tenantId}`);
      
      // Envoyer les notifications non lues
      const unread = await this.getUnreadNotifications(user.id);
      client.emit('unread_notifications', unread);
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.getUserFromSocket(client);
    await this.notificationService.markAsRead(data.notificationId, user.id);
    
    // Notifier tous les sockets de l'utilisateur
    this.server.to(`user:${user.id}`).emit('notification_read', {
      notificationId: data.notificationId,
    });
  }

  // Envoyer une notification
  async sendNotification(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }
}
```

### Event-Driven Architecture

```typescript
// events/inventory.events.ts
export class StockLowEvent {
  constructor(
    public readonly articleId: string,
    public readonly currentStock: number,
    public readonly minStock: number,
    public readonly siteId: string,
  ) {}
}

// listeners/stock.listener.ts
@Injectable()
export class StockListener {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  @OnEvent('stock.low')
  async handleStockLow(event: StockLowEvent) {
    // Créer une notification
    await this.notificationService.create({
      type: 'STOCK_ALERT',
      severity: 'WARNING',
      title: 'Stock bas détecté',
      message: `Le stock de l'article ${event.articleId} est bas`,
      data: event,
    });

    // Envoyer un email aux responsables
    const managers = await this.getStockManagers(event.siteId);
    
    for (const manager of managers) {
      await this.emailService.send({
        to: manager.email,
        template: 'stock-alert',
        data: {
          article: event.articleId,
          currentStock: event.currentStock,
          minStock: event.minStock,
        },
      });
    }
  }
}
```

## Gestion des données

### Migrations de base de données

```typescript
// migrations/1738000000000-CreateArticlesTable.ts
export class CreateArticlesTable1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'articles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'designation',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_ARTICLES_CODE',
            columnNames: ['code'],
          },
          {
            name: 'IDX_ARTICLES_CATEGORY',
            columnNames: ['category'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('articles');
  }
}
```

### Stratégie de cache

```typescript
// cache/cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache-aside pattern
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300,
  ): Promise<T> {
    // Essayer de récupérer depuis le cache
    const cached = await this.get<T>(key);
    if (cached) return cached;

    // Sinon, calculer et mettre en cache
    const value = await factory();
    await this.set(key, value, ttl);
    
    return value;
  }
}

// Décorateur pour cache automatique
export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService;
      
      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      return cacheService.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        options.ttl || 300,
      );
    };

    return descriptor;
  };
}
```

## Sécurité

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant Database
    participant Redis

    Client->>API: POST /auth/login
    API->>AuthService: validateCredentials()
    AuthService->>Database: findUser()
    Database-->>AuthService: User
    AuthService->>AuthService: validatePassword()
    AuthService->>AuthService: generateTokens()
    AuthService->>Redis: storeSession()
    AuthService-->>API: { accessToken, refreshToken }
    API-->>Client: 200 OK + Tokens

    Client->>API: GET /protected (Bearer token)
    API->>AuthService: validateToken()
    AuthService->>Redis: checkSession()
    Redis-->>AuthService: Session valid
    AuthService-->>API: User context
    API->>API: Process request
    API-->>Client: 200 OK + Data
```

### Security Middleware Stack

```typescript
// main.ts - Configuration de sécurité
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet pour les headers de sécurité
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limite par IP
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Compression
  app.use(compression());

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Exception filters
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new TimeoutInterceptor(),
  );

  await app.listen(process.env.PORT || 3002);
}
```

## Performance

### Optimisations appliquées

#### 1. Database Query Optimization

```typescript
// Utilisation d'index composites
@Index(['tenantId', 'status', 'createdAt'])
@Entity()
export class Order {
  // ...
}

// Query avec pagination cursor
async getPaginatedOrders(cursor?: string, limit: number = 20) {
  const qb = this.orderRepository
    .createQueryBuilder('order')
    .select(['order.id', 'order.code', 'order.status']) // Projection
    .leftJoinAndSelect('order.client', 'client')
    .where('order.tenantId = :tenantId', { tenantId });

  if (cursor) {
    qb.andWhere('order.id > :cursor', { cursor });
  }

  return qb
    .orderBy('order.id', 'ASC')
    .limit(limit + 1) // +1 pour savoir s'il y a une page suivante
    .getMany();
}
```

#### 2. API Response Caching

```typescript
@Controller('products')
export class ProductController {
  @Get()
  @CacheKey('products')
  @CacheTTL(300)
  async getProducts(@Query() query: FilterDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @CacheKey('product')
  @CacheTTL(600)
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @CacheEvict('products*') // Invalider le cache
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}
```

#### 3. Lazy Loading & Code Splitting

```typescript
// Frontend - Dynamic imports
const DashboardModule = lazy(() => import('./modules/dashboard'));
const InventoryModule = lazy(() => import('./modules/inventory'));
const ReportsModule = lazy(() => import('./modules/reports'));

// Route-based code splitting
export const routes = [
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<Loading />}>
        <DashboardModule />
      </Suspense>
    ),
  },
  {
    path: '/inventory',
    element: (
      <Suspense fallback={<Loading />}>
        <InventoryModule />
      </Suspense>
    ),
  },
];
```

### Monitoring & Observability

```typescript
// monitoring/metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly metrics = {
    httpRequestDuration: new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    }),
    
    databaseQueryDuration: new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    
    activeUsers: new Gauge({
      name: 'active_users_total',
      help: 'Number of active users',
      labelNames: ['tenant'],
    }),
  };

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.metrics.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
  }

  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.metrics.databaseQueryDuration
      .labels(operation, table)
      .observe(duration);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// article.service.spec.ts
describe('ArticleService', () => {
  let service: ArticleService;
  let repository: MockRepository<Article>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    repository = module.get(ArticleRepository);
  });

  describe('createArticle', () => {
    it('should create an article successfully', async () => {
      const dto: CreateArticleDto = {
        code: 'ART001',
        designation: 'Test Article',
        price: 100,
      };

      repository.findByCode.mockResolvedValue(null);
      repository.save.mockResolvedValue({ id: '123', ...dto });

      const result = await service.createArticle(dto);

      expect(result).toHaveProperty('id');
      expect(result.code).toBe(dto.code);
      expect(repository.save).toHaveBeenCalledWith(dto);
    });

    it('should throw error if code already exists', async () => {
      const dto: CreateArticleDto = {
        code: 'ART001',
        designation: 'Test Article',
        price: 100,
      };

      repository.findByCode.mockResolvedValue({ id: 'existing' } as Article);

      await expect(service.createArticle(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
```

### Integration Tests

```typescript
// app.e2e-spec.ts
describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login pour obtenir le token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = response.body.accessToken;
  });

  describe('/articles (GET)', () => {
    it('should return articles list', () => {
      return request(app.getHttpServer())
        .get('/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test-tenant')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Performance Tests

```typescript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 50 },  // Ramp-up to 50
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.1'],    // Taux d'erreur < 10%
  },
};

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  };

  // Test endpoint articles
  const res = http.get('http://localhost:3002/api/articles', params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has items': (r) => JSON.parse(r.body).items !== undefined,
  });

  sleep(1);
}
```

## DevOps & Deployment

### CI/CD Pipeline

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run linting
        run: pnpm lint
        
      - name: Run type checking
        run: pnpm type-check
        
      - name: Run tests
        run: pnpm test:cov
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -f Dockerfile.api -t topsteel/api:${{ github.sha }} .
          docker build -f Dockerfile.web -t topsteel/web:${{ github.sha }} .
          
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push topsteel/api:${{ github.sha }}
          docker push topsteel/web:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/topsteel
            docker-compose pull
            docker-compose up -d --no-deps api web
            docker system prune -f
```

### Infrastructure as Code

```terraform
# infrastructure/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "topsteel-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["eu-west-3a", "eu-west-3b", "eu-west-3c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  
  tags = {
    Environment = "production"
    Project     = "TopSteel"
  }
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"
  
  identifier = "topsteel-db"
  
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.r6g.xlarge"
  allocated_storage = 100
  storage_encrypted = true
  
  db_name  = "topsteel"
  username = "topsteel_admin"
  port     = "5432"
  
  vpc_security_group_ids = [module.security_group.security_group_id]
  subnet_ids             = module.vpc.database_subnets
  
  backup_retention_period = 30
  backup_window          = "03:00-06:00"
  maintenance_window     = "Mon:00:00-Mon:03:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Environment = "production"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "topsteel-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    main = {
      desired_size = 3
      min_size     = 2
      max_size     = 10
      
      instance_types = ["t3.large"]
      
      k8s_labels = {
        Environment = "production"
        Application = "topsteel"
      }
    }
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "topsteel-cache"
  engine              = "redis"
  node_type           = "cache.r6g.large"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
  
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [module.security_group.security_group_id]
  
  tags = {
    Environment = "production"
  }
}
```

## Conclusion

Cette architecture technique offre:
- **Modularité**: Séparation claire des responsabilités
- **Scalabilité**: Architecture prête pour la croissance
- **Maintenabilité**: Code organisé et documenté
- **Performance**: Optimisations à tous les niveaux
- **Sécurité**: Défense en profondeur
- **Observabilité**: Monitoring complet

Pour plus de détails sur des aspects spécifiques, consultez les autres sections de la documentation.