#!/usr/bin/env node

/**
 * Script to validate security configuration for TopSteel ERP
 *
 * Usage:
 *   npm run validate-security
 *   npm run validate-security --environment production
 *   npm run validate-security --report
 *
 * This script performs comprehensive security validation and generates reports.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'
import { SecretManager } from '../../apps/api/src/core/config/secret-manager'

interface ValidationOptions {
  environment?: string
  generateReport?: boolean
  verbose?: boolean
  fixIssues?: boolean
}

interface SecurityIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: 'SECRETS' | 'CONFIG' | 'FILES' | 'PERMISSIONS'
  message: string
  location?: string
  recommendation?: string
  autoFixable?: boolean
}

class SecurityValidator {
  private issues: SecurityIssue[] = []
  private environment: string
  private options: ValidationOptions

  constructor(options: ValidationOptions = {}) {
    this.options = options
    this.environment = options.environment || process.env.NODE_ENV || 'development'
  }

  async validate(): Promise<{ passed: boolean; issues: SecurityIssue[]; score: number }> {
    // Load environment variables
    this.loadEnvironmentVariables()

    // Perform validations
    await this.validateSecrets()
    await this.validateConfigurationFiles()
    await this.validateFilePermissions()
    await this.validateEnvironmentSpecificRequirements()
    await this.validateCodeSecurity()

    // Calculate security score
    const score = this.calculateSecurityScore()

    // Display results
    this.displayResults(score)

    // Generate report if requested
    if (this.options.generateReport) {
      await this.generateSecurityReport(score)
    }

    // Auto-fix issues if requested
    if (this.options.fixIssues) {
      await this.autoFixIssues()
    }

    return {
      passed: this.issues.filter((issue) => issue.severity === 'CRITICAL').length === 0,
      issues: this.issues,
      score,
    }
  }

  private loadEnvironmentVariables() {
    const envPaths = ['.env', '.env.local', `.env.${this.environment}`]

    for (const envPath of envPaths) {
      if (existsSync(envPath)) {
        config({ path: envPath, override: false })
        if (this.options.verbose) {
        }
      }
    }
  }

  private async validateSecrets() {
    const secretValidation = SecretManager.validateEnvironmentSecrets(process.env)

    // Check for weak secrets
    secretValidation.weak.forEach((key) => {
      this.addIssue({
        severity: this.environment === 'production' ? 'CRITICAL' : 'MEDIUM',
        category: 'SECRETS',
        message: `Secret ${key} has weak entropy`,
        recommendation: `Generate a stronger secret using SecretManager.generateSecret()`,
        autoFixable: true,
      })
    })

    // Check for default secrets
    secretValidation.defaults.forEach((key) => {
      this.addIssue({
        severity: this.environment === 'production' ? 'CRITICAL' : 'HIGH',
        category: 'SECRETS',
        message: `Secret ${key} appears to be a default/example value`,
        recommendation: `Replace with a unique, randomly generated secret`,
        autoFixable: true,
      })
    })

    // Check required secrets
    const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET']

    if (this.environment === 'production') {
      requiredSecrets.push('DATABASE_URL')
    }

    requiredSecrets.forEach((key) => {
      const value = process.env[key]
      if (!value) {
        this.addIssue({
          severity: 'CRITICAL',
          category: 'SECRETS',
          message: `Required secret ${key} is not set`,
          recommendation: `Set ${key} environment variable`,
          autoFixable: false,
        })
      } else if (value.length < 32 && key.includes('SECRET')) {
        this.addIssue({
          severity: this.environment === 'production' ? 'CRITICAL' : 'HIGH',
          category: 'SECRETS',
          message: `Secret ${key} is too short (${value.length} chars, minimum 32)`,
          recommendation: `Use a secret with at least 32 characters`,
          autoFixable: true,
        })
      }
    })

    // Validate specific secret formats
    await this.validateSpecificSecretFormats()
  }

  private async validateSpecificSecretFormats() {
    const validators = [
      {
        key: 'DATABASE_URL',
        pattern: /^postgresql:\/\/[\w\-.]+:[\w\-.]*@[\w\-.]+:\d+\/[\w\-.]+(\?.*)?$/,
        message: 'Database URL format is invalid',
      },
      {
        key: 'STRIPE_SECRET_KEY',
        pattern: /^sk_(test_|live_)?[a-zA-Z0-9]{24,}$/,
        message: 'Stripe secret key format is invalid',
      },
      {
        key: 'OPENAI_API_KEY',
        pattern: /^sk-[a-zA-Z0-9]{48,}$/,
        message: 'OpenAI API key format is invalid',
      },
      {
        key: 'SENTRY_DSN',
        pattern: /^https:\/\/[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\/[0-9]+$/,
        message: 'Sentry DSN format is invalid',
      },
    ]

    validators.forEach(({ key, pattern, message }) => {
      const value = process.env[key]
      if (value && !pattern.test(value)) {
        this.addIssue({
          severity: 'HIGH',
          category: 'SECRETS',
          message: `${key}: ${message}`,
          recommendation: `Verify the ${key} format and update if necessary`,
          autoFixable: false,
        })
      }
    })

    // Environment-specific validations
    if (this.environment === 'production') {
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (stripeKey?.includes('sk_test_')) {
        this.addIssue({
          severity: 'CRITICAL',
          category: 'SECRETS',
          message: 'Using Stripe test keys in production environment',
          recommendation: 'Replace with live Stripe keys for production',
          autoFixable: false,
        })
      }

      const dbUrl = process.env.DATABASE_URL
      if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
        this.addIssue({
          severity: 'CRITICAL',
          category: 'SECRETS',
          message: 'Database URL points to localhost in production',
          recommendation: 'Use production database connection string',
          autoFixable: false,
        })
      }

      if (dbUrl && !dbUrl.includes('sslmode=require')) {
        this.addIssue({
          severity: 'HIGH',
          category: 'SECRETS',
          message: 'Database connection does not enforce SSL in production',
          recommendation: 'Add sslmode=require to DATABASE_URL',
          autoFixable: false,
        })
      }
    }
  }

  private async validateConfigurationFiles() {
    const configFiles = [
      { path: '.env.example', required: true },
      { path: '.env.vault.example', required: false },
      { path: '.gitignore', required: true },
    ]

    configFiles.forEach(({ path, required }) => {
      if (required && !existsSync(path)) {
        this.addIssue({
          severity: 'MEDIUM',
          category: 'CONFIG',
          message: `Required configuration file ${path} is missing`,
          location: path,
          recommendation: `Create ${path} file with appropriate configuration`,
          autoFixable: false,
        })
      }
    })

    // Check .env.example for hardcoded secrets
    if (existsSync('.env.example')) {
      await this.validateExampleEnvFile()
    }

    // Check .gitignore for security patterns
    if (existsSync('.gitignore')) {
      await this.validateGitignore()
    }
  }

  private async validateExampleEnvFile() {
    const content = readFileSync('.env.example', 'utf-8')
    const lines = content.split('\n')

    const dangerousPatterns = [
      { pattern: /^[^#]*=.{16,}[a-zA-Z0-9]{8,}/, message: 'Possible hardcoded secret' },
      { pattern: /password\s*=\s*[^#\s].{4,}/i, message: 'Hardcoded password' },
      { pattern: /secret\s*=\s*[^#\s].{8,}/i, message: 'Hardcoded secret' },
      { pattern: /key\s*=\s*[^#\s].{16,}/i, message: 'Hardcoded API key' },
    ]

    lines.forEach((line, index) => {
      dangerousPatterns.forEach(({ pattern, message }) => {
        if (pattern.test(line)) {
          // Allow some safe examples
          const safeExamples = ['your-', 'example', 'change-this', 'localhost', '=s*$']
          const isSafe = safeExamples.some((safe) => new RegExp(safe, 'i').test(line))

          if (!isSafe) {
            this.addIssue({
              severity: 'MEDIUM',
              category: 'FILES',
              message: `${message} in .env.example line ${index + 1}`,
              location: `.env.example:${index + 1}`,
              recommendation: 'Remove hardcoded values and use placeholder text',
              autoFixable: false,
            })
          }
        }
      })
    })
  }

  private async validateGitignore() {
    const content = readFileSync('.gitignore', 'utf-8')
    const requiredPatterns = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.staging',
      '*.pem',
      '*.key',
      '.secrets',
    ]

    requiredPatterns.forEach((pattern) => {
      if (!content.includes(pattern)) {
        this.addIssue({
          severity: 'HIGH',
          category: 'FILES',
          message: `Missing security pattern "${pattern}" in .gitignore`,
          location: '.gitignore',
          recommendation: `Add "${pattern}" to .gitignore to prevent committing sensitive files`,
          autoFixable: true,
        })
      }
    })
  }

  private async validateFilePermissions() {
    if (process.platform === 'win32') {
      return
    }

    const _sensitiveFiles = ['.env', '.env.local', '.env.production', '.secrets']

    // Note: This is a placeholder for file permission checking
    // In a real implementation, you'd check file permissions using fs.stat()
    // and validate that sensitive files are not world-readable
  }

  private async validateEnvironmentSpecificRequirements() {
    switch (this.environment) {
      case 'production':
        await this.validateProductionRequirements()
        break
      case 'staging':
        await this.validateStagingRequirements()
        break
      case 'development':
        await this.validateDevelopmentRequirements()
        break
    }
  }

  private async validateProductionRequirements() {
    const productionChecks = [
      {
        check: () => process.env.NODE_ENV === 'production',
        message: 'NODE_ENV should be set to "production"',
        severity: 'CRITICAL' as const,
      },
      {
        check: () => process.env.DEBUG !== 'true',
        message: 'Debug mode should be disabled in production',
        severity: 'HIGH' as const,
      },
      {
        check: () => process.env.ENABLE_SWAGGER !== 'true',
        message: 'Swagger should be disabled in production',
        severity: 'MEDIUM' as const,
      },
      {
        check: () => !process.env.JWT_SECRET || process.env.JWT_SECRET.length >= 64,
        message: 'JWT secret should be at least 64 characters in production',
        severity: 'CRITICAL' as const,
      },
    ]

    productionChecks.forEach(({ check, message, severity }) => {
      if (!check()) {
        this.addIssue({
          severity,
          category: 'CONFIG',
          message,
          recommendation: 'Update configuration for production environment',
          autoFixable: false,
        })
      }
    })
  }

  private async validateStagingRequirements() {
    // Staging should be similar to production but allow some debugging
    if (process.env.NODE_ENV !== 'staging') {
      this.addIssue({
        severity: 'MEDIUM',
        category: 'CONFIG',
        message: 'NODE_ENV should be set to "staging"',
        recommendation: 'Set NODE_ENV=staging',
        autoFixable: false,
      })
    }
  }

  private async validateDevelopmentRequirements() {
    // Development can be more permissive but still secure
    if (!process.env.JWT_SECRET) {
      this.addIssue({
        severity: 'LOW',
        category: 'CONFIG',
        message: 'JWT_SECRET not set in development',
        recommendation: 'Set a development JWT secret or use the secret vault',
        autoFixable: true,
      })
    }
  }

  private async validateCodeSecurity() {
    // This is a basic check - in a real implementation you might use
    // static analysis tools or grep for dangerous patterns

    const _dangerousPatterns = [
      { pattern: 'console.log.*password', message: 'Potential password logging' },
      { pattern: 'console.log.*secret', message: 'Potential secret logging' },
      { pattern: 'console.log.*token', message: 'Potential token logging' },
    ]

    // Note: This is a placeholder for code security scanning
    // You would typically use tools like ESLint security plugins,
    // SonarQube, or custom static analysis for this
  }

  private calculateSecurityScore(): number {
    const weights = {
      CRITICAL: -30,
      HIGH: -15,
      MEDIUM: -5,
      LOW: -1,
    }

    let score = 100
    this.issues.forEach((issue) => {
      score += weights[issue.severity]
    })

    return Math.max(0, Math.min(100, score))
  }

  private displayResults(score: number) {
    const issuesBySeverity = this.groupIssuesBySeverity()
    Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        const _icon =
          severity === 'CRITICAL'
            ? '🔴'
            : severity === 'HIGH'
              ? '🟠'
              : severity === 'MEDIUM'
                ? '🟡'
                : '⚪'
      }
    })

    if (this.issues.length === 0) {
    } else {
      this.issues.forEach((issue) => {
        const _icon =
          issue.severity === 'CRITICAL'
            ? '🔴'
            : issue.severity === 'HIGH'
              ? '🟠'
              : issue.severity === 'MEDIUM'
                ? '🟡'
                : '⚪'

        if (issue.location) {
        }

        if (issue.recommendation && this.options.verbose) {
        }

        if (issue.autoFixable) {
        }
      })
    }
    this.displayScoreInterpretation(score)
  }

  private displayScoreInterpretation(score: number) {
    if (score >= 90) {
    } else if (score >= 75) {
    } else if (score >= 60) {
    } else if (score >= 40) {
    } else {
    }
  }

  private async generateSecurityReport(score: number) {
    const timestamp = new Date().toISOString()
    const report = `# TopSteel Security Validation Report

Generated: ${timestamp}
Environment: ${this.environment}
Security Score: ${score}/100

## Summary

- Total Issues: ${this.issues.length}
- Critical Issues: ${this.issues.filter((i) => i.severity === 'CRITICAL').length}
- High Issues: ${this.issues.filter((i) => i.severity === 'HIGH').length}
- Medium Issues: ${this.issues.filter((i) => i.severity === 'MEDIUM').length}
- Low Issues: ${this.issues.filter((i) => i.severity === 'LOW').length}

## Issues by Category

${Object.entries(this.groupIssuesByCategory())
  .map(
    ([category, issues]) => `
### ${category} (${issues.length} issues)

${issues.map((issue) => `- [${issue.severity}] ${issue.message}${issue.recommendation ? `\n  Recommendation: ${issue.recommendation}` : ''}`).join('\n')}
`
  )
  .join('\n')}

## Recommendations

${this.generateRecommendations()
  .map((rec) => `- ${rec}`)
  .join('\n')}

## Security Score Breakdown

- Score starts at 100
- Critical issues: -30 points each
- High issues: -15 points each  
- Medium issues: -5 points each
- Low issues: -1 point each

---
Generated by TopSteel Security Validator
`

    const reportPath = join(process.cwd(), `security-report-${this.environment}-${Date.now()}.md`)
    writeFileSync(reportPath, report)
  }

  private async autoFixIssues() {
    const fixableIssues = this.issues.filter((issue) => issue.autoFixable)

    if (fixableIssues.length === 0) {
      return
    }

    // This would implement actual fixes
    // For now, just log what would be fixed
    fixableIssues.forEach((_issue) => {})
  }

  private addIssue(issue: SecurityIssue) {
    this.issues.push(issue)
  }

  private groupIssuesByCategory() {
    return this.issues.reduce(
      (groups, issue) => {
        if (!groups[issue.category]) groups[issue.category] = []
        groups[issue.category].push(issue)
        return groups
      },
      {} as Record<string, SecurityIssue[]>
    )
  }

  private groupIssuesBySeverity() {
    return this.issues.reduce(
      (groups, issue) => {
        if (!groups[issue.severity]) groups[issue.severity] = []
        groups[issue.severity].push(issue)
        return groups
      },
      {} as Record<string, SecurityIssue[]>
    )
  }

  private generateRecommendations(): string[] {
    const recs = []

    if (this.issues.some((i) => i.severity === 'CRITICAL')) {
      recs.push('Fix critical security issues immediately before deploying')
    }

    if (this.environment === 'production') {
      recs.push('Use a dedicated secrets management service')
      recs.push('Enable audit logging for all secret access')
      recs.push('Implement secret rotation schedules')
    }

    if (this.issues.some((i) => i.category === 'SECRETS')) {
      recs.push('Generate new cryptographically secure secrets')
    }

    return recs
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const options: ValidationOptions = {
    generateReport: args.includes('--report'),
    verbose: args.includes('--verbose'),
    fixIssues: args.includes('--fix'),
  }

  const envIndex = args.indexOf('--environment')
  if (envIndex !== -1 && args[envIndex + 1]) {
    options.environment = args[envIndex + 1]
  }

  const validator = new SecurityValidator(options)

  try {
    const result = await validator.validate()

    if (result.passed) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (_error) {
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { SecurityValidator }
