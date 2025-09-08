# TopSteel ERP - Quick Reference Guide

*Version 1.0 - August 2025*

## Table of Contents

- [Development Setup](#development-setup)
- [Common Commands](#common-commands)
- [Code Patterns](#code-patterns)
- [Entity Patterns](#entity-patterns)
- [Controller Patterns](#controller-patterns)
- [React Component Patterns](#react-component-patterns)
- [Security Patterns](#security-patterns)
- [Testing Patterns](#testing-patterns)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/topsteel/topsteel-erp.git
cd topsteel-erp
pnpm install

# Generate secure environment
pnpm run security:generate-secrets development

# Start development
pnpm run dev

# Run tests
pnpm run test

# Check code quality
pnpm run lint
pnpm run type-check
```

### Environment Variables

```bash
# Core settings
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/topsteel"
REDIS_URL="redis://localhost:6379"

# JWT secrets (generated automatically)
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"

# External services
STRIPE_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."
```

## Common Commands

### Package Management

```bash
# Install dependencies
pnpm install

# Add package to specific workspace
pnpm add --filter @erp/ui react-hook-form
pnpm add --filter apps/api stripe

# Remove package
pnpm remove --filter apps/web next

# Update dependencies
pnpm update

# Check outdated packages
pnpm outdated
```

### Development

```bash
# Start all services
pnpm run dev

# Start specific services
pnpm run dev:api
pnpm run dev:web
pnpm run dev:marketplace

# Build all packages
pnpm run build

# Build specific package
pnpm run build --filter @erp/ui

# Type checking
pnpm run type-check
pnpm run type-check --filter apps/api
```

### Database

```bash
# Run migrations
cd apps/api
pnpm run migration:run

# Generate migration
pnpm run migration:generate -- --name AddUserTable

# Revert migration
pnpm run migration:revert

# Seed database
pnpm run seed

# Reset database
pnpm run db:reset
```

### Testing

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm run test auth.service.test.ts

# Run tests in watch mode
pnpm run test:watch

# Run E2E tests
pnpm run test:e2e
```

### Code Quality

```bash
# Lint and fix
pnpm run lint
pnpm run lint:fix

# Format code
pnpm run format

# Security validation
pnpm run security:validate
pnpm run security:check

# Type checking
pnpm run type-check
```

## Code Patterns

### Import Organization

```typescript
// 1. Node modules
import { Injectable, Controller, Get } from '@nestjs/common'
import { Repository } from 'typeorm'
import { IsString, IsEmail } from 'class-validator'

// 2. Internal packages (@erp/*)
import type { User } from '@erp/types'
import { Button } from '@erp/ui'

// 3. Relative imports (same package)
import { AuthService } from './auth.service'
import type { CreateUserDto } from './dto/create-user.dto'
```

### Error Handling

```typescript
// ✅ Good: Structured error handling
import { 
  BadRequestException, 
  NotFoundException, 
  InternalServerErrorException 
} from '@nestjs/common'

@Injectable()
export class UserService {
  async findById(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid user ID format')
    }

    try {
      const user = await this.userRepository.findOne({ where: { id } })
      
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`)
      }

      return user
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error // Re-throw known errors
      }
      
      this.logger.error('Database error finding user', { id, error: error.message })
      throw new InternalServerErrorException('Failed to retrieve user')
    }
  }
}
```

### Logging Pattern

```typescript
import { Logger } from '@nestjs/common'

@Injectable()
export class SomeService {
  private readonly logger = new Logger(SomeService.name)

  async someMethod(data: SomeData): Promise<Result> {
    this.logger.log('Starting some operation', { dataId: data.id })
    
    try {
      const result = await this.performOperation(data)
      this.logger.log('Operation completed successfully', { 
        dataId: data.id, 
        resultId: result.id 
      })
      return result
    } catch (error) {
      this.logger.error('Operation failed', { 
        dataId: data.id, 
        error: error.message,
        stack: error.stack 
      })
      throw error
    }
  }
}
```

## Entity Patterns

### Base Entity Structure

```typescript
import { 
  Entity, 
  Column, 
  Index, 
  ManyToOne, 
  OneToMany,
  JoinColumn 
} from 'typeorm'
import { IsString, IsEmail, MaxLength } from 'class-validator'
import { BaseEntity, TenantEntity } from '@/core/common/base'

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'role'])
export class User extends TenantEntity {
  @Column()
  @IsEmail()
  @MaxLength(255)
  email!: string

  @Column()
  @IsString()
  @MaxLength(100)
  name!: string

  @Column()
  hashedPassword!: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole

  // Relationships
  @ManyToOne(() => Tenant, { eager: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant

  @OneToMany(() => Order, order => order.user)
  orders!: Order[]

  // Computed properties
  get displayName(): string {
    return this.name || this.email.split('@')[0]
  }
}
```

### Repository Pattern

```typescript
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindManyOptions } from 'typeorm'
import { TenantRepository } from '@/core/common/base'

@Injectable()
export class UserRepository extends TenantRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository)
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.findOne({
      where: { tenantId, email: email.toLowerCase() }
    })
  }

  async findActiveUsers(tenantId: string): Promise<User[]> {
    return this.find({
      where: { 
        tenantId, 
        deletedAt: null // Only active users
      },
      order: { name: 'ASC' }
    })
  }

  async findWithOrders(tenantId: string, userId: string): Promise<User | null> {
    return this.findOne({
      where: { tenantId, id: userId },
      relations: {
        orders: {
          items: true
        }
      }
    })
  }
}
```

## Controller Patterns

### Standard Controller Structure

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth
} from '@nestjs/swagger'
import { 
  JwtAuthGuard, 
  TenantGuard, 
  RbacGuard,
  CsrfGuard 
} from '@/core/security/guards'
import { TenantId, CurrentUser, RequirePermissions } from '@/core/common/decorators'

@Controller('api/users')
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @RequirePermissions({ resource: 'users', action: 'read' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: GetUsersDto
  ): Promise<User[]> {
    return this.usersService.findAll(tenantId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @RequirePermissions({ resource: 'users', action: 'read' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<User> {
    return this.usersService.findOne(tenantId, id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @UseGuards(CsrfGuard) // CSRF protection for state changes
  @RequirePermissions({ resource: 'users', action: 'write' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: UserContext
  ): Promise<User> {
    return this.usersService.create(createUserDto, tenantId, currentUser)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @UseGuards(CsrfGuard)
  @RequirePermissions({ resource: 'users', action: 'write' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TenantId() tenantId: string
  ): Promise<User> {
    return this.usersService.update(tenantId, id, updateUserDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @UseGuards(CsrfGuard)
  @RequirePermissions({ resource: 'users', action: 'delete' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string
  ): Promise<void> {
    await this.usersService.remove(tenantId, id)
  }
}
```

### DTO Patterns

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  Transform
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { sanitizeHtml } from '@erp/utils'

export class CreateUserDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(255)
  email!: string

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe'
  })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value))
  name!: string

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    maxLength: 128
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value))
  name?: string

  // Password is omitted from update DTO for security
}

export class GetUsersDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string

  @ApiPropertyOptional({ description: 'User role filter' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  @Max(100)
  limit?: number = 10
}
```

## React Component Patterns

### Performance-Optimized Component

```typescript
import React, { memo, useCallback, useMemo } from 'react'
import { Button } from '@erp/ui'

interface UserListProps {
  users: User[]
  onUserSelect: (user: User) => void
  searchTerm?: string
}

export const UserList = memo<UserListProps>(({ users, onUserSelect, searchTerm = '' }) => {
  // Memoize expensive computations
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  // Memoize callback to prevent child re-renders
  const handleUserClick = useCallback((user: User) => {
    onUserSelect(user)
  }, [onUserSelect])

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No users found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onClick={handleUserClick}
        />
      ))}
    </div>
  )
})

UserList.displayName = 'UserList'
```

### Custom Hook Pattern

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useApiClient } from '@/lib/api-client'
import type { User, CreateUserDto } from '@erp/types'

interface UseUsersOptions {
  autoFetch?: boolean
  searchTerm?: string
}

export function useUsers(options: UseUsersOptions = {}) {
  const { autoFetch = true, searchTerm } = options
  const apiClient = useApiClient()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.get('/api/users', {
        params: { search: searchTerm }
      })
      setUsers(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [apiClient, searchTerm])

  const createUser = useCallback(async (userData: CreateUserDto): Promise<User> => {
    const response = await apiClient.post('/api/users', userData)
    const newUser = response.data
    
    // Update local state
    setUsers(prev => [...prev, newUser])
    
    return newUser
  }, [apiClient])

  const updateUser = useCallback(async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/api/users/${id}`, userData)
    const updatedUser = response.data
    
    // Update local state
    setUsers(prev => prev.map(user => 
      user.id === id ? updatedUser : user
    ))
    
    return updatedUser
  }, [apiClient])

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`)
    
    // Update local state
    setUsers(prev => prev.filter(user => user.id !== id))
  }, [apiClient])

  // Auto-fetch on mount and when searchTerm changes
  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
  }, [autoFetch, fetchUsers])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
```

### Form Component Pattern

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Select } from '@erp/ui'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['admin', 'manager', 'user']),
})

type CreateUserForm = z.infer<typeof createUserSchema>

interface CreateUserFormProps {
  onSubmit: (data: CreateUserForm) => Promise<void>
  loading?: boolean
}

export function CreateUserForm({ onSubmit, loading = false }: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange'
  })

  const handleFormSubmit = async (data: CreateUserForm) => {
    try {
      await onSubmit(data)
      reset() // Clear form on success
    } catch (error) {
      // Error handled by parent component
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Input
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="user@example.com"
          error={errors.email?.message}
        />
      </div>

      <div>
        <Input
          {...register('name')}
          label="Full Name"
          placeholder="John Doe"
          error={errors.name?.message}
        />
      </div>

      <div>
        <Select
          {...register('role')}
          label="Role"
          options={[
            { value: 'user', label: 'User' },
            { value: 'manager', label: 'Manager' },
            { value: 'admin', label: 'Administrator' },
          ]}
          error={errors.role?.message}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={loading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={!isValid || loading}
          loading={loading}
        >
          Create User
        </Button>
      </div>
    </form>
  )
}
```

## Security Patterns

### Authentication Guard Usage

```typescript
// Apply multiple security guards
@Controller('api/sensitive')
@UseGuards(
  JwtAuthGuard,    // Authentication
  TenantGuard,     // Tenant isolation
  RbacGuard,       // Role-based access
  CsrfGuard        // CSRF protection
)
export class SensitiveController {
  @Post('action')
  @RequirePermissions({ resource: 'sensitive', action: 'execute' })
  @RateLimit({ max: 5, windowMs: 60000 }) // 5 requests per minute
  async sensitiveAction(
    @Body() dto: SensitiveActionDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: UserContext
  ): Promise<Result> {
    // Implementation
  }
}
```

### Input Validation

```typescript
import { IsString, IsEmail, Transform, IsEnum } from 'class-validator'
import { sanitizeHtml, escapeHtml } from '@erp/utils'

export class SafeInputDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string

  @IsString()
  @Transform(({ value }) => sanitizeHtml(value)) // Remove dangerous HTML
  content!: string

  @IsEnum(AllowedType)
  type!: AllowedType

  @IsString()
  @Transform(({ value }) => escapeHtml(value)) // Escape for display
  displayText!: string
}
```

### CSRF Token Usage

```typescript
// Frontend: Include CSRF token in requests
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  }
})

// Backend: Validate CSRF token
@Post('users')
@UseGuards(CsrfGuard)
@UseCsrfToken() // Require CSRF token
async createUser(@Body() dto: CreateUserDto): Promise<User> {
  return this.usersService.create(dto)
}
```

## Testing Patterns

### Service Unit Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'

describe('UserService', () => {
  let service: UserService
  let repository: jest.Mocked<UserRepository>

  beforeEach(async () => {
    const mockRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockRepository },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    repository = module.get(UserRepository)
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'test-uuid'
      const tenantId = 'tenant-uuid'
      const expectedUser = { id: userId, email: 'test@test.com' }
      repository.findOne.mockResolvedValue(expectedUser)

      // Act
      const result = await service.findById(tenantId, userId)

      // Assert
      expect(result).toEqual(expectedUser)
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId, tenantId }
      })
    })

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(service.findById('tenant-id', 'user-id'))
        .rejects
        .toThrow('User not found')
    })
  })
})
```

### React Component Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserForm } from './UserForm'

describe('UserForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('should render form fields', () => {
    render(<UserForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<UserForm onSubmit={mockOnSubmit} />)

    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger validation

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<UserForm onSubmit={mockOnSubmit} />)

    // Fill form
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.selectOptions(screen.getByLabelText('Role'), 'manager')

    // Submit
    await user.click(screen.getByRole('button', { name: 'Create User' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'John Doe',
        role: 'manager'
      })
    })
  })
})
```

### Integration Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'

describe('UsersController (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })
      .expect(200)

    authToken = loginResponse.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create user', async () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'newuser@test.com',
        name: 'New User',
        role: 'user'
      })
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('id')
        expect(res.body.email).toBe('newuser@test.com')
      })
  })

  it('should require authentication', async () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .expect(401)
  })
})
```

## Troubleshooting

### Common Issues

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache/turbo
rm -rf apps/*/tsconfig.tsbuildinfo

# Rebuild types
pnpm run build:types
pnpm run type-check
```

#### Build Issues

```bash
# Clear all build artifacts
pnpm run clean
pnpm install

# Rebuild everything
pnpm run build
```

#### Database Issues

```bash
# Reset database
cd apps/api
pnpm run db:reset

# Check migrations status
pnpm run migration:show

# Run specific migration
pnpm run migration:run --transaction=each
```

#### Test Failures

```bash
# Clear test cache
pnpm run test:clear-cache

# Run tests with verbose output
pnpm run test --verbose

# Update snapshots
pnpm run test --update-snapshots
```

### Performance Issues

#### Bundle Size

```bash
# Analyze bundle size
cd apps/web
pnpm run build
pnpm run analyze

# Check for duplicate dependencies
pnpm ls --depth=0
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Monitor memory usage
node --trace-gc your-script.js
```

### Security Issues

#### CSRF Token Issues

```typescript
// Ensure CSRF token is included in meta tags
// In your HTML head:
<meta name="csrf-token" content="{{ csrfToken }}" />

// In your API client:
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
axios.defaults.headers.common['X-CSRF-Token'] = csrfToken
```

#### Authentication Issues

```bash
# Check JWT secret configuration
pnpm run security:validate

# Regenerate JWT secrets
pnpm run security:generate-secrets production

# Verify token format
node -e "console.log(require('jsonwebtoken').decode('your-token-here'))"
```

---

This quick reference provides common patterns and solutions for everyday development tasks in the TopSteel ERP project.

**Last Updated**: August 2025