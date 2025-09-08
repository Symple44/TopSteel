#!/usr/bin/env tsx

/**
 * TopSteel Secrets Management CLI
 *
 * Utility for managing production secrets securely
 *
 * Usage:
 *   pnpm secrets generate        # Generate new production secrets
 *   pnpm secrets validate        # Validate current secrets
 *   pnpm secrets rotate [keys]   # Rotate specific secrets
 *   pnpm secrets encrypt         # Encrypt secrets file
 *   pnpm secrets mask [value]    # Mask a secret for logging
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { envValidator } from '../apps/api/src/core/config/env-validator'
import { SecretManager } from '../apps/api/src/core/config/secret-manager'

const program = new Command()

program.name('secrets-cli').description('TopSteel Secrets Management CLI').version('1.0.0')

/**
 * Generate new production secrets
 */
program
  .command('generate')
  .description('Generate a complete set of production secrets')
  .option('-o, --output <file>', 'Output file path', '.env.vault')
  .option('-f, --format <format>', 'Output format (env|json)', 'env')
  .action(async (options) => {
    try {
      const secrets = SecretManager.generateProductionSecrets()

      if (options.format === 'json') {
        const output = JSON.stringify(secrets, null, 2)
        if (options.output) {
          await writeFile(options.output, output)
        } else {
        }
      } else {
        // Generate .env format
        let envContent = '# Generated Production Secrets\n'
        envContent += `# Generated on: ${new Date().toISOString()}\n\n`

        for (const [key, value] of Object.entries(secrets)) {
          envContent += `${key}=${value}\n`
        }

        if (options.output) {
          await writeFile(options.output, envContent)
        } else {
        }
      }
    } catch (_error) {
      process.exit(1)
    }
  })

/**
 * Validate current environment secrets
 */
program
  .command('validate')
  .description('Validate current environment secrets')
  .option('--env-file <file>', 'Environment file to validate', '.env.local')
  .action(async (options) => {
    try {
      // Load environment file if specified
      if (options.envFile && existsSync(options.envFile)) {
        const { config } = await import('dotenv')
        config({ path: options.envFile })
      }

      // Validate using the environment validator
      const result = await envValidator.validate({ throwOnError: false, logValidation: false })

      if (!result.success) {
        result.errors?.forEach((_error) => {})
        process.exit(1)
      }

      // Validate secret strength
      const secretAnalysis = SecretManager.validateEnvironmentSecrets(process.env)

      // Report secret strength
      if (secretAnalysis.strong.length > 0) {
        secretAnalysis.strong.forEach((_key) => {})
      }

      if (secretAnalysis.medium.length > 0) {
        secretAnalysis.medium.forEach((_key) => {})
      }

      if (secretAnalysis.weak.length > 0) {
        secretAnalysis.weak.forEach((_key) => {})
      }

      if (secretAnalysis.defaults.length > 0) {
        secretAnalysis.defaults.forEach((_key) => {})
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((_warning) => {})
      }
    } catch (_error) {
      process.exit(1)
    }
  })

/**
 * Rotate specific secrets
 */
program
  .command('rotate')
  .description('Rotate specific secrets')
  .argument('[keys...]', 'Secret keys to rotate (default: all)')
  .option('--env-file <file>', 'Environment file to update', '.env.vault')
  .option('--backup', 'Create backup before rotation', true)
  .action(async (keys, options) => {
    try {
      // Default keys to rotate if none specified
      const defaultKeys = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
        'INTERNAL_API_KEY',
        'WEBHOOK_SECRET',
      ]

      const keysToRotate = keys.length > 0 ? keys : defaultKeys

      // Confirm rotation
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Rotate the following secrets: ${keysToRotate.join(', ')}?`,
          default: false,
        },
      ])

      if (!confirmed) {
        return
      }

      // Generate new secrets
      const newSecrets: Record<string, string> = {}

      for (const key of keysToRotate) {
        if (key.includes('JWT')) {
          newSecrets[key] = SecretManager.generateJWTSecret()
        } else if (key.includes('SESSION')) {
          newSecrets[key] = SecretManager.generateSessionSecret()
        } else if (key.includes('API_KEY')) {
          newSecrets[key] = SecretManager.generateAPIKey()
        } else {
          newSecrets[key] = SecretManager.generateSecret()
        }
      }

      // Create backup if requested
      if (options.backup && existsSync(options.envFile)) {
        const backupFile = `${options.envFile}.backup.${Date.now()}`
        const originalContent = await readFile(options.envFile, 'utf8')
        await writeFile(backupFile, originalContent)
      }

      // Update environment file
      let envContent = ''
      if (existsSync(options.envFile)) {
        envContent = await readFile(options.envFile, 'utf8')
      }

      // Update or add new secrets
      for (const [key, value] of Object.entries(newSecrets)) {
        const regex = new RegExp(`^${key}=.*$`, 'm')
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`)
        } else {
          envContent += `\n${key}=${value}`
        }
      }

      await writeFile(options.envFile, envContent)
    } catch (_error) {
      process.exit(1)
    }
  })

/**
 * Encrypt secrets file
 */
program
  .command('encrypt')
  .description('Encrypt a secrets file with a master password')
  .argument('<input>', 'Input file path')
  .option('-o, --output <file>', 'Output encrypted file path')
  .action(async (input, options) => {
    try {
      if (!existsSync(input)) {
        process.exit(1)
      }

      const { masterPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'masterPassword',
          message: 'Enter master password for encryption:',
          mask: '*',
        },
      ])

      const content = await readFile(input, 'utf8')
      const lines = content.split('\n')
      const secrets: Record<string, string> = {}

      // Parse environment file
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          if (key && valueParts.length > 0) {
            secrets[key] = valueParts.join('=')
          }
        }
      }

      const outputFile = options.output || `${input}.encrypted`
      await SecretManager.createSecureEnvFile(secrets, masterPassword, outputFile)
    } catch (_error) {
      process.exit(1)
    }
  })

/**
 * Mask a secret value
 */
program
  .command('mask')
  .description('Mask a secret value for safe logging')
  .argument('<value>', 'Secret value to mask')
  .option('--visible <chars>', 'Number of visible characters', '4')
  .action((value, options) => {
    const _masked = SecretManager.maskSecret(value, parseInt(options.visible, 10))
  })

/**
 * Check secret strength
 */
program
  .command('strength')
  .description('Check the strength of a secret')
  .argument('<value>', 'Secret value to check')
  .action((value) => {
    const _strength = SecretManager.validateSecretStrength(value)
    const _isDefault = SecretManager.isDefaultSecret(value)
  })

// Handle unknown commands
program.on('command:*', () => {
  process.exit(1)
})

// Run the CLI
program.parse()
