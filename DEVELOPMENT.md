# TopSteel Development Guide

## Package Manager

This project uses **pnpm** exclusively as its package manager. Do not use npm, yarn, or any other package manager.

### Why pnpm?

- **Disk space efficiency**: pnpm uses a content-addressable store, saving disk space
- **Faster installations**: Parallel installation and better caching
- **Strict dependency resolution**: Better security and consistency
- **Monorepo support**: Excellent workspace support for our monorepo structure

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm@10.12.4

# Install project dependencies
pnpm install
```

### Common Commands

```bash
# Install dependencies
pnpm install

# Add a dependency to the root
pnpm add -w <package-name>

# Add a dependency to a specific workspace
pnpm add <package-name> --filter @erp/web

# Run scripts
pnpm dev         # Start development servers
pnpm build       # Build all packages
pnpm test        # Run tests
pnpm lint        # Run linting
pnpm type-check  # Run TypeScript checks
```

### Workspace Commands

```bash
# Run command in specific workspace
pnpm --filter @erp/api dev
pnpm --filter @erp/web build

# Run command in multiple workspaces
pnpm --filter "./packages/*" build
pnpm --filter "./apps/*" test
```

## Project Structure

```
TopSteel/
├── apps/                    # Applications
│   ├── api/                # NestJS backend API
│   ├── web/                # Next.js main web app
│   ├── marketplace-api/    # Marketplace backend
│   └── marketplace-storefront/ # Marketplace frontend
├── packages/               # Shared packages
│   ├── ui/                # React component library
│   ├── domains/           # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── api-client/       # API client library
└── scripts/              # Build and deployment scripts
```

## Development Workflow

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/topsteel/erp-topsteel.git
cd erp-topsteel

# Install dependencies
pnpm install

# Build packages
pnpm build:packages

# Start development
pnpm dev
```

### 2. Making Changes

1. Create a feature branch
2. Make your changes
3. Run tests: `pnpm test`
4. Run type checking: `pnpm type-check`
5. Run linting: `pnpm lint`
6. Commit your changes
7. Push and create a pull request

### 3. Building for Production

```bash
# Clean build
pnpm clean

# Build all packages and apps
pnpm build

# Build specific apps
pnpm build:api
pnpm build:web
```

## Environment Variables

Each application has its own `.env` file:

- `apps/api/.env` - Backend API configuration
- `apps/web/.env` - Frontend web app configuration
- `apps/marketplace-api/.env` - Marketplace API configuration
- `apps/marketplace-storefront/.env` - Marketplace frontend configuration

Copy `.env.example` to `.env` in each directory and configure accordingly.

## Database Setup

The project uses PostgreSQL with a multi-tenant architecture:

```bash
# Test database connections
pnpm db:test-connections

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test:api
pnpm test:web
pnpm test:ui

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Code Quality

### Linting and Formatting

```bash
# Check code style
pnpm lint

# Fix code style issues
pnpm lint:biome:fix

# Format code
pnpm format:biome
```

### Type Checking

```bash
# Check all TypeScript types
pnpm type-check

# Check specific package
pnpm --filter @erp/web type-check
```

## Troubleshooting

### Common Issues

1. **Installation fails**
   - Make sure you're using pnpm: `npm install -g pnpm`
   - Clear cache: `pnpm store prune`
   - Delete node_modules and reinstall: `pnpm reset`

2. **Build errors**
   - Ensure packages are built first: `pnpm build:packages`
   - Check for TypeScript errors: `pnpm type-check`
   - Clean and rebuild: `pnpm clean && pnpm build`

3. **Development server issues**
   - Kill existing processes: `pnpm kill-processes`
   - Check port availability
   - Verify environment variables

### Getting Help

- Check the [documentation](./docs)
- Open an issue on [GitHub](https://github.com/topsteel/erp-topsteel/issues)
- Contact the development team

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting pull requests.

## License

This project is proprietary software. See [LICENSE](./LICENSE) for details.