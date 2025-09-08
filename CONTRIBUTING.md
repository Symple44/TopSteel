# Contributing to TopSteel ERP

Welcome to the TopSteel ERP project! This guide will help you understand how to contribute effectively to our codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Security Guidelines](#security-guidelines)
- [Performance Considerations](#performance-considerations)

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+ (package manager)
- PostgreSQL 14+
- Redis 6+
- Docker (for local development)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/topsteel/topsteel-erp.git
   cd topsteel-erp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local

   # Generate secure secrets
   pnpm run security:generate-secrets development
   ```

4. **Start development databases**
   ```bash
   docker-compose up postgres redis elasticsearch
   ```

5. **Run database migrations**
   ```bash
   cd apps/api
   pnpm run migration:run
   ```

6. **Start development servers**
   ```bash
   # Start all services
   pnpm run dev

   # Or start specific apps
   pnpm run dev:api    # Backend API
   pnpm run dev:web    # Frontend Web App
   ```

## Development Workflow

### Branch Strategy

We use a **Git Flow** approach with the following branches:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Creating a Feature

1. **Create a feature branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the [Code Standards](CODE_STANDARDS.md)
   - Write tests for your changes
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user authentication system"
   ```

4. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Daily Development

```bash
# Ensure all linting and formatting rules are met
pnpm run lint
pnpm run format

# Run tests before committing
pnpm run test

# Validate security before pushing
pnpm run security:validate

# Build to check for errors
pnpm run build
```

## Code Standards

Please read our comprehensive [Code Standards](CODE_STANDARDS.md) document. Here are the key points:

### TypeScript Requirements

- ✅ **Strict mode enabled** - No `any` types allowed
- ✅ **Explicit return types** for all functions
- ✅ **Type imports** - Use `import type` for type-only imports
- ✅ **Interface over type** - Use interfaces for object types

```typescript
// ✅ Good
import type { User } from '@erp/types'

interface CreateUserParams {
  email: string
  password: string
}

async function createUser(params: CreateUserParams): Promise<User> {
  // Implementation
}

// ❌ Bad
function createUser(params: any): any {
  return whatever
}
```

### React/Next.js Guidelines

```typescript
// ✅ Good: Performance-optimized component
import { memo, useCallback, useMemo } from 'react'

interface Props {
  items: Item[]
  onItemClick: (item: Item) => void
}

export const ItemList = memo<Props>(({ items, onItemClick }) => {
  const sortedItems = useMemo(() => 
    items.sort((a, b) => a.name.localeCompare(b.name)), 
    [items]
  )

  const handleClick = useCallback((item: Item) => {
    onItemClick(item)
  }, [onItemClick])

  return (
    <div>
      {sortedItems.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onClick={handleClick}
        />
      ))}
    </div>
  )
})
```

### Backend/NestJS Guidelines

```typescript
// ✅ Good: Proper controller setup
@Controller('api/users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, TenantGuard, CsrfGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: GetUsersDto
  ): Promise<User[]> {
    return this.usersService.findAll(tenantId, query)
  }

  @Post()
  @UseCsrfToken()
  @ApiOperation({ summary: 'Create a new user' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @TenantId() tenantId: string
  ): Promise<User> {
    return this.usersService.create(createUserDto, tenantId)
  }
}
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Types

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring (no new features or bug fixes)
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes
- `ci:` - Continuous integration changes

### Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Feature
feat(auth): add multi-factor authentication support

# Bug fix
fix(api): resolve user creation validation error

# Documentation
docs(readme): update installation instructions

# Performance improvement
perf(ui): optimize DataTable rendering for large datasets

# Breaking change
feat(api): redesign user authentication API

BREAKING CHANGE: The authentication API has been redesigned.
Previous token format is no longer supported.
```

## Pull Request Process

### Before Creating a PR

1. **Ensure your branch is up to date**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run the full test suite**
   ```bash
   pnpm run test
   pnpm run test:e2e
   ```

3. **Check code quality**
   ```bash
   pnpm run lint
   pnpm run type-check
   pnpm run security:validate
   ```

4. **Build the project**
   ```bash
   pnpm run build
   ```

### PR Requirements

- [ ] **Title**: Follow conventional commit format
- [ ] **Description**: Clear description of changes and motivation
- [ ] **Tests**: All new code has appropriate tests
- [ ] **Documentation**: Updated if API changes or new features
- [ ] **Security**: No hardcoded secrets or security vulnerabilities
- [ ] **Performance**: No significant performance regressions

### PR Template

```markdown
## Description
Brief description of the changes introduced by this PR.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Security
- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] Authentication/authorization proper
- [ ] CSRF protection added where needed

## Performance
- [ ] No performance regressions
- [ ] Database queries optimized
- [ ] Bundle size impact acceptable

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] README updated (if needed)

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information or context.
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one team member must review
3. **Security Review**: Required for security-related changes
4. **Performance Review**: Required for performance-critical changes

### Merge Requirements

- ✅ All CI checks passing
- ✅ At least 1 approval from code owner
- ✅ No merge conflicts
- ✅ Branch up to date with base branch

## Testing Requirements

### Coverage Requirements

- **New code**: 80%+ coverage required
- **Critical paths**: 90%+ coverage (auth, payments, security)
- **UI components**: 85%+ coverage
- **Business logic**: 95%+ coverage

### Testing Commands

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run integration tests
pnpm run test:integration

# Run E2E tests
pnpm run test:e2e

# Run specific test file
pnpm run test auth.service.test.ts

# Watch mode for development
pnpm run test:watch
```

### Writing Tests

#### Unit Tests
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('UserService', () => {
  let userService: UserService
  let mockRepository: MockedObject<Repository<User>>

  beforeEach(() => {
    mockRepository = {
      find: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    userService = new UserService(mockRepository)
  })

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const createUserDto = { email: 'test@test.com', name: 'Test User' }
      const savedUser = { id: '1', ...createUserDto }
      mockRepository.save.mockResolvedValue(savedUser)

      // Act
      const result = await userService.create(createUserDto)

      // Assert
      expect(result).toEqual(savedUser)
      expect(mockRepository.save).toHaveBeenCalledWith(createUserDto)
    })
  })
})
```

#### Integration Tests
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

describe('UsersController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  it('should create user', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({ email: 'test@test.com', name: 'Test User' })
      .expect(201)
      .expect(res => {
        expect(res.body.email).toBe('test@test.com')
      })
  })

  afterAll(async () => {
    await app.close()
  })
})
```

## Security Guidelines

### Authentication & Authorization

```typescript
// ✅ Always protect endpoints with guards
@Controller('api/sensitive')
@UseGuards(JwtAuthGuard, RoleGuard)
export class SensitiveController {
  @Post()
  @Roles('admin')
  @UseCsrfToken() // CSRF protection for state changes
  async sensitiveAction(@Body() dto: SensitiveActionDto) {
    // Implementation
  }
}
```

### Input Validation

```typescript
// ✅ Always validate and sanitize inputs
import { IsString, IsEmail, MaxLength, Transform } from 'class-validator'
import { sanitizeHtml } from '@erp/utils'

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value))
  name!: string
}
```

### Secrets Management

```typescript
// ✅ Use configuration service for secrets
@Injectable()
export class PaymentService {
  constructor(private configService: ConfigService) {}

  private getApiKey(): string {
    return this.configService.get('STRIPE_SECRET_KEY')
  }
}

// ❌ Never hardcode secrets
const API_KEY = 'sk_live_hardcoded' // Never do this!
```

## Performance Considerations

### Database Optimization

```typescript
// ✅ Use selective querying
async findUsersOptimized(tenantId: string): Promise<User[]> {
  return this.userRepository.find({
    where: { tenantId },
    select: ['id', 'email', 'name'], // Only select needed fields
    relations: {
      profile: true // Only load needed relations
    },
    take: 50 // Limit results
  })
}
```

### React Performance

```typescript
// ✅ Use React.memo and useMemo for expensive operations
const ExpensiveComponent = memo<Props>(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransformation(item))
  }, [data])

  return <div>{processedData.map(/* render */)}</div>
})
```

### Bundle Optimization

```typescript
// ✅ Use dynamic imports for large dependencies
const handleExport = async () => {
  const { exportToPDF } = await import('@erp/pdf-utils')
  return exportToPDF(data)
}
```

## Getting Help

### Resources

- [Code Standards](CODE_STANDARDS.md) - Comprehensive coding guidelines
- [Architecture Guide](ARCHITECTURE.md) - System architecture overview
- [Security Guide](SECURITY.md) - Security best practices
- [API Documentation](docs/API.md) - API reference

### Communication

- **Questions**: Create a GitHub issue with the `question` label
- **Bugs**: Create a GitHub issue with detailed reproduction steps
- **Discussions**: Use GitHub Discussions for design decisions
- **Urgent Issues**: Contact the team lead directly

### Development Tools

- **Biome**: Code linting and formatting
- **Vitest**: Testing framework
- **TypeScript**: Type safety
- **Storybook**: UI component development
- **Docker**: Local development environment

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

Thank you for contributing to TopSteel ERP! 🚀

**Last Updated**: August 2025