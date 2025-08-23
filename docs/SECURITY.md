# TopSteel ERP - Security & Deployment Guide

This document outlines security best practices and secure deployment procedures for the TopSteel ERP system.

## Table of Contents

- [Security Overview](#security-overview)
- [Environment Variables Security](#environment-variables-security)
- [Secret Management](#secret-management)
- [Production Deployment](#production-deployment)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)

## Security Overview

TopSteel ERP implements multiple layers of security to protect sensitive data and ensure system integrity:

### Security Features Implemented

- **Environment Variable Validation**: Runtime validation with Zod schemas
- **Secret Management**: Secure generation, rotation, and storage utilities
- **JWT Security**: Strong token generation with proper expiration
- **Input Validation**: Comprehensive validation pipes and filters
- **Rate Limiting**: Enhanced throttling with configurable limits
- **CORS Protection**: Strict origin validation
- **Helmet Security**: HTTP headers security
- **Database Security**: Encrypted connections and query parameterization

## Environment Variables Security

### ⚠️ Critical Security Changes

**IMPORTANT**: The following security improvements have been implemented:

1. **JWT_SECRET Removed from Global Configuration**
   - `JWT_SECRET` has been removed from `turbo.json` `globalPassThroughEnv`
   - This prevents accidental exposure in build logs and CI/CD pipelines

2. **Runtime Environment Validation**
   - All environment variables are validated at application startup
   - Production deployments will fail if critical secrets are missing or weak

### Environment Variable Categories

#### 🔴 Critical Secrets (MUST be secure in production)
```bash
# JWT & Authentication
JWT_SECRET=                    # Min 32 chars, cryptographically secure
JWT_REFRESH_SECRET=           # Min 32 chars, different from JWT_SECRET
SESSION_SECRET=               # Min 32 chars, for session encryption

# Database
DATABASE_URL=                 # Secure connection string with strong password

# External Service API Keys
TWILIO_AUTH_TOKEN=           # SMS service authentication
STRIPE_SECRET_KEY=           # Payment processing (use live keys in prod)
OPENAI_API_KEY=              # AI service authentication
```

#### 🟡 Infrastructure Secrets
```bash
# Redis
REDIS_PASSWORD=              # If using Redis authentication

# Monitoring
SENTRY_DSN=                  # Error tracking
DATADOG_API_KEY=             # Performance monitoring
```

#### 🟢 Configuration Variables
```bash
# Application
NODE_ENV=production
PORT=3002
CORS_ORIGIN=https://your-domain.com

# Features
FEATURE_SMS_ENABLED=true
FEATURE_EMAIL_ENABLED=true
```

### Validation Schema

The system uses a comprehensive Zod validation schema that:

- **Validates data types and formats**: Ensures ports are numbers, URLs are valid, etc.
- **Enforces security requirements**: Minimum secret lengths, production-specific validations
- **Provides conditional validation**: SMS provider credentials based on selected provider
- **Generates detailed error messages**: Clear indication of what needs to be fixed

## Secret Management

### Generating Secure Secrets

Use the built-in secrets CLI for secure secret generation:

```bash
# Generate all production secrets
pnpm secrets:generate --output .env.vault

# Validate current environment
pnpm secrets:validate

# Rotate specific secrets
pnpm secrets:rotate JWT_SECRET JWT_REFRESH_SECRET

# Encrypt secrets file
pnpm secrets:encrypt .env.vault

# Mask secrets for logging
pnpm secrets:mask "sk_live_abc123def456"
```

### Manual Secret Generation

If you need to generate secrets manually:

```bash
# JWT/Session secrets (64 bytes hex)
openssl rand -hex 32

# API keys (32 bytes base64)
openssl rand -base64 32

# Random passwords (16 chars)
openssl rand -base64 16 | tr -d "=+/" | cut -c1-16
```

### Secret Strength Requirements

| Secret Type | Minimum Length | Character Requirements |
|-------------|---------------|----------------------|
| JWT_SECRET | 32 characters | High entropy hex/base64 |
| JWT_REFRESH_SECRET | 32 characters | Different from JWT_SECRET |
| SESSION_SECRET | 32 characters | High entropy hex/base64 |
| Database Password | 16 characters | Mixed case, numbers, symbols |
| API Keys | Variable | Provider specific |

### Secret Rotation

Implement regular secret rotation:

1. **Quarterly Rotation**: JWT secrets, session secrets
2. **Annual Rotation**: Database passwords, API keys
3. **Immediate Rotation**: Any compromised secrets

```bash
# Rotate JWT secrets (recommended quarterly)
pnpm secrets:rotate JWT_SECRET JWT_REFRESH_SECRET SESSION_SECRET

# Create backup before rotation
pnpm secrets:rotate --backup JWT_SECRET
```

## Production Deployment

### Pre-Deployment Security Checklist

Before deploying to production, verify:

- [ ] All secrets are generated and secure (not default values)
- [ ] Environment validation passes without warnings
- [ ] Database connections use encryption (SSL/TLS)
- [ ] CORS origins are restricted to production domains
- [ ] Debug features are disabled
- [ ] Monitoring and error tracking are configured
- [ ] Rate limiting is appropriately configured
- [ ] Backup and recovery procedures are in place

### Environment Setup

1. **Create Production Environment File**
```bash
# Copy template and fill with secure values
cp .env.vault.example .env.vault

# Generate production secrets
pnpm secrets:generate --output .env.vault
```

2. **Validate Configuration**
```bash
# Validate environment
pnpm secrets:validate --env-file .env.vault

# Check for security warnings
NODE_ENV=production pnpm secrets:validate
```

3. **Secure File Permissions**
```bash
# Restrict access to environment files
chmod 600 .env.vault
chown app:app .env.vault
```

### Docker Deployment

For containerized deployments:

```dockerfile
# Use secrets management in Docker
FROM node:20-alpine

# Copy application files
COPY . /app
WORKDIR /app

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set secure file permissions
RUN chmod 600 .env.vault && \
    chown node:node .env.vault

# Run as non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["node", "dist/main.js"]
```

### Kubernetes Deployment

Use Kubernetes secrets for sensitive data:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: topsteel-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-value>
  database-url: <base64-encoded-value>
  # ... other secrets

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: topsteel-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: topsteel/api:latest
        envFrom:
        - secretRef:
            name: topsteel-secrets
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
```

## Security Monitoring

### Startup Validation

The application performs comprehensive security validation at startup:

```typescript
// Example startup validation output
🔍 Validation des variables d'environnement...
✅ Variables d'environnement validées avec succès
⚠️  Avertissements de sécurité détectés:
  • JWT_SECRET appears to be using a default or insecure value
  • CORS_ORIGIN includes localhost in production
  • DEBUG mode is enabled in production
🔐 IMPORTANT: Corrigez ces problèmes de sécurité avant le déploiement en production!
```

### Security Metrics

Monitor these security-related metrics:

- **Authentication failures**: Failed login attempts
- **Rate limit violations**: Blocked requests due to rate limiting
- **Environment validation errors**: Configuration issues
- **Secret rotation events**: When secrets are rotated
- **Security warnings**: Runtime security issues detected

### Logging Security Events

```typescript
// Security events are logged with appropriate levels
logger.warn('⚠️  Weak secret detected', { secret: 'JWT_SECRET' })
logger.error('❌ Production deployment with insecure configuration')
logger.info('🔐 Secret rotation completed', { rotatedSecrets: ['JWT_SECRET'] })
```

## Incident Response

### Security Incident Types

1. **Secret Compromise**
   - Immediate secret rotation
   - Revoke affected sessions
   - Audit access logs

2. **Unauthorized Access**
   - Lock affected accounts
   - Review authentication logs
   - Update security policies

3. **Configuration Exposure**
   - Rotate exposed secrets
   - Review deployment procedures
   - Update access controls

### Emergency Procedures

#### Secret Compromise Response

```bash
# 1. Immediately rotate compromised secrets
pnpm secrets:rotate JWT_SECRET JWT_REFRESH_SECRET --backup

# 2. Validate new configuration
pnpm secrets:validate

# 3. Deploy updated configuration
# ... deployment commands ...

# 4. Monitor for unusual activity
# ... monitoring commands ...
```

#### Database Security Breach

```bash
# 1. Change database credentials
# Update DATABASE_URL with new credentials

# 2. Rotate application secrets
pnpm secrets:rotate --all

# 3. Force logout all users
# Restart application to invalidate sessions

# 4. Audit database access logs
# Review recent database activity
```

## Security Best Practices

### Development

1. **Never commit secrets**: Use `.env.local` for development
2. **Use weak secrets in development**: Real secrets only in production
3. **Regular dependency updates**: Keep security patches current
4. **Code reviews**: Review security-related changes carefully

### Production

1. **Environment isolation**: Separate production from other environments
2. **Principle of least privilege**: Minimal required permissions
3. **Regular security audits**: Quarterly security reviews
4. **Monitoring and alerting**: Real-time security event monitoring
5. **Backup and recovery**: Regular encrypted backups

### Continuous Security

1. **Automated vulnerability scanning**: Integrate with CI/CD
2. **Dependency auditing**: Regular `pnpm audit` runs
3. **Security testing**: Include security tests in test suites
4. **Team training**: Regular security awareness training

## Compliance

### Data Protection

- **GDPR Compliance**: Personal data handling procedures
- **Data Encryption**: Encryption at rest and in transit
- **Access Logging**: Comprehensive audit trails
- **Data Retention**: Automated data lifecycle management

### Industry Standards

- **ISO 27001**: Information security management
- **SOC 2**: Security and availability controls
- **PCI DSS**: If handling payment data

## Contact

For security-related questions or to report security issues:

- **Security Team**: security@topsteel.fr
- **Emergency Contact**: +33 (0)X XX XX XX XX
- **GPG Key**: Available on request

## Changelog

- **2024-01-XX**: Initial security implementation
- **2024-01-XX**: Environment validation system
- **2024-01-XX**: Secret management utilities
- **2024-01-XX**: Production deployment procedures

---

**⚠️ Important**: This document contains security-sensitive information. Distribute only to authorized personnel and keep updated with any security changes.