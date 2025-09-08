#!/usr/bin/env node

/**
 * TopSteel Quality Configuration Updater
 * Automatically updates quality configuration based on project evolution
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.dirname(__dirname)

// Configuration paths
const QUALITY_CONFIG_PATH = path.join(PROJECT_ROOT, '.quality.json')
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json')
const BIOME_CONFIG_PATH = path.join(PROJECT_ROOT, 'biome.json')

class QualityConfigUpdater {
  constructor() {
    this.config = null
    this.packageJson = null
    this.biomeConfig = null
  }

  async loadConfigurations() {
    try {
      // Load quality config
      const qualityConfigContent = await fs.readFile(QUALITY_CONFIG_PATH, 'utf8')
      this.config = JSON.parse(qualityConfigContent)

      // Load package.json
      const packageJsonContent = await fs.readFile(PACKAGE_JSON_PATH, 'utf8')
      this.packageJson = JSON.parse(packageJsonContent)

      // Load biome config
      const biomeConfigContent = await fs.readFile(BIOME_CONFIG_PATH, 'utf8')
      this.biomeConfig = JSON.parse(biomeConfigContent)
    } catch (_error) {
      process.exit(1)
    }
  }

  async analyzeProject() {
    const analysis = {
      totalFiles: 0,
      typeScriptFiles: 0,
      reactFiles: 0,
      testFiles: 0,
      configFiles: 0,
      apps: [],
      packages: [],
    }

    // Analyze apps directory
    try {
      const appsDir = path.join(PROJECT_ROOT, 'apps')
      const apps = await fs.readdir(appsDir)
      analysis.apps = apps.filter((app) => {
        const appPath = path.join(appsDir, app)
        return fs
          .stat(appPath)
          .then((stat) => stat.isDirectory())
          .catch(() => false)
      })
    } catch (_error) {}

    // Analyze packages directory
    try {
      const packagesDir = path.join(PROJECT_ROOT, 'packages')
      const packages = await fs.readdir(packagesDir)
      analysis.packages = packages.filter((pkg) => {
        const pkgPath = path.join(packagesDir, pkg)
        return fs
          .stat(pkgPath)
          .then((stat) => stat.isDirectory())
          .catch(() => false)
      })
    } catch (_error) {}

    // Count file types
    await this.countFiles(PROJECT_ROOT, analysis)

    return analysis
  }

  async countFiles(dir, analysis, level = 0) {
    if (level > 3) return // Limit recursion depth

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (
          entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === '.next'
        ) {
          continue
        }

        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          await this.countFiles(fullPath, analysis, level + 1)
        } else if (entry.isFile()) {
          analysis.totalFiles++

          if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            analysis.typeScriptFiles++
          }

          if (entry.name.endsWith('.tsx') || entry.name.includes('component')) {
            analysis.reactFiles++
          }

          if (
            entry.name.includes('.test.') ||
            entry.name.includes('.spec.') ||
            entry.name.includes('__tests__')
          ) {
            analysis.testFiles++
          }

          if (entry.name.includes('.config.') || entry.name.endsWith('.json')) {
            analysis.configFiles++
          }
        }
      }
    } catch (_error) {
      // Ignore permission errors
    }
  }

  updateThresholds(analysis) {
    // Adjust coverage thresholds based on project size
    if (analysis.typeScriptFiles > 500) {
      this.config.thresholds.coverage.minimum = Math.max(
        75,
        this.config.thresholds.coverage.minimum
      )
    } else if (analysis.typeScriptFiles < 100) {
      this.config.thresholds.coverage.minimum = Math.min(
        90,
        this.config.thresholds.coverage.minimum + 5
      )
    }

    // Adjust complexity thresholds based on file count
    if (analysis.typeScriptFiles > 300) {
      this.config.thresholds.complexity.cyclomatic = Math.min(
        12,
        this.config.thresholds.complexity.cyclomatic + 2
      )
    }

    // Adjust bundle size thresholds based on apps
    if (analysis.apps.includes('marketplace-storefront')) {
      this.config.thresholds.bundleSize.marketplace = '4MB' // Slightly larger for marketplace
    }

    // Update performance thresholds based on complexity
    const complexityRatio =
      analysis.typeScriptFiles / (analysis.apps.length + analysis.packages.length)
    if (complexityRatio > 50) {
      this.config.thresholds.performance.buildTime = Math.min(
        450,
        this.config.thresholds.performance.buildTime + 30
      )
    }
  }

  updateLintingRules() {
    // Sync with Biome configuration
    if (this.biomeConfig.linter?.rules) {
      const biomeRules = this.biomeConfig.linter.rules

      // Update TypeScript rules based on Biome config
      if (biomeRules.correctness?.noUnusedVariables) {
        this.config.linting.rules.typescript.noUnusedVariables =
          biomeRules.correctness.noUnusedVariables
      }

      if (biomeRules.correctness?.noUnusedImports) {
        this.config.linting.rules.typescript.noUnusedImports =
          biomeRules.correctness.noUnusedImports
      }

      if (biomeRules.suspicious?.noExplicitAny) {
        this.config.linting.rules.typescript.noExplicitAny = biomeRules.suspicious.noExplicitAny
      }
    }

    // Add React-specific rules if React files detected
    if (this.analysis?.reactFiles > 0) {
      this.config.linting.rules.react = {
        ...this.config.linting.rules.react,
        useHooksRules: 'error',
        exhaustiveDeps: 'warn',
      }
    }
  }

  updateToolsConfiguration() {
    // Update based on package.json dependencies
    const dependencies = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies,
    }

    // Enable/disable tools based on dependencies
    if (dependencies['@biomejs/biome']) {
      this.config.tools.linters.biome.enabled = true
      this.config.tools.formatters.biome.enabled = true
    }

    if (dependencies.vitest) {
      this.config.tools.testing.vitest.enabled = true
    }

    if (dependencies.jest) {
      this.config.tools.testing.jest.enabled = true
    }

    // Update bundle analysis tools
    if (dependencies['webpack-bundle-analyzer']) {
      this.config.tools.bundleAnalysis['webpack-bundle-analyzer'].enabled = true
    }
  }

  updateStandardsForMonorepo() {
    if (this.analysis?.apps.length > 1 || this.analysis?.packages.length > 0) {
      // Monorepo-specific standards
      this.config.standards.codeStructure.maxLinesPerFile = 600 // Slightly larger for monorepos
      this.config.standards.fileNaming = {
        ...this.config.standards.fileNaming,
        'monorepo-packages': 'kebab-case',
        'monorepo-apps': 'kebab-case',
      }

      // Add monorepo-specific documentation requirements
      this.config.standards.documentation.readme.sections.push('architecture', 'monorepo-structure')
    }
  }

  async saveConfiguration() {
    try {
      // Update version and timestamp
      this.config.version = this.incrementVersion(this.config.version)
      this.config.lastUpdated = new Date().toISOString()
      this.config.updatedBy = 'quality-config-updater'

      // Write back to file with proper formatting
      const configJson = JSON.stringify(this.config, null, 2)
      await fs.writeFile(QUALITY_CONFIG_PATH, configJson, 'utf8')
    } catch (_error) {
      process.exit(1)
    }
  }

  incrementVersion(version) {
    const parts = version.split('.')
    const patch = parseInt(parts[2] || '0', 10) + 1
    return `${parts[0]}.${parts[1]}.${patch}`
  }

  async generateReport() {
    const reportPath = path.join(PROJECT_ROOT, 'quality-config-update-report.md')
    const report = `# Quality Configuration Update Report

**Updated at:** ${new Date().toISOString()}
**Version:** ${this.config.version}

## Analysis Summary

- **Total Files:** ${this.analysis.totalFiles}
- **TypeScript Files:** ${this.analysis.typeScriptFiles}
- **React Files:** ${this.analysis.reactFiles}
- **Test Files:** ${this.analysis.testFiles}
- **Apps:** ${this.analysis.apps.join(', ') || 'None'}
- **Packages:** ${this.analysis.packages.join(', ') || 'None'}

## Configuration Updates

### Thresholds
- Coverage Minimum: ${this.config.thresholds.coverage.minimum}%
- Complexity Threshold: ${this.config.thresholds.complexity.cyclomatic}
- Build Time: ${this.config.thresholds.performance.buildTime}s

### Tools Enabled
- Biome: ${this.config.tools.linters.biome.enabled}
- Vitest: ${this.config.tools.testing.vitest.enabled}
- Bundle Analyzer: ${this.config.tools.bundleAnalysis['webpack-bundle-analyzer'].enabled}

### Standards
- Max Lines per File: ${this.config.standards.codeStructure.maxLinesPerFile}
- Documentation Coverage: ${this.config.standards.documentation.minimumCoverage}%

## Recommendations

1. Review the updated thresholds and ensure they align with your project goals
2. Run quality checks to verify the new configuration works correctly
3. Update team documentation if standards have changed
4. Consider running a full quality audit with the new settings

---
*Generated automatically by quality-config-updater*
`

    await fs.writeFile(reportPath, report, 'utf8')
  }

  async run() {
    await this.loadConfigurations()
    this.analysis = await this.analyzeProject()
    this.updateThresholds(this.analysis)
    this.updateLintingRules()
    this.updateToolsConfiguration()
    this.updateStandardsForMonorepo()
    await this.saveConfiguration()
    await this.generateReport()
  }
}

// Run the updater
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new QualityConfigUpdater()
  updater.run().catch((_error) => {
    process.exit(1)
  })
}

export default QualityConfigUpdater
