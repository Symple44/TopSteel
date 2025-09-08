# TopSteel ERP - Decorators Usage Guide

*Quick Reference for NestJS Decorators*

## Table of Contents

- [Controller Decorators](#controller-decorators)
- [Security Decorators](#security-decorators)
- [Validation Decorators](#validation-decorators)
- [Database Decorators](#database-decorators)
- [Custom Decorators](#custom-decorators)
- [API Documentation Decorators](#api-documentation-decorators)

## Controller Decorators

### Basic Controller Setup

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UsePipes,
  UseFilters
} from '@nestjs/common'

@Controller('api/users') // Base route
@UseGuards(JwtAuthGuard, TenantGuard) // Applied to all routes
export class UsersController {
  // GET /api/users
  @Get()
  async findAll(@Query() query: GetUsersDto): Promise<User[]> {
    return this.usersService.findAll(query)
  }

  // GET /api/users/:id
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id)
  }

  // POST /api/users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(CsrfGuard) // Additional guard for this route
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto)
  }

  // PUT /api/users/:id
  @Put(':id')
  @UsePipes(ValidationPipe) // Custom validation pipe
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto)
  }

  // PATCH /api/users/:id/status
  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus
  ): Promise<void> {
    await this.usersService.updateStatus(id, status)
  }

  // DELETE /api/users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id)
  }
}
```

### Parameter Decorators

```typescript
@Controller('api/orders')
export class OrdersController {
  @Get()
  async findOrders(
    // Query parameters (?search=term&status=active)
    @Query('search') search?: string,
    @Query('status') status?: OrderStatus,
    @Query() allQuery?: GetOrdersDto, // All query params as DTO
    
    // Headers
    @Headers('authorization') authHeader?: string,
    @Headers() allHeaders?: Record<string, string>,
    
    // Request/Response objects (use sparingly)
    @Req() request?: Request,
    @Res({ passthrough: true }) response?: Response,
    
    // Custom decorators
    @TenantId() tenantId?: string,
    @CurrentUser() user?: UserContext
  ): Promise<Order[]> {
    // Implementation
  }

  @Post(':orderId/items')
  async addItem(
    // Path parameters
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param() allParams?: Record<string, string>,
    
    // Request body
    @Body() createItemDto: CreateOrderItemDto,
    @Body('quantity') quantity?: number // Single property
  ): Promise<OrderItem> {
    // Implementation
  }
}
```

## Security Decorators

### Authentication & Authorization

```typescript
import {
  UseGuards,
  SetMetadata,
  applyDecorators
} from '@nestjs/common'
import {
  JwtAuthGuard,
  TenantGuard,
  RbacGuard,
  CsrfGuard,
  RateLimitGuard
} from '@/core/security/guards'

// Basic auth guard
@Controller('api/protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get()
  async getData(): Promise<any> {
    // Requires valid JWT token
  }
}

// Multiple security layers
@Controller('api/admin')
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
export class AdminController {
  @Get('users')
  @RequirePermissions({ resource: 'users', action: 'read' })
  async getUsers(): Promise<User[]> {
    // Requires authentication, tenant context, and proper permissions
  }

  @Post('users')
  @UseGuards(CsrfGuard) // Additional CSRF protection for state changes
  @RequirePermissions({ resource: 'users', action: 'write' })
  @RateLimit({ max: 10, windowMs: 60000 }) // Rate limiting
  async createUser(@Body() dto: CreateUserDto): Promise<User> {
    // Highly protected endpoint
  }
}

// Custom permission decorator
export const RequirePermissions = (permissions: Permission | Permission[]) =>
  SetMetadata('permissions', Array.isArray(permissions) ? permissions : [permissions])

// Role-based access
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles)

@Controller('api/management')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ManagementController {
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getDashboard(): Promise<DashboardData> {
    // Only admins and managers
  }
}
```

### Rate Limiting

```typescript
import { RateLimit } from '@/core/security/decorators'

@Controller('api/auth')
export class AuthController {
  @Post('login')
  @RateLimit({ max: 5, windowMs: 15 * 60 * 1000 }) // 5 attempts per 15 minutes
  async login(@Body() loginDto: LoginDto): Promise<AuthResult> {
    // Protected against brute force
  }

  @Post('forgot-password')
  @RateLimit({ max: 3, windowMs: 60 * 60 * 1000 }) // 3 attempts per hour
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    // Prevent abuse
  }

  @Post('register')
  @RateLimit({ 
    max: 2, 
    windowMs: 24 * 60 * 60 * 1000, // 2 registrations per day
    skipSuccessfulRequests: false 
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResult> {
    // Prevent spam registrations
  }
}
```

### CSRF Protection

```typescript
@Controller('api/settings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SettingsController {
  @Get()
  async getSettings(): Promise<Settings> {
    // Read operations don't need CSRF protection
  }

  @Post()
  @UseGuards(CsrfGuard) // Required for state-changing operations
  @UseCsrfToken() // Custom decorator to enforce token presence
  async updateSettings(@Body() dto: UpdateSettingsDto): Promise<Settings> {
    // Write operations require CSRF token
  }

  @Delete('cache')
  @UseGuards(CsrfGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCache(): Promise<void> {
    // Dangerous operations require CSRF protection
  }
}
```

## Validation Decorators

### Class Validator Decorators

```typescript
import {
  IsString,
  IsEmail,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
  IsPhoneNumber,
  IsCreditCard
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => sanitizeHtml(value))
  name!: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  password!: string

  @IsOptional()
  @IsInt()
  @Min(18, { message: 'Must be at least 18 years old' })
  @Max(120, { message: 'Invalid age' })
  age?: number

  @IsEnum(UserRole, { message: 'Invalid user role' })
  role!: UserRole

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  website?: string

  @IsOptional()
  @IsPhoneNumber('FR', { message: 'Invalid French phone number' })
  phone?: string

  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences!: UserPreferencesDto
}

export class UserPreferencesDto {
  @IsString()
  @IsOptional()
  language?: string = 'fr'

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean = true

  @IsObject()
  @IsOptional()
  theme?: Record<string, any>
}

// Address with nested validation
export class CreateOrderDto {
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress!: AddressDto

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  shippingAddress?: AddressDto

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  items!: OrderItemDto[]
}

export class AddressDto {
  @IsString()
  @MinLength(1)
  street!: string

  @IsString()
  @MinLength(1)
  city!: string

  @IsString()
  @Matches(/^\d{5}$/, { message: 'Invalid postal code' })
  postalCode!: string

  @IsString()
  @Length(2, 2, { message: 'Country must be 2 characters' })
  country!: string
}
```

### Custom Validation Decorators

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

// Custom unique email validator
export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          const userService = Container.get(UserService)
          const existingUser = await userService.findByEmail(value)
          return !existingUser
        },
        defaultMessage(args: ValidationArguments) {
          return `Email ${args.value} is already taken`
        }
      }
    })
  }
}

// Custom strong password validator
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false
          
          const hasLower = /[a-z]/.test(value)
          const hasUpper = /[A-Z]/.test(value)
          const hasNumber = /\d/.test(value)
          const hasSpecial = /[@$!%*?&]/.test(value)
          const isLongEnough = value.length >= 8
          
          return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough
        },
        defaultMessage() {
          return 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
        }
      }
    })
  }
}

// Usage
export class RegisterDto {
  @IsEmail()
  @IsUniqueEmail({ message: 'This email is already registered' })
  email!: string

  @IsString()
  @IsStrongPassword()
  password!: string
}
```

## Database Decorators

### TypeORM Entity Decorators

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Index,
  Unique,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad
} from 'typeorm'

@Entity('users')
@Index(['tenantId', 'email'], { unique: true }) // Composite unique index
@Index(['tenantId', 'role']) // Query optimization index
@Index(['tenantId', 'createdAt']) // Time-based queries
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: false }) // Not globally unique, tenant-scoped
  @Index()
  email!: string

  @Column()
  name!: string

  @Column({ select: false }) // Don't include in default queries
  hashedPassword!: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole

  @Column('uuid')
  @Index() // Foreign key index
  tenantId!: string

  @Column({ nullable: true })
  lastLoginAt?: Date

  @Column('simple-json', { nullable: true })
  preferences?: UserPreferences

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date

  @VersionColumn() // Optimistic locking
  version!: number

  // Relationships
  @ManyToOne(() => Tenant, { eager: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant

  @OneToMany(() => Order, order => order.user, { cascade: false })
  orders!: Order[]

  @ManyToMany(() => Role, { cascade: ['insert'] })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles!: Role[]

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date()
  }

  @BeforeInsert()
  generateDefaults() {
    if (!this.preferences) {
      this.preferences = {
        language: 'fr',
        emailNotifications: true
      }
    }
  }

  @AfterLoad()
  computeProperties() {
    // Computed properties after loading from DB
  }
}
```

### Advanced Entity Patterns

```typescript
// Soft delete with custom decorator
@Entity('articles')
@Index(['tenantId', 'sku'], { 
  unique: true, 
  where: 'deleted_at IS NULL' // Unique only for active records
})
export class Article extends TenantEntity {
  @Column()
  @Index()
  sku!: string

  @Column()
  name!: string

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number

  @Column('jsonb', { nullable: true }) // PostgreSQL JSON column
  specifications?: Record<string, any>

  // Full-text search
  @Column('tsvector', { select: false })
  @Index('gin') // GIN index for full-text search
  searchVector!: string

  @BeforeInsert()
  @BeforeUpdate()
  generateSearchVector() {
    this.searchVector = `${this.name} ${this.sku}`.toLowerCase()
  }
}

// Inheritance with discriminator
@Entity('payment_methods')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class PaymentMethod extends BaseEntity {
  @Column()
  type!: string

  @Column()
  isActive!: boolean
}

@ChildEntity('credit_card')
export class CreditCardPayment extends PaymentMethod {
  @Column()
  lastFourDigits!: string

  @Column()
  expiryMonth!: number

  @Column()
  expiryYear!: number
}

@ChildEntity('bank_transfer')
export class BankTransferPayment extends PaymentMethod {
  @Column()
  bankName!: string

  @Column()
  accountNumber!: string
}
```

## Custom Decorators

### Parameter Decorators

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

// Get current tenant ID from request context
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext
    
    if (!user?.tenantId) {
      throw new UnauthorizedException('Tenant context not found')
    }
    
    return user.tenantId
  }
)

// Get current user from request
export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext): UserContext | any => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext
    
    return data ? user?.[data] : user
  }
)

// Get client IP address
export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>()
    return request.ip || request.connection.remoteAddress || 'unknown'
  }
)

// Usage examples
@Controller('api/users')
export class UsersController {
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: UserContext,
    @CurrentUser('email') userEmail: string,
    @ClientIp() clientIp: string
  ): Promise<User[]> {
    this.logger.log(`User ${userEmail} from ${clientIp} accessing users for tenant ${tenantId}`)
    return this.usersService.findAll(tenantId)
  }
}
```

### Method Decorators

```typescript
import { SetMetadata, applyDecorators } from '@nestjs/common'

// Audit logging decorator
export const AuditLog = (action: string, resource: string) =>
  SetMetadata('audit', { action, resource })

// Cache decorator
export const CacheResult = (ttl: number = 3600) =>
  SetMetadata('cache', { ttl })

// Public route (skip authentication)
export const Public = () => SetMetadata('isPublic', true)

// API versioning
export const ApiVersion = (version: string) =>
  SetMetadata('version', version)

// Combined decorator for common patterns
export const SecureEndpoint = (permissions: Permission[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, TenantGuard, RbacGuard),
    RequirePermissions(permissions),
    AuditLog('access', 'endpoint')
  )

// Usage
@Controller('api/orders')
export class OrdersController {
  @Get()
  @CacheResult(1800) // Cache for 30 minutes
  @SecureEndpoint([{ resource: 'orders', action: 'read' }])
  async findAll(@TenantId() tenantId: string): Promise<Order[]> {
    return this.ordersService.findAll(tenantId)
  }

  @Post()
  @AuditLog('create', 'order')
  @SecureEndpoint([{ resource: 'orders', action: 'write' }])
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(dto)
  }

  @Get('public/status/:id')
  @Public() // Skip authentication for this endpoint
  async getPublicStatus(@Param('id') id: string): Promise<OrderStatus> {
    return this.ordersService.getPublicStatus(id)
  }
}
```

### Class Decorators

```typescript
// Auto-register service decorator
export function AutoService(name?: string) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    Injectable()(constructor)
    // Additional registration logic
  }
}

// Tenant-scoped service
export function TenantScoped() {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      tenantId: string
      
      setTenantContext(tenantId: string) {
        this.tenantId = tenantId
      }
    }
  }
}

// Usage
@AutoService('userService')
@TenantScoped()
export class UserService {
  // Implementation
}
```

## API Documentation Decorators

### Swagger/OpenAPI Decorators

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiHeader,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger'

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  @Get()
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve a list of all users in the current tenant'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: [User] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Search term for filtering users' 
  })
  @ApiQuery({ 
    name: 'role', 
    required: false, 
    enum: UserRole,
    description: 'Filter by user role' 
  })
  async findAll(@Query() query: GetUsersDto): Promise<User[]> {
    return this.usersService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'User unique identifier'
  })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF protection token',
    required: true
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: User 
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto)
  }
}

// DTO with API properties
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  name!: string

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
    example: UserRole.USER
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole
}

// Response DTO
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'user@example.com' })
  email!: string

  @ApiProperty({ example: 'John Doe' })
  name!: string

  @ApiProperty({ enum: UserRole })
  role!: UserRole

  @ApiProperty({ format: 'date-time' })
  createdAt!: string

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string
}
```

---

This guide covers the most commonly used decorators in the TopSteel ERP project. Use these patterns consistently across the application for maintainability and security.

**Last Updated**: August 2025