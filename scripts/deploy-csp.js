#!/usr/bin/env node

/**
 * CSP Deployment Script
 *
 * This script prepares and validates CSP configuration for production deployment
 * Run with: node scripts/deploy-csp.js
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// Check environment
const nodeEnv = process.env.NODE_ENV || 'development'

if (nodeEnv !== 'production') {
}

const securityConfigPath = path.join(rootDir, 'security.config.json')
if (fs.existsSync(securityConfigPath)) {
  const config = JSON.parse(fs.readFileSync(securityConfigPath, 'utf8'))

  if (
    config.headers?.security?.contentSecurityPolicy?.directives?.scriptSrc?.includes(
      "'unsafe-inline'"
    )
  ) {
    process.exit(1)
  }

  if (
    config.headers?.security?.contentSecurityPolicy?.directives?.styleSrc?.includes(
      "'unsafe-inline'"
    )
  ) {
    process.exit(1)
  }
} else {
}
const middlewarePath = path.join(rootDir, 'apps/web/src/middleware.ts')
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')

  if (!middlewareContent.includes('nonce-${nonce}')) {
    process.exit(1)
  }

  if (!middlewareContent.includes('strict-dynamic')) {
    process.exit(1)
  }
}
const securityModulePath = path.join(rootDir, 'apps/api/src/core/security/security.module.ts')
if (!fs.existsSync(securityModulePath)) {
  process.exit(1)
}

const violationsPath = path.join(rootDir, 'apps/api/src/core/security/csp-violations.controller.ts')
if (!fs.existsSync(violationsPath)) {
  process.exit(1)
}
try {
  execSync('cd apps/web && npm run build', {
    stdio: 'pipe',
    cwd: rootDir,
  })
} catch (_error) {
  process.exit(1)
}

try {
  execSync('cd apps/api && npm run build', {
    stdio: 'pipe',
    cwd: rootDir,
  })
} catch (_error) {
  process.exit(1)
}

// Create deployment checklist
const checklist = `
# CSP Production Deployment Checklist

## Pre-deployment ✅
- [x] CSP configuration validated
- [x] Middleware nonce implementation verified  
- [x] API security module confirmed
- [x] Production build successful
- [x] No unsafe-inline directives found

## Post-deployment TODO
- [ ] Start applications and verify no CSP violations in logs
- [ ] Test critical user journeys
- [ ] Monitor /api/security/csp-violations endpoint
- [ ] Verify CSP headers in production responses
- [ ] Set up alerting for critical CSP violations

## Environment Variables Required
\`\`\`
NODE_ENV=production
CSP_REPORT_ONLY=false
API_URL=https://your-api-domain.com
NEXT_PUBLIC_API_URL=https://your-api-domain.com
\`\`\`

## CSP Violation Monitoring
- Endpoint: https://your-api-domain.com/api/security/csp-violations
- Check for violations after deployment
- Critical violations will be logged as errors

## Rollback Plan
If CSP causes issues:
1. Set CSP_REPORT_ONLY=true (report but don't block)
2. Monitor violations and fix issues
3. Re-enable enforcement: CSP_REPORT_ONLY=false
`

fs.writeFileSync(path.join(rootDir, 'DEPLOYMENT_CHECKLIST.md'), checklist)

const _productionCSP = [
  "default-src 'self'",
  "script-src 'self' 'nonce-RANDOM' 'strict-dynamic'",
  "style-src 'self' 'nonce-RANDOM'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https: wss:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "child-src 'none'",
  'upgrade-insecure-requests',
  'report-uri /api/security/csp-violations',
].join('; ')
