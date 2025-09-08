# TopSteel ERP - Tooling Configuration Guide

*Complete guide to development tools and configuration*

## Table of Contents

- [Overview](#overview)
- [Biome Configuration](#biome-configuration)
- [TypeScript Configuration](#typescript-configuration)
- [Testing Configuration](#testing-configuration)
- [Build Tools](#build-tools)
- [Development Tools](#development-tools)
- [CI/CD Configuration](#cicd-configuration)
- [IDE Configuration](#ide-configuration)

## Overview

The TopSteel ERP project uses modern development tools for optimal developer experience, code quality, and performance.

### Core Tools

- **Biome**: Linting, formatting, and code quality
- **TypeScript**: Type safety and modern JavaScript features
- **Vitest**: Fast testing framework
- **Turborepo**: Monorepo build system
- **pnpm**: Fast package manager
- **Docker**: Containerization and local development

## Biome Configuration

### Main Configuration (`biome.json`)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.2/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "root": "."
  },
  "files": {
    "ignoreUnknown": true,
    "maxSize": 2097152,
    "ignore": [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
      "**/*.d.ts",
      "**/*.generated.ts"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf",
    "formatWithErrors": true,
    "ignore": [
      "**/*.md",
      "**/CHANGELOG.md"
    ]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUndeclaredVariables": "error",
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "warn",
        "noUnreachable": "error"
      },
      "style": {
        "useConst": "error",
        "useImportType": "error",
        "noNegationElse": "warn",
        "useTemplate": "error",
        "useCollapsedElseIf": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsole": "warn",
        "noArrayIndexKey": "warn",
        "noDuplicateParameters": "error",
        "noEmptyBlockStatements": "warn"
      },
      "security": {
        "noDangerouslySetInnerHtml": "error",
        "noGlobalObjectCalls": "error"
      },
      "a11y": {
        "useButtonType": "error",
        "noSvgWithoutTitle": "warn",
        "noNoninteractiveElementToInteractiveRole": "error",
        "noStaticElementInteractions": "error",
        "useAltText": "error"
      },
      "performance": {
        "noDelete": "warn",
        "noAccumulatingSpread": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "asNeeded",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false
    },
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  },
  "json": {
    "formatter": {
      "indentWidth": 2,
      "trailingCommas": "none"
    }
  },
  "overrides": [
    {
      "includes": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off",
            "noConsole": "off"
          }
        }
      }
    },
    {
      "includes": ["apps/api/src/scripts/**/*.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsole": "off"
          }
        }
      }
    }
  ]
}
```

### Package-specific Overrides

```json
{
  "overrides": [
    {
      "includes": ["packages/ui/src/**/*.{ts,tsx}"],
      "linter": {
        "rules": {
          "a11y": {
            "useSemanticElements": "warn",
            "noStaticElementInteractions": "warn"
          }
        }
      }
    },
    {
      "includes": ["apps/web/src/**/*.{ts,tsx}"],
      "linter": {
        "rules": {
          "correctness": {
            "noUndeclaredVariables": "error"
          },
          "suspicious": {
            "noExplicitAny": "error"
          }
        }
      }
    },
    {
      "includes": ["apps/api/src/**/*.{ts}"],
      "linter": {
        "rules": {
          "style": {
            "useImportType": "error"
          },
          "correctness": {
            "noUnusedImports": "error"
          }
        }
      }
    }
  ]
}
```

### Common Biome Scripts

```json
{
  "scripts": {
    "lint": "biome lint .",
    "lint:fix": "biome lint --apply .",
    "format": "biome format .",
    "format:write": "biome format --write .",
    "check": "biome check .",
    "check:apply": "biome check --apply .",
    "ci:check": "biome ci ."
  }
}
```

## TypeScript Configuration

### Base Configuration (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "ES2022.Intl"],
    "jsx": "preserve",
    "allowJs": false,
    "checkJs": false,
    
    // Strict Mode
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": false,
    "noImplicitOverride": true,
    
    // Module Resolution
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@erp/ui": ["./packages/ui/dist"],
      "@erp/ui/*": ["./packages/ui/dist/*"],
      "@erp/types": ["./packages/types/dist"],
      "@erp/types/*": ["./packages/types/dist/*"],
      "@erp/utils": ["./packages/utils/dist"],
      "@erp/utils/*": ["./packages/utils/dist/*"],
      "@erp/domains": ["./packages/domains/dist"],
      "@erp/domains/*": ["./packages/domains/dist/*"],
      "@erp/api-client": ["./packages/api-client/dist"],
      "@erp/api-client/*": ["./packages/api-client/dist/*"],
      "@erp/config": ["./packages/config"],
      "@erp/config/*": ["./packages/config/*"],
      "@erp/entities": ["./packages/entities/src"],
      "@erp/entities/*": ["./packages/entities/src/*"]
    },
    
    // Emit Options
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": false,
    "importHelpers": true,
    
    // Interop Options
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    
    // Advanced Options
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "composite": true,
    
    // Experimental
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "exclude": [
    "node_modules",
    "**/node_modules",
    "**/.turbo",
    "**/dist",
    "**/build",
    "**/.next",
    "**/coverage",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/__tests__/**",
    "**/*.stories.tsx"
  ]
}
```

### Application-specific Configurations

#### API Configuration (`apps/api/tsconfig.json`)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "composite": false,
    "incremental": true,
    "tsBuildInfoFile": "./tsconfig.tsbuildinfo",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@erp/*": ["../../packages/*/dist"]
    },
    "types": [
      "node",
      "jest"
    ]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "test",
    "**/*.spec.ts",
    "**/*.test.ts"
  ],
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  }
}
```

#### Web App Configuration (`apps/web/tsconfig.json`)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/stores/*": ["./stores/*"],
      "@/types/*": ["./types/*"],
      "@erp/*": ["../../packages/*/dist"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "dist"
  ]
}
```

#### Package Configuration (`packages/ui/tsconfig.json`)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "types": ["node", "react", "react-dom"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.stories.tsx"
  ]
}
```

### TypeScript Build Scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "build:types": "tsc --build",
    "clean:types": "tsc --build --clean"
  }
}
```

## Testing Configuration

### Vitest Base Configuration (`vitest.config.base.ts`)

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export const createBaseConfig = (options: {
  testDir: string
  setupFiles?: string[]
  coverage?: boolean
}) => {
  return defineConfig({
    test: {
      globals: true,
      environment: 'node',
      setupFiles: options.setupFiles || [],
      include: [`${options.testDir}/**/*.{test,spec}.{ts,tsx}`],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        'coverage'
      ],
      testTimeout: 10000,
      hookTimeout: 10000,
      coverage: options.coverage ? {
        provider: 'v8',
        reporter: ['text', 'html', 'json', 'lcov', 'json-summary'],
        include: [`${options.testDir}/**/*.{ts,tsx}`],
        exclude: [
          `${options.testDir}/**/*.d.ts`,
          `${options.testDir}/**/*.stories.tsx`,
          `${options.testDir}/**/*.test.{ts,tsx}`,
          `${options.testDir}/**/*.spec.{ts,tsx}`,
          `${options.testDir}/**/__tests__/**`,
          `${options.testDir}/**/__mocks__/**`,
          `${options.testDir}/**/types.ts`,
          `${options.testDir}/test/**`,
          `${options.testDir}/index.ts`,
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
        clean: true,
        all: true,
      } : undefined,
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
  })
}
```

### API Testing Configuration (`apps/api/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import { createBaseConfig } from '../../vitest.config.base'

export default defineConfig({
  ...createBaseConfig({
    testDir: 'src',
    setupFiles: ['./test/setup.ts'],
    coverage: true,
  }),
  test: {
    ...createBaseConfig({ testDir: 'src', coverage: true }).test,
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      ...createBaseConfig({ testDir: 'src', coverage: true }).test?.coverage,
      exclude: [
        ...createBaseConfig({ testDir: 'src', coverage: true }).test?.coverage?.exclude || [],
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.entity.ts',
        'src/**/*.dto.ts',
        'src/migrations/**',
        'src/scripts/**',
      ],
    },
  },
})
```

### Frontend Testing Configuration (`apps/web/vitest.config.ts`)

```typescript
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/test/**',
        'src/app/layout.tsx',
        'src/app/page.tsx',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
})
```

### Test Setup Files

#### API Test Setup (`apps/api/test/setup.ts`)

```typescript
import { config } from 'dotenv'
import { vi } from 'vitest'

// Load test environment variables
config({ path: '.env.test' })

// Mock external services
vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
}))

vi.mock('stripe', () => ({
  Stripe: vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  })),
}))

// Setup global test utilities
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
}

// Increase timeout for database operations
vi.setConfig({ testTimeout: 30000 })
```

#### Frontend Test Setup (`apps/web/src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})
```

## Build Tools

### Turborepo Configuration (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local",
    "tsconfig.json",
    "tsconfig.base.json"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  },
  "remoteCache": {
    "enabled": true
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules/.cache",
    "format": "biome format --write .",
    "check": "biome check --apply .",
    "security:validate": "tsx scripts/security/validate-security.ts",
    "security:generate-secrets": "tsx scripts/security/generate-secrets.ts"
  }
}
```

### Docker Configuration

#### Development Dockerfile

```dockerfile
# Multi-stage build for development
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS dev
WORKDIR /app

RUN corepack enable

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 3001 3002

CMD ["pnpm", "run", "dev"]
```

#### Production Dockerfile

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production

FROM base AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV NODE_ENV production
ENV PORT 3000

CMD ["node", "dist/main.js"]
```

## Development Tools

### VS Code Configuration (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/.next": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/.next": true,
    "**/coverage": true,
    "**/pnpm-lock.yaml": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.turbo/**": true,
    "**/.next/**": true,
    "**/coverage/**": true
  }
}
```

### VS Code Extensions (`.vscode/extensions.json`)

```json
{
  "recommendations": [
    "biomejs.biome",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-todo-highlight",
    "gruntfuggly.todo-tree",
    "ms-vscode.vscode-markdown",
    "yzhang.markdown-all-in-one"
  ]
}
```

### Development Scripts

#### Environment Setup Script (`scripts/setup-dev.sh`)

```bash
#!/bin/bash

echo "🚀 Setting up TopSteel ERP development environment..."

# Check Node.js version
node_version=$(node --version)
echo "Node.js version: $node_version"

if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

echo "Installing dependencies..."
pnpm install

echo "Generating environment files..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file"
fi

if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "Created apps/api/.env file"
fi

if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.local.example apps/web/.env.local
  echo "Created apps/web/.env.local file"
fi

echo "Generating secure secrets..."
pnpm run security:generate-secrets development

echo "Building packages..."
pnpm run build:types

echo "Running type check..."
pnpm run type-check

echo "Running linting..."
pnpm run lint

echo "✅ Development environment setup complete!"
echo ""
echo "To start development servers:"
echo "  pnpm run dev"
echo ""
echo "To run tests:"
echo "  pnpm run test"
```

## CI/CD Configuration

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  CI: true
  NODE_VERSION: '18'

jobs:
  lint-and-type-check:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm run build

      - name: Run linting
        run: pnpm run lint

      - name: Run type checking
        run: pnpm run type-check

      - name: Security validation
        run: pnpm run security:validate

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: topsteel_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm run build

      - name: Run tests
        run: pnpm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/topsteel_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint-and-type-check, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpm run build

      - name: Build Docker images
        run: |
          docker build -t topsteel/api -f apps/api/Dockerfile .
          docker build -t topsteel/web -f apps/web/Dockerfile .
```

## IDE Configuration

### EditorConfig (`.editorconfig`)

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2

[*.{js,ts,jsx,tsx}]
indent_size = 2

[Makefile]
indent_style = tab
```

### Git Configuration

#### GitIgnore (`.gitignore`)

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
/dist/
/build/
.next/
out/

# Development files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Turbo
.turbo/

# Vercel
.vercel/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/settings.json
.idea/
*.swp
*.swo

# Test files
.nyc_output

# Database
*.db
*.sqlite

# Temporary files
tmp/
temp/

# Security files
*.pem
*.key
*.crt
secrets/
```

#### Git Hooks

Pre-commit hook (`.husky/pre-commit`):

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Check for linting errors
pnpm run lint

# Check for type errors
pnpm run type-check

# Security validation
pnpm run security:validate

echo "Pre-commit checks passed ✅"
```

---

This tooling configuration ensures consistent code quality, type safety, and developer productivity across the TopSteel ERP project.

**Last Updated**: August 2025