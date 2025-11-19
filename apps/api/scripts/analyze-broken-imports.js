/**
 * Script to analyze files with broken TypeORM entity imports
 * and create a plan to fix them
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run TypeScript compiler to get errors
function getCompilationErrors() {
  try {
    execSync('npx tsc --noEmit', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return [];
  } catch (error) {
    // TSC exits with error code when there are errors
    const output = error.stdout || error.stderr || '';
    return output;
  }
}

// Parse TS errors to extract file paths and missing imports
function parseErrors(errorOutput) {
  const lines = errorOutput.split('\n');
  const errors = [];

  for (const line of lines) {
    // Match pattern: src/path/file.ts(line,col): error TS2307: Cannot find module 'path' ...
    const match = line.match(/^(src\/.+\.ts)\(\d+,\d+\): error TS2307: Cannot find module '(.+?)'/);
    if (match) {
      const [, filePath, modulePath] = match;
      errors.push({
        file: filePath,
        missingModule: modulePath,
      });
    }
  }

  return errors;
}

// Categorize files by type
function categorizeFiles(errors) {
  const categories = {
    databaseConfig: [],
    controllers: [],
    services: [],
    decorators: [],
    modules: [],
    indexes: [],
    scripts: [],
    other: [],
  };

  for (const error of errors) {
    const file = error.file.toLowerCase();

    if (file.includes('database') && file.includes('config')) {
      categories.databaseConfig.push(error);
    } else if (file.includes('controller')) {
      categories.controllers.push(error);
    } else if (file.includes('service')) {
      categories.services.push(error);
    } else if (file.includes('decorator')) {
      categories.decorators.push(error);
    } else if (file.includes('module')) {
      categories.modules.push(error);
    } else if (file.includes('index.ts')) {
      categories.indexes.push(error);
    } else if (file.includes('script')) {
      categories.scripts.push(error);
    } else {
      categories.other.push(error);
    }
  }

  return categories;
}

// Get unique files
function getUniqueFiles(errors) {
  const files = new Set();
  for (const error of errors) {
    files.add(error.file);
  }
  return Array.from(files).sort();
}

// Main analysis
console.log('\n🔍 Analyzing Broken Imports...\n');

const errorOutput = getCompilationErrors();
const errors = parseErrors(errorOutput);
const uniqueFiles = getUniqueFiles(errors);
const categories = categorizeFiles(errors);

console.log(`📊 Statistics:`);
console.log(`   Total import errors: ${errors.length}`);
console.log(`   Unique files affected: ${uniqueFiles.length}\n`);

console.log(`📂 By Category:\n`);
for (const [category, items] of Object.entries(categories)) {
  if (items.length > 0) {
    const files = getUniqueFiles(items);
    console.log(`   ${category.padEnd(20)} ${files.length.toString().padStart(3)} files`);
  }
}

console.log('\n');
console.log('📋 Detailed Breakdown:\n');

// Database Config Files
if (categories.databaseConfig.length > 0) {
  console.log('🗄️  DATABASE CONFIG FILES (TypeORM-specific - Can Delete):');
  const files = getUniqueFiles(categories.databaseConfig);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Index Files
if (categories.indexes.length > 0) {
  console.log('📇 INDEX FILES (Re-exports - Can Delete):');
  const files = getUniqueFiles(categories.indexes);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Modules
if (categories.modules.length > 0) {
  console.log('📦 MODULE FILES (Need TypeORM → Prisma):');
  const files = getUniqueFiles(categories.modules);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Controllers
if (categories.controllers.length > 0) {
  console.log('🎮 CONTROLLER FILES (Need Prisma types):');
  const files = getUniqueFiles(categories.controllers);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Services
if (categories.services.length > 0) {
  console.log('⚙️  SERVICE FILES (Need Prisma types):');
  const files = getUniqueFiles(categories.services);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Decorators
if (categories.decorators.length > 0) {
  console.log('🎨 DECORATOR FILES (Need Prisma types):');
  const files = getUniqueFiles(categories.decorators);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Scripts
if (categories.scripts.length > 0) {
  console.log('📜 SCRIPT FILES (May need updating):');
  const files = getUniqueFiles(categories.scripts);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Other
if (categories.other.length > 0) {
  console.log('❓ OTHER FILES:');
  const files = getUniqueFiles(categories.other);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Generate action plan
console.log('🎯 Action Plan:\n');

const plan = {
  toDelete: [
    ...getUniqueFiles(categories.databaseConfig),
    ...getUniqueFiles(categories.indexes),
  ],
  toUpdate: [
    ...getUniqueFiles(categories.modules),
    ...getUniqueFiles(categories.controllers),
    ...getUniqueFiles(categories.services),
    ...getUniqueFiles(categories.decorators),
    ...getUniqueFiles(categories.scripts),
    ...getUniqueFiles(categories.other),
  ],
};

console.log(`   📁 Files to DELETE: ${plan.toDelete.length}`);
console.log(`   ✏️  Files to UPDATE: ${plan.toUpdate.length}`);
console.log(`   📊 Total files: ${uniqueFiles.length}\n`);

// Save report
const report = {
  timestamp: new Date().toISOString(),
  statistics: {
    totalErrors: errors.length,
    uniqueFiles: uniqueFiles.length,
    toDelete: plan.toDelete.length,
    toUpdate: plan.toUpdate.length,
  },
  categories,
  actionPlan: plan,
  allFiles: uniqueFiles,
};

const reportPath = path.join(__dirname, '../docs/IMPORT_FIX_PLAN.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`✅ Report saved: ${reportPath}\n`);

// Generate deletion script
const deleteScript = [
  '#!/bin/bash',
  '# Script to delete obsolete TypeORM config files',
  '',
  'echo "🗑️  Deleting obsolete TypeORM files..."',
  'echo ""',
  '',
  ...plan.toDelete.map(file => `echo "Deleting: ${file}"\nrm "src/${file}"`),
  '',
  'echo ""',
  'echo "✅ Deletion complete!"',
  `echo "   Deleted: ${plan.toDelete.length} files"`,
].join('\n');

const scriptPath = path.join(__dirname, 'delete-obsolete-typeorm.sh');
fs.writeFileSync(scriptPath, deleteScript, { mode: 0o755 });

console.log(`✅ Deletion script: ${scriptPath}\n`);
