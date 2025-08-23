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

import { Command } from 'commander'
import { SecretManager } from '../apps/api/src/core/config/secret-manager'
import { envValidator } from '../apps/api/src/core/config/env-validator'
import { writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'

const program = new Command()

program
  .name('secrets-cli')
  .description('TopSteel Secrets Management CLI')
  .version('1.0.0')

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
      console.log(chalk.blue('🔐 Generating production secrets...'))
      
      const secrets = SecretManager.generateProductionSecrets()
      
      if (options.format === 'json') {
        const output = JSON.stringify(secrets, null, 2)
        if (options.output) {
          await writeFile(options.output, output)
          console.log(chalk.green(`✅ Secrets saved to: ${options.output}`))
        } else {
          console.log(output)
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
          console.log(chalk.green(`✅ Secrets saved to: ${options.output}`))
        } else {
          console.log(envContent)
        }
      }
      
      console.log(chalk.yellow('⚠️  Important: Store these secrets securely and never commit to version control!'))
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating secrets:'), error)
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
      console.log(chalk.blue('🔍 Validating environment secrets...'))
      
      // Load environment file if specified
      if (options.envFile && existsSync(options.envFile)) {
        const { config } = await import('dotenv')
        config({ path: options.envFile })
      }
      
      // Validate using the environment validator
      const result = await envValidator.validate({ throwOnError: false, logValidation: false })
      
      if (!result.success) {
        console.log(chalk.red('❌ Environment validation failed:'))
        result.errors?.forEach(error => console.log(chalk.red(`  - ${error}`)))
        process.exit(1)
      }
      
      // Validate secret strength
      const secretAnalysis = SecretManager.validateEnvironmentSecrets(process.env)
      
      console.log(chalk.green('✅ Environment validation passed'))
      
      // Report secret strength
      if (secretAnalysis.strong.length > 0) {
        console.log(chalk.green(`🔒 Strong secrets (${secretAnalysis.strong.length}):`))
        secretAnalysis.strong.forEach(key => console.log(chalk.green(`  ✓ ${key}`)))
      }
      
      if (secretAnalysis.medium.length > 0) {
        console.log(chalk.yellow(`⚠️  Medium strength secrets (${secretAnalysis.medium.length}):`))
        secretAnalysis.medium.forEach(key => console.log(chalk.yellow(`  ~ ${key}`)))
      }
      
      if (secretAnalysis.weak.length > 0) {
        console.log(chalk.red(`🔓 Weak secrets (${secretAnalysis.weak.length}):`))
        secretAnalysis.weak.forEach(key => console.log(chalk.red(`  ✗ ${key}`)))
      }
      
      if (secretAnalysis.defaults.length > 0) {
        console.log(chalk.red(`🚨 Default/Example secrets detected (${secretAnalysis.defaults.length}):`))
        secretAnalysis.defaults.forEach(key => console.log(chalk.red(`  ! ${key}`)))
        console.log(chalk.red('These must be changed before production deployment!'))
      }
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Security warnings:'))
        result.warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)))
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error validating secrets:'), error)
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
      console.log(chalk.blue('🔄 Rotating secrets...'))
      
      // Default keys to rotate if none specified
      const defaultKeys = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
        'INTERNAL_API_KEY',
        'WEBHOOK_SECRET'
      ]
      
      const keysToRotate = keys.length > 0 ? keys : defaultKeys
      
      // Confirm rotation
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Rotate the following secrets: ${keysToRotate.join(', ')}?`,
          default: false
        }
      ])
      
      if (!confirmed) {
        console.log(chalk.yellow('Operation cancelled'))
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
        
        console.log(chalk.green(`✓ Rotated ${key}: ${SecretManager.maskSecret(newSecrets[key])}`))
      }
      
      // Create backup if requested
      if (options.backup && existsSync(options.envFile)) {
        const backupFile = `${options.envFile}.backup.${Date.now()}`
        const originalContent = await readFile(options.envFile, 'utf8')
        await writeFile(backupFile, originalContent)
        console.log(chalk.blue(`📄 Backup created: ${backupFile}`))
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
      console.log(chalk.green(`✅ Secrets updated in: ${options.envFile}`))
      
      console.log(chalk.yellow('⚠️  Important: Restart all services to use the new secrets!'))
      
    } catch (error) {
      console.error(chalk.red('❌ Error rotating secrets:'), error)
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
        console.error(chalk.red(`❌ Input file not found: ${input}`))
        process.exit(1)
      }
      
      const { masterPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'masterPassword',
          message: 'Enter master password for encryption:',
          mask: '*'
        }
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
      
      console.log(chalk.green(`✅ Secrets encrypted and saved to: ${outputFile}`))
      console.log(chalk.yellow('⚠️  Store the master password securely!'))
      
    } catch (error) {
      console.error(chalk.red('❌ Error encrypting secrets:'), error)
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
    const masked = SecretManager.maskSecret(value, parseInt(options.visible))
    console.log(masked)
  })

/**
 * Check secret strength
 */
program
  .command('strength')
  .description('Check the strength of a secret')
  .argument('<value>', 'Secret value to check')
  .action((value) => {
    const strength = SecretManager.validateSecretStrength(value)
    const isDefault = SecretManager.isDefaultSecret(value)
    
    console.log(`Strength: ${strength}`)
    console.log(`Is default/example: ${isDefault ? 'Yes' : 'No'}`)
    console.log(`Length: ${value.length} characters`)
    console.log(`Unique characters: ${new Set(value).size}`)
  })

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command. Use --help for available commands.'))
  process.exit(1)
})

// Run the CLI
program.parse()