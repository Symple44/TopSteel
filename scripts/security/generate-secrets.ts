#!/usr/bin/env node

/**
 * Script to generate secure secrets for TopSteel ERP
 *
 * Usage:
 *   npm run generate-secrets [environment]
 *   npm run generate-secrets production
 *   npm run generate-secrets development
 *
 * This script generates cryptographically secure secrets and provides
 * environment-specific recommendations.
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SecretManager } from '../../apps/api/src/core/config/secret-manager'

interface SecretDefinition {
  key: string
  generator: () => string
  description: string
  required: boolean
  environments: string[]
}

const SECRET_DEFINITIONS: SecretDefinition[] = [
  {
    key: 'JWT_SECRET',
    generator: () => SecretManager.generateJWTSecret(),
    description: 'JWT access token signing key',
    required: true,
    environments: ['development', 'staging', 'production'],
  },
  {
    key: 'JWT_REFRESH_SECRET',
    generator: () => SecretManager.generateJWTSecret(),
    description: 'JWT refresh token signing key',
    required: true,
    environments: ['development', 'staging', 'production'],
  },
  {
    key: 'SESSION_SECRET',
    generator: () => SecretManager.generateSessionSecret(),
    description: 'Session encryption key',
    required: true,
    environments: ['development', 'staging', 'production'],
  },
  {
    key: 'INTERNAL_API_KEY',
    generator: () => SecretManager.generateAPIKey(),
    description: 'Internal service-to-service authentication',
    required: false,
    environments: ['staging', 'production'],
  },
  {
    key: 'WEBHOOK_SECRET',
    generator: () => SecretManager.generateSecret({ length: 32, encoding: 'hex' }),
    description: 'Webhook signature verification',
    required: false,
    environments: ['staging', 'production'],
  },
  {
    key: 'DATA_ENCRYPTION_KEY',
    generator: () => SecretManager.generateSecret({ length: 32, encoding: 'hex' }),
    description: 'Database field encryption key',
    required: false,
    environments: ['production'],
  },
  {
    key: 'FILE_ENCRYPTION_KEY',
    generator: () => SecretManager.generateSecret({ length: 32, encoding: 'hex' }),
    description: 'File encryption key',
    required: false,
    environments: ['staging', 'production'],
  },
  {
    key: 'BACKUP_STORAGE_KEY',
    generator: () => SecretManager.generateAPIKey(),
    description: 'Cloud backup storage access key',
    required: false,
    environments: ['production'],
  },
  {
    key: 'BACKUP_STORAGE_SECRET',
    generator: () => SecretManager.generateSecret({ length: 40, encoding: 'base64' }),
    description: 'Cloud backup storage secret',
    required: false,
    environments: ['production'],
  },
]

async function generateSecrets(targetEnvironment: string = 'development') {
  const generatedSecrets: Record<string, string> = {}
  const recommendations: string[] = []

  // Filter secrets for the target environment
  const relevantSecrets = SECRET_DEFINITIONS.filter((secret) =>
    secret.environments.includes(targetEnvironment)
  )

  // Generate secrets
  for (const secretDef of relevantSecrets) {
    const value = secretDef.generator()
    generatedSecrets[secretDef.key] = value
  }

  // Add environment-specific recommendations
  recommendations.push(...getEnvironmentRecommendations(targetEnvironment))

  // Generate output files
  await generateEnvFile(generatedSecrets, targetEnvironment)
  await generateSecureVault(generatedSecrets, targetEnvironment)

  // Display summary
  displaySummary(generatedSecrets, recommendations, targetEnvironment)

  // Validate generated secrets
  const validationResult = SecretManager.validateEnvironmentSecrets(generatedSecrets)
  displayValidationResults(validationResult)
}

async function generateEnvFile(secrets: Record<string, string>, environment: string) {
  const envFileName = `.env.${environment}.generated`
  const envPath = join(process.cwd(), envFileName)

  let content = `# Generated secrets for ${environment} environment
# Generated at: ${new Date().toISOString()}
# 
# IMPORTANT SECURITY NOTES:
# - Never commit this file to version control
# - Copy values to your actual .env file
# - Delete this file after copying secrets
# - Use different secrets for each environment
#
# Generated with TopSteel Secret Generator
# ==========================================

`

  for (const [key, value] of Object.entries(secrets)) {
    const secretDef = SECRET_DEFINITIONS.find((def) => def.key === key)
    content += `# ${secretDef?.description || 'Generated secret'}\n`
    content += `${key}=${value}\n\n`
  }

  content += `# ==========================================
# NEXT STEPS:
# 1. Copy the secrets you need to your .env file
# 2. Delete this generated file for security
# 3. Test your application with the new secrets
# 4. In production, use a secrets management service
# ==========================================
`

  writeFileSync(envPath, content)
}

async function generateSecureVault(secrets: Record<string, string>, environment: string) {
  if (environment === 'production') {
    return
  }

  try {
    const vaultPath = join(process.cwd(), `.secrets.${environment}`)
    const masterPassword = `vault-${environment}-${Date.now()}-${SecretManager.generateSecret({ length: 16, encoding: 'hex' })}`

    await SecretManager.createSecureEnvFile(secrets, masterPassword, vaultPath)
  } catch (_error) {}
}

function getEnvironmentRecommendations(environment: string): string[] {
  const recommendations: string[] = []

  switch (environment) {
    case 'development':
      recommendations.push(
        'Use the secret vault for secure local storage',
        'Enable secret rotation for testing rotation workflows',
        'Never use production secrets in development',
        'Consider using Docker secrets for containerized development'
      )
      break

    case 'staging':
      recommendations.push(
        'Use environment variables or cloud secret manager',
        'Enable JWT rotation for testing',
        'Use staging-specific API keys (not production)',
        'Test secret rotation procedures',
        'Enable audit logging for secret access'
      )
      break

    case 'production':
      recommendations.push(
        'MUST use a dedicated secrets management service (AWS Secrets Manager, etc.)',
        'Enable JWT rotation with appropriate grace periods',
        'Implement secret rotation schedules',
        'Enable comprehensive audit logging',
        'Set up alerts for secret access anomalies',
        'Use separate secrets for each production environment/region',
        'Implement emergency secret rotation procedures'
      )
      break
  }

  return recommendations
}

function displaySummary(
  _secrets: Record<string, string>,
  recommendations: string[],
  _environment: string
) {
  recommendations.forEach((_rec, _index) => {})
}

function displayValidationResults(
  results: ReturnType<typeof SecretManager.validateEnvironmentSecrets>
) {
  if (results.weak.length > 0) {
  }

  if (results.defaults.length > 0) {
  }

  if (
    results.strong.length ===
    Object.keys(results.strong).length + Object.keys(results.medium).length
  ) {
  }
}

// Main execution
async function main() {
  const environment = process.argv[2] || 'development'
  const validEnvironments = ['development', 'staging', 'production']

  if (!validEnvironments.includes(environment)) {
    process.exit(1)
  }

  try {
    await generateSecrets(environment)
  } catch (_error) {
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}
