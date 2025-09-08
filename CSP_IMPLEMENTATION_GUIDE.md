# Content Security Policy (CSP) Implementation Guide

## Overview

This document describes the comprehensive Content Security Policy implementation for the TopSteel ERP application, which eliminates the need for `unsafe-inline` directives while maintaining full functionality.

## 🎯 Goals Achieved

✅ **Removed `unsafe-inline`** from all CSP directives
✅ **Implemented nonce-based CSP** for scripts and styles
✅ **Created CSP violation reporting** system
✅ **Maintained application functionality** without breaking changes
✅ **Enhanced XSS protection** through strict CSP policies

## 🏗️ Architecture

### Backend (NestJS API)

#### 1. CSP Nonce Service
**Location:** `apps/api/src/core/security/csp-nonce.service.ts`
- Generates cryptographically secure nonces for each request
- Manages nonce lifecycle and cleanup
- Provides validation methods

#### 2. Enhanced CSP Middleware
**Location:** `apps/api/src/core/security/enhanced-csp.middleware.ts`
- Applies nonce-based CSP headers to all responses
- Configures environment-specific policies
- Integrates with Helmet.js for additional security headers

#### 3. CSP Violation Reporting
**Location:** `apps/api/src/core/security/csp-violations.controller.ts`
- Endpoint: `POST /api/security/csp-violations`
- Logs and analyzes CSP violations
- Rate limiting to prevent spam
- Critical violation alerting

#### 4. Security Module
**Location:** `apps/api/src/core/security/security.module.ts`
- Orchestrates all security components
- Integrates with main application module

### Frontend (Next.js)

#### 1. CSP Nonce Utilities
**Location:** `apps/web/src/lib/security/csp-nonce.ts`
- Server-side nonce extraction from headers
- Client-side nonce access hooks
- Utility functions for nonce handling

#### 2. CSP-Compliant Components
**Location:** `apps/web/src/components/security/csp-style.tsx`
- `<CSPStyle>` component for nonce-protected inline styles
- `useCSPStyles()` hook for dynamic style generation
- Server component variants

#### 3. Enhanced Middleware
**Location:** `apps/web/src/middleware.ts`
- Generates nonces for each request
- Sets comprehensive CSP headers
- Configures violation reporting

#### 4. Root Layout Integration
**Location:** `apps/web/src/app/layout.tsx`
- Passes nonce to client via meta tag
- Enables client-side nonce access

## 📋 CSP Policy Details

### Production Policy
```
default-src 'self';
script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic';
style-src 'self' 'nonce-{RANDOM}';
img-src 'self' data: blob: https:;
font-src 'self' https://fonts.gstatic.com data:;
connect-src 'self' https: wss:;
frame-src 'none';
frame-ancestors 'none';
object-src 'none';
media-src 'self';
worker-src 'self' blob:;
base-uri 'self';
form-action 'self';
manifest-src 'self';
child-src 'none';
upgrade-insecure-requests;
report-uri /api/security/csp-violations;
```

### Development Policy
- Adds `https://vercel.live` for development tools
- Includes `ws://localhost:*` for hot reload
- More lenient but still secure

## 🔧 Implementation Details

### 1. Nonce Generation
```typescript
// Generate cryptographically secure nonce
const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
```

### 2. Style Handling
```typescript
// Before (unsafe)
<div style={{ color: 'red' }}>Content</div>

// After (CSP-compliant)
<CSPStyle styles={{ color: 'red' }}>Content</CSPStyle>
```

### 3. Script Handling
```typescript
// All scripts automatically get nonce from middleware
<script nonce={nonce}>
  // Your code here
</script>
```

## 🔍 Testing & Monitoring

### Automated Testing
Run the CSP test script:
```bash
node scripts/test-csp.js
```

### Browser Testing
1. Open browser developer tools
2. Check for CSP violations in console
3. Use the CSP test utility:
```typescript
import { logCSPReport } from '@/lib/security/csp-test'
await logCSPReport()
```

### Violation Monitoring
- Violations are logged to `/api/security/csp-violations`
- Critical violations trigger alerts
- Rate limiting prevents log spam

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Run CSP test script and verify no critical issues
- [ ] Test all application functionality
- [ ] Verify no console CSP violations in production build
- [ ] Configure violation monitoring/alerting

### Post-deployment
- [ ] Monitor CSP violation endpoint for unexpected reports
- [ ] Set up alerting for critical violations
- [ ] Review violation patterns weekly
- [ ] Update allowlists as needed

## 🛠️ Configuration

### Environment Variables
```env
# Development
NODE_ENV=development
CSP_REPORT_ONLY=true

# Production
NODE_ENV=production
CSP_REPORT_ONLY=false
```

### Security Config
**Location:** `security.config.json`
- No more `unsafe-inline` in scriptSrc or styleSrc
- Nonce-based policies enforced
- Comprehensive violation reporting

## 🆘 Troubleshooting

### Common Issues

#### CSP Violations for Inline Styles
**Solution:** Use `<CSPStyle>` component or move styles to CSS files

#### Third-party Scripts Blocked
**Solution:** Add trusted domains to `script-src` allowlist

#### Font Loading Issues
**Solution:** Ensure font sources are in `font-src` directive

#### Development Tools Blocked
**Solution:** Check development-specific allowlists in middleware

### Debug Commands
```bash
# Test CSP implementation
node scripts/test-csp.js

# Check for inline styles
grep -r "style={" apps/web/src --include="*.tsx"

# Verify nonce generation
curl -I http://localhost:3000 | grep -i csp
```

## 📚 References

### CSP Documentation
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Guide](https://developers.google.com/web/fundamentals/security/csp)

### Security Best Practices
- Always use `strict-dynamic` with nonces
- Never use `unsafe-inline` in production
- Implement comprehensive violation reporting
- Regularly review and update policies

## 🔄 Maintenance

### Regular Tasks
- **Weekly:** Review CSP violation reports
- **Monthly:** Update third-party script allowlists
- **Quarterly:** Audit and tighten policies
- **Annually:** Review and update security configuration

### Updating Policies
1. Test changes in development environment
2. Deploy with `Content-Security-Policy-Report-Only` first
3. Monitor violations for 24-48 hours
4. Deploy enforcing policy if no issues

## ✅ Verification

The implementation has been verified to:
- ✅ Remove all `unsafe-inline` directives
- ✅ Maintain full application functionality
- ✅ Provide comprehensive XSS protection
- ✅ Enable real-time violation monitoring
- ✅ Support both development and production environments

This CSP implementation significantly enhances the security posture of the TopSteel ERP application while maintaining developer experience and application performance.