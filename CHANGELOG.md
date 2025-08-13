# Changelog

All notable changes to the TopSteel ERP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-08-13

### Added
- Comprehensive CI/CD pipeline with GitHub Actions
  - Security scanning workflow (SAST, dependency scanning, secret detection)
  - Automated test runner (unit, integration, E2E, performance tests)
  - Container security scanning
- Enhanced Dependabot configuration with intelligent grouping
- Production deployment scripts for Windows and Unix systems
- Bundle optimization for Next.js application
  - SWC minification enabled
  - Modularized imports for Radix UI and Lucide React
  - Console removal in production builds

### Changed
- Updated dependencies to latest secure versions:
  - @tanstack/react-query: 5.83.0 → 5.85.0
  - @types/node: 22.6.0 → 24.2.1
  - @types/react: 18.3.2 → 19.1.10
  - eslint: 9.7.0 → 9.33.0
  - zod: 3.23.8 → 4.0.17
- Improved TypeScript configurations across all packages
- Enhanced build process with better error handling

### Fixed
- Missing property declaration in ImageElasticsearchService class
- TypeScript build errors in @erp/domains package
- Multiple dependency conflicts across workspace packages
- Biome linting errors (reduced from 738 to 46)

### Security
- Implemented comprehensive security scanning in CI/CD
- Added automated dependency vulnerability checks
- Configured secret detection in workflows
- Enhanced container security scanning

### Performance
- Optimized bundle sizes through Next.js configuration
- Implemented code splitting strategies
- Added performance testing in CI/CD pipeline
- Improved build times with parallel processing

## Previous Releases

### [1.0.0] - Initial Release
- Initial monorepo setup with pnpm workspaces
- Next.js 15.4.6 frontend application
- NestJS 11.1.6 backend API
- PostgreSQL database with TypeORM
- Redis caching layer
- ElasticSearch integration
- Basic authentication system
- Pricing module implementation