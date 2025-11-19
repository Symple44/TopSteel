/**
 * Script to analyze TypeORM entities vs Prisma models
 * Identifies duplicates (to delete) and missing models (to migrate)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all Prisma models
function getPrismaModels() {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const modelRegex = /^model\s+(\w+)/gm;
  const models = [];
  let match;

  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1]);
  }

  return models.sort();
}

// Get all TypeORM entity files
function getTypeOrmEntities() {
  const srcDir = path.join(__dirname, '../src');
  const entities = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.isFile() && item.name.endsWith('.entity.ts')) {
        const basename = path.basename(item.name, '.entity.ts');
        // Convert kebab-case to PascalCase
        const pascalCase = basename
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

        entities.push({
          file: fullPath,
          basename: basename,
          modelName: pascalCase,
        });
      }
    }
  }

  try {
    scanDirectory(srcDir);
    return entities.sort((a, b) => a.modelName.localeCompare(b.modelName));
  } catch (error) {
    console.error('Error finding TypeORM entities:', error.message);
    return [];
  }
}

// Normalize model name for comparison
function normalizeModelName(name) {
  // Remove common suffixes and normalize
  return name
    .replace(/Entity$/, '')
    .replace(/Model$/, '')
    .toLowerCase();
}

// Main analysis
function analyzeEntities() {
  console.log('\n🔍 Analyzing TypeORM vs Prisma...\n');

  const prismaModels = getPrismaModels();
  const typeormEntities = getTypeOrmEntities();

  console.log(`📊 Statistics:`);
  console.log(`   Prisma models: ${prismaModels.length}`);
  console.log(`   TypeORM entities: ${typeormEntities.length}`);
  console.log(`   Difference: ${typeormEntities.length - prismaModels.length}\n`);

  // Create normalized lookup
  const prismaLookup = new Set(
    prismaModels.map(name => normalizeModelName(name))
  );

  // Categorize entities
  const duplicates = [];
  const missing = [];
  const uncertain = [];

  typeormEntities.forEach(entity => {
    const normalized = normalizeModelName(entity.modelName);

    // Skip base/abstract entities
    if (entity.basename === 'base' || entity.basename === 'multi-tenant') {
      return;
    }

    if (prismaLookup.has(normalized)) {
      duplicates.push(entity);
    } else {
      // Check for close matches
      const closeMatch = prismaModels.find(pm =>
        normalizeModelName(pm).includes(normalized) ||
        normalized.includes(normalizeModelName(pm))
      );

      if (closeMatch) {
        uncertain.push({ ...entity, possibleMatch: closeMatch });
      } else {
        missing.push(entity);
      }
    }
  });

  // Report results
  console.log('✅ DUPLICATES (Already in Prisma - Can Delete):');
  console.log(`   Count: ${duplicates.length}\n`);
  duplicates.forEach(dup => {
    console.log(`   - ${dup.modelName.padEnd(35)} ${dup.file}`);
  });

  console.log('\n');
  console.log('❓ UNCERTAIN (Close matches - Manual review):');
  console.log(`   Count: ${uncertain.length}\n`);
  uncertain.forEach(unc => {
    console.log(`   - ${unc.modelName.padEnd(35)} → ${unc.possibleMatch}`);
    console.log(`     ${unc.file}`);
  });

  console.log('\n');
  console.log('❌ MISSING (Not in Prisma - Need Migration):');
  console.log(`   Count: ${missing.length}\n`);
  missing.forEach(miss => {
    console.log(`   - ${miss.modelName.padEnd(35)} ${miss.file}`);
  });

  // Generate deletion script
  console.log('\n');
  console.log('📝 Generating deletion script...\n');

  const deletionScript = [
    '#!/bin/bash',
    '# Auto-generated script to delete duplicate TypeORM entities',
    '# Review carefully before executing!',
    '',
    'echo "🗑️  Deleting duplicate TypeORM entities..."',
    'echo ""',
    '',
    ...duplicates.map(dup => `echo "Deleting: ${dup.basename}.entity.ts"\nrm "${dup.file}"`),
    '',
    'echo ""',
    'echo "✅ Deletion complete!"',
    `echo "   Deleted: ${duplicates.length} files"`,
  ].join('\n');

  const scriptPath = path.join(__dirname, 'delete-duplicate-entities.sh');
  fs.writeFileSync(scriptPath, deletionScript, { mode: 0o755 });

  console.log(`✅ Deletion script created: ${scriptPath}`);
  console.log(`   Review and execute with: bash ${scriptPath}\n`);

  // Generate summary report
  const report = {
    timestamp: new Date().toISOString(),
    statistics: {
      prismaModels: prismaModels.length,
      typeormEntities: typeormEntities.length,
      duplicates: duplicates.length,
      uncertain: uncertain.length,
      missing: missing.length,
    },
    duplicates: duplicates.map(d => ({
      name: d.modelName,
      file: d.file,
    })),
    uncertain: uncertain.map(u => ({
      name: u.modelName,
      possibleMatch: u.possibleMatch,
      file: u.file,
    })),
    missing: missing.map(m => ({
      name: m.modelName,
      file: m.file,
    })),
  };

  const reportPath = path.join(__dirname, '../docs/TYPEORM_CLEANUP_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✅ Report saved: ${reportPath}\n`);

  // Summary
  console.log('📋 Summary:');
  console.log(`   ✅ Can safely delete: ${duplicates.length} files`);
  console.log(`   ❓ Need manual review: ${uncertain.length} files`);
  console.log(`   ❌ Need migration: ${missing.length} files`);
  console.log(`   💾 Total cleanup potential: ${duplicates.length + uncertain.length} files\n`);
}

// Run analysis
analyzeEntities();
