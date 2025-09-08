# TopSteel ERP - TypeORM Patterns Guide

*Quick Reference for Database Operations*

## Table of Contents

- [Entity Patterns](#entity-patterns)
- [Repository Patterns](#repository-patterns)
- [Query Patterns](#query-patterns)
- [Relationship Patterns](#relationship-patterns)
- [Migration Patterns](#migration-patterns)
- [Performance Patterns](#performance-patterns)
- [Multi-Tenant Patterns](#multi-tenant-patterns)

## Entity Patterns

### Base Entity Structure

```typescript
// Base entity for all tables
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Column
} from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date

  @VersionColumn({ default: 1 })
  version!: number
}

// Auditable entity with user tracking
export abstract class BaseAuditEntity extends BaseEntity {
  @Column({ name: 'created_by_id', nullable: true, type: 'uuid' })
  createdById?: string

  @Column({ name: 'updated_by_id', nullable: true, type: 'uuid' })
  updatedById?: string
}

// Multi-tenant entity
export abstract class TenantEntity extends BaseAuditEntity {
  @Column('uuid')
  @Index()
  tenantId!: string

  @ManyToOne(() => Tenant, { eager: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant
}
```

### Standard Entity Examples

```typescript
@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'role'])
@Index(['tenantId', 'createdAt'])
export class User extends TenantEntity {
  @Column({ unique: false }) // Not globally unique, tenant-scoped
  email!: string

  @Column()
  name!: string

  @Column({ select: false }) // Exclude from default SELECT queries
  hashedPassword!: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole

  @Column({ nullable: true })
  lastLoginAt?: Date

  @Column('simple-json', { nullable: true })
  preferences?: UserPreferences

  // Computed column example
  @Column({ select: false })
  get displayName(): string {
    return this.name || this.email.split('@')[0]
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date()
  }

  @BeforeInsert()
  setDefaults() {
    if (!this.preferences) {
      this.preferences = { language: 'fr', emailNotifications: true }
    }
  }
}

@Entity('articles')
@Index(['tenantId', 'sku'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['tenantId', 'category'])
@Index(['searchVector'], { type: 'gin' }) // Full-text search
export class Article extends TenantEntity {
  @Column()
  sku!: string

  @Column()
  name!: string

  @Column('text', { nullable: true })
  description?: string

  @Column()
  category!: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price!: number

  @Column('int', { default: 0 })
  stockQuantity!: number

  @Column('jsonb', { nullable: true }) // PostgreSQL JSON
  specifications?: Record<string, any>

  @Column('tsvector', { select: false }) // Full-text search vector
  searchVector!: string

  @BeforeInsert()
  @BeforeUpdate()
  updateSearchVector() {
    const searchText = [this.name, this.description, this.sku]
      .filter(Boolean)
      .join(' ')
    // This would be handled by PostgreSQL trigger in production
    this.searchVector = searchText.toLowerCase()
  }
}

@Entity('orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'customerId'])
export class Order extends TenantEntity {
  @Column()
  orderNumber!: string

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT
  })
  status!: OrderStatus

  @Column('uuid')
  customerId!: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount!: number

  @Column({ nullable: true })
  notes?: string

  // Relationships
  @ManyToOne(() => Partner, partner => partner.orders, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer!: Partner

  @OneToMany(() => OrderItem, item => item.order, {
    cascade: ['insert', 'update'],
    orphanedRowAction: 'delete'
  })
  items!: OrderItem[]
}
```

## Repository Patterns

### Base Repository Class

```typescript
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm'
import { Injectable, Inject } from '@nestjs/common'

@Injectable()
export abstract class TenantRepository<T extends TenantEntity> {
  constructor(
    protected repository: Repository<T>,
    @Inject('TENANT_CONTEXT') protected tenantContext: TenantContext,
  ) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.find({
      ...options,
      where: {
        tenantId,
        ...options?.where,
      },
    })
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.findOne({
      ...options,
      where: {
        tenantId,
        ...options?.where,
      },
    })
  }

  async save(entity: DeepPartial<T>): Promise<T> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.save({
      ...entity,
      tenantId,
    } as any)
  }

  async remove(id: string): Promise<void> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    await this.repository.softDelete({ id, tenantId } as any)
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.count({
      ...options,
      where: {
        tenantId,
        ...options?.where,
      },
    })
  }
}
```

### Specific Repository Examples

```typescript
@Injectable()
export class UserRepository extends TenantRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
    @Inject('TENANT_CONTEXT') tenantContext: TenantContext,
  ) {
    super(repository, tenantContext)
  }

  async findByEmail(email: string): Promise<User | null> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.findOne({
      where: { 
        tenantId, 
        email: email.toLowerCase(),
        deletedAt: IsNull() // Only active users
      }
    })
  }

  async findWithRoles(id: string): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: {
        roles: true
      }
    })
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findAll({
      where: {
        deletedAt: IsNull()
      },
      order: { name: 'ASC' }
    })
  }

  async searchUsers(searchTerm: string, limit: number = 20): Promise<User[]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere(
        'user.name ILIKE :search OR user.email ILIKE :search',
        { search: `%${searchTerm}%` }
      )
      .orderBy('user.name', 'ASC')
      .limit(limit)
      .getMany()
  }

  async getUserStats(): Promise<UserStats> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    const query = this.repository.createQueryBuilder('user')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN user.role = :admin THEN 1 END) as admins',
        'COUNT(CASE WHEN user.role = :manager THEN 1 END) as managers',
        'COUNT(CASE WHEN user.role = :user THEN 1 END) as users',
      ])
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.deletedAt IS NULL')
      .setParameters({
        admin: UserRole.ADMIN,
        manager: UserRole.MANAGER,
        user: UserRole.USER,
      })

    return query.getRawOne()
  }
}

@Injectable()
export class ArticleRepository extends TenantRepository<Article> {
  constructor(
    @InjectRepository(Article)
    repository: Repository<Article>,
    @Inject('TENANT_CONTEXT') tenantContext: TenantContext,
  ) {
    super(repository, tenantContext)
  }

  async findBySku(sku: string): Promise<Article | null> {
    return this.findOne({
      where: { sku }
    })
  }

  async findByCategory(category: string): Promise<Article[]> {
    return this.findAll({
      where: { category },
      order: { name: 'ASC' }
    })
  }

  async searchArticles(query: ArticleSearchQuery): Promise<[Article[], number]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    const qb = this.repository.createQueryBuilder('article')
      .where('article.tenantId = :tenantId', { tenantId })
      .andWhere('article.deletedAt IS NULL')

    // Text search
    if (query.search) {
      qb.andWhere(
        'article.searchVector @@ plainto_tsquery(:search)',
        { search: query.search }
      )
    }

    // Category filter
    if (query.category) {
      qb.andWhere('article.category = :category', { category: query.category })
    }

    // Price range
    if (query.minPrice !== undefined) {
      qb.andWhere('article.price >= :minPrice', { minPrice: query.minPrice })
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('article.price <= :maxPrice', { maxPrice: query.maxPrice })
    }

    // Stock filter
    if (query.inStock) {
      qb.andWhere('article.stockQuantity > 0')
    }

    // Sorting
    const orderBy = query.sortBy || 'name'
    const orderDirection = query.sortDirection || 'ASC'
    qb.orderBy(`article.${orderBy}`, orderDirection)

    // Pagination
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100) // Max 100 items
    qb.skip((page - 1) * limit).take(limit)

    return qb.getManyAndCount()
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    await this.repository.update(
      { id, tenantId },
      { stockQuantity: () => `stock_quantity + ${quantity}` }
    )
  }

  async getLowStockArticles(threshold: number = 10): Promise<Article[]> {
    return this.findAll({
      where: {
        stockQuantity: LessThan(threshold)
      },
      order: { stockQuantity: 'ASC' }
    })
  }
}
```

## Query Patterns

### Basic Query Builder Patterns

```typescript
@Injectable()
export class OrderRepository extends TenantRepository<Order> {
  // Complex filtering with joins
  async findOrdersWithDetails(filters: OrderFilters): Promise<Order[]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    const qb = this.repository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.article', 'article')
      .where('order.tenantId = :tenantId', { tenantId })

    // Dynamic filtering
    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status })
    }

    if (filters.customerId) {
      qb.andWhere('order.customerId = :customerId', { customerId: filters.customerId })
    }

    if (filters.dateFrom) {
      qb.andWhere('order.createdAt >= :dateFrom', { dateFrom: filters.dateFrom })
    }

    if (filters.dateTo) {
      qb.andWhere('order.createdAt <= :dateTo', { dateTo: filters.dateTo })
    }

    if (filters.minAmount) {
      qb.andWhere('order.totalAmount >= :minAmount', { minAmount: filters.minAmount })
    }

    return qb.getMany()
  }

  // Aggregation queries
  async getOrderStatistics(period: 'day' | 'week' | 'month'): Promise<OrderStats[]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    let dateFormat: string
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD'
        break
      case 'week':
        dateFormat = 'YYYY-"W"WW'
        break
      case 'month':
        dateFormat = 'YYYY-MM'
        break
    }

    return this.repository.createQueryBuilder('order')
      .select([
        `TO_CHAR(order.createdAt, '${dateFormat}') as period`,
        'COUNT(*) as orderCount',
        'SUM(order.totalAmount) as totalAmount',
        'AVG(order.totalAmount) as averageAmount',
      ])
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.createdAt >= :startDate', { 
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      })
      .groupBy('period')
      .orderBy('period', 'DESC')
      .getRawMany()
  }

  // Subquery example
  async findOrdersWithMostItems(): Promise<Order[]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    const subQuery = this.repository.createQueryBuilder('o')
      .select('o.id')
      .leftJoin('o.items', 'i')
      .where('o.tenantId = :tenantId', { tenantId })
      .groupBy('o.id')
      .orderBy('COUNT(i.id)', 'DESC')
      .limit(10)

    return this.repository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.customer', 'customer')
      .where(`order.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .getMany()
  }

  // Raw SQL for complex operations
  async getMonthlyRevenue(): Promise<{ month: string; revenue: number }[]> {
    const tenantId = this.tenantContext.getCurrentTenantId()
    
    return this.repository.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE tenant_id = $1 
        AND created_at >= NOW() - INTERVAL '12 months'
        AND deleted_at IS NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `, [tenantId])
  }
}
```

### Advanced Query Patterns

```typescript
@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
  ) {}

  // Window functions
  async getTopCustomersByRevenue(limit: number = 10): Promise<CustomerRevenue[]> {
    return this.orderRepo.query(`
      SELECT 
        p.id,
        p.name,
        SUM(o.total_amount) as total_revenue,
        COUNT(o.id) as order_count,
        AVG(o.total_amount) as avg_order_value,
        ROW_NUMBER() OVER (ORDER BY SUM(o.total_amount) DESC) as rank
      FROM partners p
      JOIN orders o ON p.id = o.customer_id
      WHERE p.tenant_id = $1 
        AND o.tenant_id = $1
        AND o.deleted_at IS NULL
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT $2
    `, [this.tenantContext.getCurrentTenantId(), limit])
  }

  // CTE (Common Table Expression)
  async getProductPerformance(): Promise<ProductPerformance[]> {
    return this.articleRepo.query(`
      WITH sales_data AS (
        SELECT 
          a.id,
          a.name,
          a.category,
          SUM(oi.quantity) as total_sold,
          SUM(oi.unit_price * oi.quantity) as total_revenue
        FROM articles a
        JOIN order_items oi ON a.id = oi.article_id
        JOIN orders o ON oi.order_id = o.id
        WHERE a.tenant_id = $1 
          AND o.tenant_id = $1
          AND o.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY a.id, a.name, a.category
      ),
      category_stats AS (
        SELECT 
          category,
          AVG(total_revenue) as avg_category_revenue
        FROM sales_data
        GROUP BY category
      )
      SELECT 
        sd.*,
        cs.avg_category_revenue,
        (sd.total_revenue / cs.avg_category_revenue) as performance_ratio
      FROM sales_data sd
      JOIN category_stats cs ON sd.category = cs.category
      ORDER BY performance_ratio DESC
    `, [this.tenantContext.getCurrentTenantId()])
  }
}
```

## Relationship Patterns

### One-to-Many Relationships

```typescript
@Entity('orders')
export class Order extends TenantEntity {
  @ManyToOne(() => Partner, partner => partner.orders, {
    eager: false, // Don't auto-load
    onDelete: 'CASCADE' // Delete orders when partner is deleted
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Partner

  @OneToMany(() => OrderItem, item => item.order, {
    cascade: ['insert', 'update'], // Auto-save items with order
    orphanedRowAction: 'delete' // Delete orphaned items
  })
  items!: OrderItem[]
}

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column('uuid')
  orderId!: string

  @Column('uuid')
  articleId!: string

  @Column('int')
  quantity!: number

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice!: number

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order

  @ManyToOne(() => Article, { eager: true })
  @JoinColumn({ name: 'article_id' })
  article!: Article

  // Computed property
  get totalPrice(): number {
    return Number(this.unitPrice) * this.quantity
  }
}
```

### Many-to-Many Relationships

```typescript
@Entity('users')
export class User extends TenantEntity {
  @ManyToMany(() => Role, role => role.users, {
    cascade: ['insert'] // Only cascade inserts, not updates/deletes
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id'
    }
  })
  roles!: Role[]

  // Helper method
  hasRole(roleName: string): boolean {
    return this.roles.some(role => role.name === roleName)
  }
}

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name!: string

  @Column()
  description!: string

  @ManyToMany(() => User, user => user.roles)
  users!: User[]

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions'
  })
  permissions!: Permission[]
}
```

### Self-Referencing Relationships

```typescript
@Entity('categories')
export class Category extends TenantEntity {
  @Column()
  name!: string

  @Column({ nullable: true })
  parentId?: string

  @ManyToOne(() => Category, category => category.children, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category

  @OneToMany(() => Category, category => category.parent)
  children!: Category[]

  @TreeParent() // TypeORM tree support
  parentCategory?: Category

  @TreeChildren()
  childCategories!: Category[]

  // Get full path (e.g., "Electronics > Computers > Laptops")
  async getPath(): Promise<string> {
    const path: string[] = [this.name]
    let current = this.parent
    
    while (current) {
      path.unshift(current.name)
      current = current.parent
    }
    
    return path.join(' > ')
  }
}
```

## Migration Patterns

### Basic Migration Structure

```typescript
import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm'

export class CreateUsersTable1629123456789 implements MigrationInterface {
  name = 'CreateUsersTable1629123456789'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'hashed_password',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['super_admin', 'admin', 'manager', 'user'],
            default: "'user'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
          },
        ],
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_tenant_email', ['tenant_id', 'email'], { isUnique: true })
    )

    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_tenant_role', ['tenant_id', 'role'])
    )

    // Create foreign key
    await queryRunner.createForeignKey(
      'users',
      new ForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    )

    // Create trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users')
    await queryRunner.dropTable('users')
  }
}
```

### Data Migration Pattern

```typescript
export class SeedInitialData1629123456790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert system tenant
    await queryRunner.query(`
      INSERT INTO tenants (id, name, slug, created_at)
      VALUES (
        gen_random_uuid(),
        'System',
        'system',
        now()
      )
    `)

    // Get system tenant ID for reference
    const [systemTenant] = await queryRunner.query(`
      SELECT id FROM tenants WHERE slug = 'system'
    `)

    // Insert default roles
    const roles = [
      { name: 'super_admin', description: 'Super Administrator' },
      { name: 'admin', description: 'Administrator' },
      { name: 'manager', description: 'Manager' },
      { name: 'user', description: 'Regular User' },
    ]

    for (const role of roles) {
      await queryRunner.query(`
        INSERT INTO roles (id, name, description, created_at)
        VALUES (gen_random_uuid(), $1, $2, now())
      `, [role.name, role.description])
    }

    // Insert system admin user
    await queryRunner.query(`
      INSERT INTO users (id, tenant_id, email, name, hashed_password, role, created_at)
      VALUES (
        gen_random_uuid(),
        $1,
        'admin@system.local',
        'System Administrator',
        '$2b$10$YourHashedPasswordHere',
        'super_admin',
        now()
      )
    `, [systemTenant.id])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email = 'admin@system.local'`)
    await queryRunner.query(`DELETE FROM roles WHERE name IN ('super_admin', 'admin', 'manager', 'user')`)
    await queryRunner.query(`DELETE FROM tenants WHERE slug = 'system'`)
  }
}
```

## Performance Patterns

### Efficient Loading Strategies

```typescript
@Injectable()
export class OptimizedRepository {
  // Lazy loading with specific relations
  async findOrderWithItems(id: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: {
        items: {
          article: true // Load article data for each item
        },
        customer: true // Load customer data
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        items: {
          id: true,
          quantity: true,
          unitPrice: true,
          article: {
            id: true,
            name: true,
            sku: true
          }
        },
        customer: {
          id: true,
          name: true,
          email: true
        }
      }
    })
  }

  // Batch loading to avoid N+1 queries
  async findOrdersWithCustomers(orderIds: string[]): Promise<Order[]> {
    return this.orderRepo.find({
      where: {
        id: In(orderIds)
      },
      relations: {
        customer: true
      }
    })
  }

  // Pagination with count optimization
  async findOrdersPaginated(
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number; hasMore: boolean }> {
    const [orders, total] = await this.orderRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    })

    return {
      orders,
      total,
      hasMore: page * limit < total
    }
  }

  // Streaming large datasets
  async *streamOrders(): AsyncGenerator<Order, void, unknown> {
    const queryBuilder = this.orderRepo.createQueryBuilder('order')
      .orderBy('order.id')

    const stream = await queryBuilder.stream()
    
    for await (const raw of stream) {
      const order = queryBuilder.transformer.transform(raw, {}, {})
      yield order as Order
    }
  }
}
```

### Query Optimization Patterns

```typescript
// Use indexes effectively
@Entity('search_logs')
@Index(['tenantId', 'createdAt']) // Composite index for tenant + time queries
@Index(['searchTerm'], { type: 'gin' }) // GIN index for full-text search
export class SearchLog extends TenantEntity {
  @Column()
  searchTerm!: string

  @Column()
  resultsCount!: number

  @Column('inet', { nullable: true })
  userIp?: string
}

// Efficient counting without loading data
async getOrderCount(status?: OrderStatus): Promise<number> {
  const query = this.orderRepo.createQueryBuilder('order')
    .select('COUNT(*)', 'count')
    .where('order.tenantId = :tenantId', { tenantId: this.tenantId })

  if (status) {
    query.andWhere('order.status = :status', { status })
  }

  const result = await query.getRawOne()
  return parseInt(result.count, 10)
}

// Bulk operations
async bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus): Promise<void> {
  await this.orderRepo.update(
    {
      id: In(orderIds),
      tenantId: this.tenantId
    },
    { status }
  )
}

// Efficient exists check
async orderExists(orderNumber: string): Promise<boolean> {
  const count = await this.orderRepo.count({
    where: {
      orderNumber,
      tenantId: this.tenantId
    }
  })
  return count > 0
}
```

## Multi-Tenant Patterns

### Tenant Context Pattern

```typescript
// Tenant context service
@Injectable()
export class TenantContext {
  private tenantId: string

  setTenantId(tenantId: string): void {
    this.tenantId = tenantId
  }

  getCurrentTenantId(): string {
    if (!this.tenantId) {
      throw new UnauthorizedException('Tenant context not set')
    }
    return this.tenantId
  }
}

// Tenant interceptor for automatic context setting
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private tenantContext: TenantContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as UserContext

    if (user?.tenantId) {
      this.tenantContext.setTenantId(user.tenantId)
    }

    return next.handle()
  }
}

// Global query filter for tenant isolation
@Injectable()
export class TenantQueryFilter {
  @EventSubscriber()
  beforeQuery(event: any): void {
    if (event.query && event.parameters) {
      // Automatically add tenant filter to all queries
      // This would be implemented based on your specific needs
    }
  }
}
```

### Schema-per-Tenant Pattern

```typescript
// Dynamic schema selection
@Injectable()
export class TenantConnectionService {
  private connections = new Map<string, Connection>()

  async getConnection(tenantId: string): Promise<Connection> {
    if (!this.connections.has(tenantId)) {
      const connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        schema: `tenant_${tenantId}`,
        entities: [User, Order, Article, /* ... */],
        synchronize: false,
        logging: false,
      })
      
      this.connections.set(tenantId, connection)
    }

    return this.connections.get(tenantId)!
  }

  async getRepository<T>(
    tenantId: string, 
    entity: EntityTarget<T>
  ): Promise<Repository<T>> {
    const connection = await this.getConnection(tenantId)
    return connection.getRepository(entity)
  }
}
```

---

These TypeORM patterns provide a solid foundation for database operations in the TopSteel ERP system, ensuring performance, security, and maintainability.

**Last Updated**: August 2025