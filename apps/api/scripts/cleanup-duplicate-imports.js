#!/usr/bin/env node

/**
 * Nettoie les imports dupliqués TypeORM/Prisma
 * Garde TypeORM si le fichier utilise decorators/repositories
 * Garde Prisma si utilisé seulement comme type
 *
 * Usage: node apps/api/scripts/cleanup-duplicate-imports.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
let stats = {
  filesScanned: 0,
  filesWithDuplicates: 0,
  duplicatesResolved: 0,
  keptTypeOrm: 0,
  keptPrisma: 0,
  filesModified: 0,
};

// Patterns à rechercher
const patterns = {
  typeormDecorators: [
    /@Entity\(/,
    /@ManyToOne\(/,
    /@OneToMany\(/,
    /@ManyToMany\(/,
    /@JoinColumn\(/,
    /@JoinTable\(/,
  ],
  injectRepository: /@InjectRepository\(/,
  typeormImport: /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['\"]([^'\"]*entity[^'\"]*)['\"];?/g,
  prismaImport: /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/g,
};

/**
 * Scan récursif des fichiers TypeScript
 */
function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath, callback);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts')) {
      callback(filePath);
    }
  }
}

/**
 * Extrait les noms d'entities depuis une liste d'imports
 */
function extractEntityNames(importString) {
  return importString
    .split(',')
    .map(e => e.trim())
    .filter(e => e && /^[A-Z]/.test(e)); // Commence par majuscule
}

/**
 * Analyse et nettoie un fichier
 */
function analyzeAndCleanFile(filePath) {
  stats.filesScanned++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(srcDir, filePath);

  // 1. Détecter usages TypeORM (decorators, @InjectRepository)
  let hasTypeOrmUsage = false;
  for (const pattern of patterns.typeormDecorators) {
    if (pattern.test(content)) {
      hasTypeOrmUsage = true;
      break;
    }
  }
  if (patterns.injectRepository.test(content)) {
    hasTypeOrmUsage = true;
  }

  // 2. Extraire imports TypeORM
  const typeormImports = {};
  let match;
  const typeormPattern = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['\"]([^'\"]*entity[^'\"]*)['\"];?/g;
  while ((match = typeormPattern.exec(content)) !== null) {
    const entities = extractEntityNames(match[1] || match[2]);
    for (const entity of entities) {
      if (!typeormImports[entity]) {
        typeormImports[entity] = {
          fullMatch: match[0],
          path: match[3],
        };
      }
    }
  }

  // 3. Extraire imports Prisma
  const prismaImports = {};
  const prismaPattern = /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/g;
  let prismaFullMatch = null;
  while ((match = prismaPattern.exec(content)) !== null) {
    prismaFullMatch = match[0];
    const entities = extractEntityNames(match[1]);
    for (const entity of entities) {
      prismaImports[entity] = true;
    }
  }

  // 4. Détecter duplicates (entité importée depuis les 2 sources)
  const duplicates = Object.keys(typeormImports).filter(entity => prismaImports[entity]);

  if (duplicates.length === 0) {
    return; // Pas de duplicates
  }

  stats.filesWithDuplicates++;

  // 5. Décider quoi garder
  let newContent = content;
  const decision = hasTypeOrmUsage ? 'typeorm' : 'prisma';

  if (decision === 'typeorm') {
    // GARDER TypeORM, SUPPRIMER Prisma
    stats.keptTypeOrm++;

    // Supprimer duplicates de l'import Prisma
    if (prismaFullMatch) {
      const prismaEntities = Object.keys(prismaImports);
      const nonDuplicatePrisma = prismaEntities.filter(e => !duplicates.includes(e));

      if (nonDuplicatePrisma.length === 0) {
        // Supprimer complètement l'import Prisma
        newContent = newContent.replace(prismaFullMatch, '');
      } else {
        // Garder seulement les non-duplicates dans Prisma
        const newPrismaImport = `import { ${nonDuplicatePrisma.join(', ')} } from '@prisma/client'`;
        newContent = newContent.replace(prismaFullMatch, newPrismaImport);
      }
    }
  } else {
    // GARDER Prisma, SUPPRIMER TypeORM
    stats.keptPrisma++;

    // Supprimer les imports TypeORM des duplicates
    for (const duplicate of duplicates) {
      const typeormImport = typeormImports[duplicate];
      if (typeormImport) {
        // Supprimer l'import TypeORM complet pour ce duplicate
        newContent = newContent.replace(typeormImport.fullMatch, '');
      }
    }
  }

  // 6. Nettoyer imports vides et lignes blanches multiples
  newContent = newContent.replace(/import\s+{\s*}\s+from\s+['"@][^'"]+['"]/g, '');
  newContent = newContent.replace(/\n\n\n+/g, '\n\n');

  // 7. Écrire si modifié
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    stats.filesModified++;
    stats.duplicatesResolved += duplicates.length;
    console.log(`  ✓ ${relativePath} - ${duplicates.length} duplicate(s) resolved (kept ${decision})`);
  }
}

/**
 * Générer rapport
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAPPORT DE NETTOYAGE DES IMPORTS DUPLIQUÉS');
  console.log('='.repeat(80));

  console.log('\n📈 STATISTIQUES:');
  console.log(`  ✓ Fichiers scannés: ${stats.filesScanned}`);
  console.log(`  ✓ Fichiers avec duplicates: ${stats.filesWithDuplicates}`);
  console.log(`  ✓ Duplicates résolus: ${stats.duplicatesResolved}`);
  console.log(`  ✓ Imports TypeORM gardés: ${stats.keptTypeOrm}`);
  console.log(`  ✓ Imports Prisma gardés: ${stats.keptPrisma}`);
  console.log(`  ✓ Fichiers modifiés: ${stats.filesModified}`);

  console.log('\n✅ Stratégie appliquée:');
  console.log('  • Fichiers avec decorators TypeORM → Import TypeORM gardé');
  console.log('  • Fichiers avec @InjectRepository → Import TypeORM gardé');
  console.log('  • Autres fichiers → Import Prisma gardé (type-safe)');

  console.log('\n' + '='.repeat(80));
  console.log('Prochaine étape: Validation compilation');
  console.log('  npx tsc --noEmit');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main
 */
function main() {
  console.log('🚀 Démarrage du nettoyage des imports dupliqués...\n');

  // Scan tous les fichiers
  console.log('📂 Scan et nettoyage du répertoire src/...\n');
  scanDirectory(srcDir, analyzeAndCleanFile);

  // Rapport final
  generateReport();
}

// Exécuter
main();
