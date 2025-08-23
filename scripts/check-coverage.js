#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_THRESHOLD = {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 80
};

const packages = [
  { name: '@erp/ui', path: 'packages/ui', command: 'test:coverage' },
  { name: '@erp/web', path: 'apps/web', command: 'test:coverage' },
  { name: '@erp/api', path: 'apps/api', command: 'test:cov' }
];

async function checkCoverage() {
  console.log('🔍 Checking test coverage for all packages...\n');
  
  const results = [];
  
  for (const pkg of packages) {
    console.log(`📦 Running coverage for ${pkg.name}...`);
    
    try {
      // Run coverage command
      execSync(`pnpm --filter ${pkg.name} ${pkg.command}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Read coverage summary
      const summaryPath = path.join(pkg.path, 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(summaryPath)) {
        const coverage = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const total = coverage.total;
        
        const result = {
          package: pkg.name,
          lines: total.lines.pct,
          statements: total.statements.pct,
          functions: total.functions.pct,
          branches: total.branches.pct,
          passed: true
        };
        
        // Check if coverage meets thresholds
        for (const [metric, threshold] of Object.entries(COVERAGE_THRESHOLD)) {
          if (total[metric].pct < threshold) {
            result.passed = false;
          }
        }
        
        results.push(result);
        
        // Print results for this package
        console.log(`\n✅ Coverage for ${pkg.name}:`);
        console.log(`   Lines:      ${formatPercentage(total.lines.pct, COVERAGE_THRESHOLD.lines)}`);
        console.log(`   Statements: ${formatPercentage(total.statements.pct, COVERAGE_THRESHOLD.statements)}`);
        console.log(`   Functions:  ${formatPercentage(total.functions.pct, COVERAGE_THRESHOLD.functions)}`);
        console.log(`   Branches:   ${formatPercentage(total.branches.pct, COVERAGE_THRESHOLD.branches)}`);
      } else {
        console.log(`⚠️  No coverage data found for ${pkg.name}`);
        results.push({
          package: pkg.name,
          error: 'No coverage data found'
        });
      }
    } catch (error) {
      console.log(`❌ Failed to run coverage for ${pkg.name}: ${error.message}`);
      results.push({
        package: pkg.name,
        error: error.message
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  // Print summary
  console.log('📊 COVERAGE SUMMARY\n');
  console.log('Package'.padEnd(20) + 'Lines'.padEnd(10) + 'Stmts'.padEnd(10) + 'Funcs'.padEnd(10) + 'Branch'.padEnd(10) + 'Status');
  console.log('-'.repeat(70));
  
  let allPassed = true;
  
  for (const result of results) {
    if (result.error) {
      console.log(
        result.package.padEnd(20) +
        'ERROR'.padEnd(10) +
        '-'.padEnd(10) +
        '-'.padEnd(10) +
        '-'.padEnd(10) +
        '❌'
      );
      allPassed = false;
    } else {
      const status = result.passed ? '✅' : '❌';
      if (!result.passed) allPassed = false;
      
      console.log(
        result.package.padEnd(20) +
        formatValue(result.lines).padEnd(10) +
        formatValue(result.statements).padEnd(10) +
        formatValue(result.functions).padEnd(10) +
        formatValue(result.branches).padEnd(10) +
        status
      );
    }
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (allPassed) {
    console.log('\n✅ All packages meet coverage thresholds!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some packages do not meet coverage thresholds.\n');
    console.log('Required thresholds:');
    console.log(`  Lines:      ${COVERAGE_THRESHOLD.lines}%`);
    console.log(`  Statements: ${COVERAGE_THRESHOLD.statements}%`);
    console.log(`  Functions:  ${COVERAGE_THRESHOLD.functions}%`);
    console.log(`  Branches:   ${COVERAGE_THRESHOLD.branches}%\n`);
    process.exit(1);
  }
}

function formatPercentage(value, threshold) {
  const formatted = `${value.toFixed(2)}%`;
  if (value >= threshold) {
    return `${formatted} ✅`;
  } else {
    return `${formatted} ❌ (needs ${threshold}%)`;
  }
}

function formatValue(value) {
  if (typeof value === 'number') {
    return `${value.toFixed(1)}%`;
  }
  return '-';
}

// Run the coverage check
checkCoverage().catch(error => {
  console.error('Failed to check coverage:', error);
  process.exit(1);
});