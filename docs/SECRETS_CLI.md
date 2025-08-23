# TopSteel Secrets Management CLI

Quick reference guide for the TopSteel secrets management command-line interface.

## Installation

The secrets CLI is automatically available after installing dependencies:

```bash
pnpm install
```

## Commands

### Generate Production Secrets

Generate a complete set of cryptographically secure secrets for production:

```bash
# Generate and display secrets
pnpm secrets:generate

# Save to file
pnpm secrets:generate --output .env.vault

# Generate in JSON format
pnpm secrets:generate --format json --output secrets.json
```

**Generated secrets include:**
- `JWT_SECRET` - Main JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token signing secret  
- `SESSION_SECRET` - Session encryption secret
- `INTERNAL_API_KEY` - Service-to-service authentication
- `WEBHOOK_SECRET` - Webhook verification secret
- `DATA_ENCRYPTION_KEY` - Database field encryption
- `FILE_ENCRYPTION_KEY` - File storage encryption
- `BACKUP_STORAGE_KEY` - Backup service authentication
- `BACKUP_STORAGE_SECRET` - Backup service credentials

### Validate Environment

Validate current environment variables and check for security issues:

```bash
# Validate current environment
pnpm secrets:validate

# Validate specific file
pnpm secrets:validate --env-file .env.production

# Production validation (stricter checks)
NODE_ENV=production pnpm secrets:validate
```

**Validation checks:**
- ✅ Required variables present
- ✅ Correct data types and formats
- ✅ Minimum security requirements
- ⚠️ Default/example values detection
- ⚠️ Production security warnings

### Rotate Secrets

Rotate specific secrets with automatic backup:

```bash
# Rotate all default secrets
pnpm secrets:rotate

# Rotate specific secrets
pnpm secrets:rotate JWT_SECRET JWT_REFRESH_SECRET

# Rotate with custom env file
pnpm secrets:rotate --env-file .env.vault

# Rotate without backup
pnpm secrets:rotate --no-backup JWT_SECRET
```

**Default rotation includes:**
- `JWT_SECRET`
- `JWT_REFRESH_SECRET` 
- `SESSION_SECRET`
- `INTERNAL_API_KEY`
- `WEBHOOK_SECRET`

### Encrypt Secrets File

Encrypt environment files with a master password:

```bash
# Encrypt file
pnpm secrets:encrypt .env.vault

# Specify output file
pnpm secrets:encrypt .env.vault --output .env.vault.encrypted
```

**Security features:**
- AES-256-GCM encryption
- SCRYPT key derivation
- Salt-based security
- JSON format with metadata

### Mask Secrets

Safely mask secrets for logging and display:

```bash
# Mask a secret value
pnpm secrets:mask "sk_live_abc123def456ghi789"
# Output: sk_l***************i789

# Custom visible characters
pnpm secrets:mask "secret_value" --visible 2  
# Output: se*********ue
```

### Check Secret Strength

Analyze secret strength and detect default values:

```bash
pnpm secrets strength "your_secret_here"
```

**Output includes:**
- Strength rating (weak/medium/strong)
- Length analysis
- Character diversity
- Default value detection

## Usage Examples

### Initial Production Setup

```bash
# 1. Generate production secrets
pnpm secrets:generate --output .env.vault

# 2. Validate configuration
pnpm secrets:validate --env-file .env.vault

# 3. Check for any warnings
NODE_ENV=production pnpm secrets:validate --env-file .env.vault

# 4. Set secure file permissions
chmod 600 .env.vault
```

### Regular Maintenance

```bash
# Monthly: Validate current environment
pnpm secrets:validate

# Quarterly: Rotate JWT secrets
pnpm secrets:rotate JWT_SECRET JWT_REFRESH_SECRET SESSION_SECRET

# Before deployment: Final validation
NODE_ENV=production pnpm secrets:validate
```

### Emergency Response

```bash
# Immediate secret rotation after compromise
pnpm secrets:rotate JWT_SECRET JWT_REFRESH_SECRET --backup

# Validate new configuration
pnpm secrets:validate

# Generate completely new secret set
pnpm secrets:generate --output .env.vault.new
```

## Environment File Formats

### Standard Environment File (.env)
```bash
# Standard key=value format
JWT_SECRET=abc123def456...
JWT_REFRESH_SECRET=def456ghi789...
SESSION_SECRET=ghi789jkl012...
```

### Encrypted Secrets File (.encrypted)
```json
{
  "version": "1.0",
  "encrypted": true,
  "algorithm": "aes-256-gcm",
  "created": "2024-01-15T10:30:00.000Z",
  "secrets": {
    "JWT_SECRET": {
      "encrypted": "...",
      "iv": "...",
      "salt": "..."
    }
  }
}
```

## Security Best Practices

### Development
- Use weak secrets in development
- Never commit real secrets to version control
- Use `.env.local` for local overrides

### Production
- Generate strong, unique secrets
- Rotate secrets regularly
- Encrypt secrets at rest
- Monitor for default values
- Use environment-specific secrets

### Secret Storage
- Use dedicated secret management systems in production
- Encrypt backups
- Restrict file permissions (600)
- Audit access logs

## Troubleshooting

### Common Issues

**"Environment validation failed"**
```bash
# Check specific errors
pnpm secrets:validate --env-file .env.local

# Common fixes:
# - Ensure all required variables are set
# - Check minimum length requirements
# - Verify data types and formats
```

**"Secret appears to be default value"**
```bash
# Generate new secret
pnpm secrets:generate | grep JWT_SECRET

# Or rotate existing
pnpm secrets:rotate JWT_SECRET
```

**"Permission denied"**
```bash
# Fix file permissions
chmod 600 .env.vault
chown $USER:$USER .env.vault
```

### Debug Mode

For detailed validation output:
```bash
DEBUG=true pnpm secrets:validate
```

## Integration

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Validate Environment
  run: |
    NODE_ENV=production pnpm secrets:validate
    if [ $? -ne 0 ]; then
      echo "❌ Environment validation failed"
      exit 1
    fi
```

### Docker Integration

```dockerfile
# Validate environment in container
RUN NODE_ENV=production pnpm secrets:validate --env-file .env.vault
```

### Monitoring Integration

```typescript
// Application startup
const result = await envValidator.validate()
if (!result.success) {
  // Send alert to monitoring system
  monitoring.alert('Environment validation failed', result.errors)
}
```

## API Reference

The CLI is built on top of the SecretManager utility class:

```typescript
import { SecretManager } from '@erp/api/src/core/config/secret-manager'

// Generate secrets programmatically
const jwtSecret = SecretManager.generateJWTSecret()
const apiKey = SecretManager.generateAPIKey()

// Validate secret strength
const strength = SecretManager.validateSecretStrength(secret)

// Mask for logging
const masked = SecretManager.maskSecret(secret)
```

## Support

For issues with the secrets CLI:

1. Check this documentation
2. Validate your environment file format
3. Ensure proper file permissions
4. Check application logs for detailed errors
5. Contact security team: security@topsteel.fr

---

**Security Note**: Always verify generated secrets meet your security requirements before using in production.