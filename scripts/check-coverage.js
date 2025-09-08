#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const COVERAGE_THRESHOLD = {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 80,
}

const packages = [
  { name: '@erp/ui', path: 'packages/ui', command: 'test:coverage' },
  { name: '@erp/web', path: 'apps/web', command: 'test:coverage' },
  { name: '@erp/api', path: 'apps/api', command: 'test:cov' },
]

async function checkCoverage() {
  const results = []

  for (const pkg of packages) {
    try {
      // Run coverage command
      execSync(`pnpm --filter ${pkg.name} ${pkg.command}`, {
        stdio: 'pipe',
        encoding: 'utf8',
      })

      // Read coverage summary
      const summaryPath = path.join(pkg.path, 'coverage', 'coverage-summary.json')

      if (fs.existsSync(summaryPath)) {
        const coverage = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
        const total = coverage.total

        const result = {
          package: pkg.name,
          lines: total.lines.pct,
          statements: total.statements.pct,
          functions: total.functions.pct,
          branches: total.branches.pct,
          passed: true,
        }

        // Check if coverage meets thresholds
        for (const [metric, threshold] of Object.entries(COVERAGE_THRESHOLD)) {
          if (total[metric].pct < threshold) {
            result.passed = false
          }
        }

        results.push(result)
      } else {
        results.push({
          package: pkg.name,
          error: 'No coverage data found',
        })
      }
    } catch (error) {
      results.push({
        package: pkg.name,
        error: error.message,
      })
    }
  }

  let allPassed = true

  for (const result of results) {
    if (result.error) {
      allPassed = false
    } else {
      const _status = result.passed ? '✅' : '❌'
      if (!result.passed) allPassed = false
    }
  }

  if (allPassed) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

function _formatPercentage(value, threshold) {
  const formatted = `${value.toFixed(2)}%`
  if (value >= threshold) {
    return `${formatted} ✅`
  } else {
    return `${formatted} ❌ (needs ${threshold}%)`
  }
}

function _formatValue(value) {
  if (typeof value === 'number') {
    return `${value.toFixed(1)}%`
  }
  return '-'
}

// Run the coverage check
checkCoverage().catch((_error) => {
  process.exit(1)
})
