/**
 * Script to detect missing entity imports in TypeORM modules
 * Finds TypeOrmModule.forFeature([Entity1, Entity2]) without corresponding imports
 */

const fs = require('fs');
const path = require('path');

// Find all .module.ts files
function findModuleFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        findModuleFiles(filePath, fileList);
      }
    } else if (file.endsWith('.module.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Extract entities used in TypeOrmModule.forFeature()
function extractUsedEntities(content) {
  const entities = [];

  // Match: TypeOrmModule.forFeature([Entity1, Entity2, ...], ...)
  const forFeatureRegex = /TypeOrmModule\.forFeature\(\s*\[([^\]]+)\]/g;
  let match;

  while ((match = forFeatureRegex.exec(content)) !== null) {
    const entitiesStr = match[1];
    // Split by comma, trim, filter out empty
    const entityNames = entitiesStr
      .split(',')
      .map(e => e.trim())
      .filter(e => e && !e.startsWith('//') && !e.startsWith('/*'));

    entities.push(...entityNames);
  }

  return [...new Set(entities)]; // Remove duplicates
}

// Extract imported entities
function extractImportedEntities(content) {
  const imported = new Set();

  // Match: import { Entity1, Entity2 } from '...'
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1]
      .split(',')
      .map(i => i.trim())
      .filter(i => i && !i.startsWith('type '));

    imports.forEach(i => imported.add(i));
  }

  return imported;
}

// Main analysis
function analyzeModule(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  const usedEntities = extractUsedEntities(content);
  const importedEntities = extractImportedEntities(content);

  const missingImports = usedEntities.filter(entity => !importedEntities.has(entity));

  return {
    filePath,
    usedEntities,
    missingImports,
    hasMissingImports: missingImports.length > 0
  };
}

// Run analysis
const srcDir = path.join(__dirname, '../src');
const moduleFiles = findModuleFiles(srcDir);

console.log(`Found ${moduleFiles.length} module files\n`);

const results = moduleFiles.map(analyzeModule);
const modulesWithIssues = results.filter(r => r.hasMissingImports);

if (modulesWithIssues.length === 0) {
  console.log('✅ No missing entity imports found!');
} else {
  console.log(`⚠️  Found ${modulesWithIssues.length} modules with missing imports:\n`);

  modulesWithIssues.forEach((result, index) => {
    const relativePath = path.relative(srcDir, result.filePath);
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   Used entities: ${result.usedEntities.join(', ')}`);
    console.log(`   Missing imports: ${result.missingImports.join(', ')}`);
    console.log('');
  });

  // Save detailed report
  const reportPath = path.join(__dirname, '../missing-entity-imports-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(modulesWithIssues, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

process.exit(modulesWithIssues.length > 0 ? 1 : 0);
