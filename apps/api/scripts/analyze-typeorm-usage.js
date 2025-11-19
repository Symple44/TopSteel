#!/usr/bin/env node

/**
 * Analyse l'usage de TypeORM dans le codebase
 * Identifie quelles entities supprimées en Phase 1 sont CRITIQUES vs INUTILISÉES
 *
 * Usage: node apps/api/scripts/analyze-typeorm-usage.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');
const results = {
  critical: [],
  canRemove: [],
  summary: {
    totalFilesScanned: 0,
    decoratorUsages: 0,
    moduleUsages: 0,
    repositoryInjections: 0,
    criticalEntities: 0,
    unusedEntities: 0
  },
  details: {}
};

// Liste des entities TypeORM supprimées en Phase 1 (commit f024017b)
const deletedEntities = [
  'user.entity',
  'user-session.entity',
  'mfa-session.entity',
  'role.entity',
  'permission.entity',
  'menu-configuration.entity',
  'menu-item.entity',
  'audit-log.entity',
  'notification.entity',
  'datatable-hierarchical-preferences.entity',
  'datatable-hierarchy-order.entity',
  'ui-preferences-reorderable-list.entity',
  // ... et autres (à compléter)
];

// Patterns à rechercher
const patterns = {
  decorators: [
    /@Entity\(/,
    /@ManyToOne\(/,
    /@OneToMany\(/,
    /@ManyToMany\(/,
    /@JoinColumn\(/,
    /@JoinTable\(/,
    /@PrimaryGeneratedColumn\(/,
    /@Column\(/,
    /@CreateDateColumn\(/,
    /@UpdateDateColumn\(/,
    /@DeleteDateColumn\(/,
    /@VersionColumn\(/,
  ],
  typeormModule: /TypeOrmModule\.forFeature\(\[([\s\S]*?)\]\)/g,
  injectRepository: /@InjectRepository\((\w+)(?:,\s*['"](\w+)['"])?\)/g,
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
 * Analyse un fichier pour détecter usages TypeORM
 */
function analyzeFile(filePath) {
  results.summary.totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(srcDir, filePath);

  const fileAnalysis = {
    path: relativePath,
    hasDecorators: false,
    decoratorsFound: [],
    entitiesInModule: [],
    repositoryInjections: [],
    imports: [],
  };

  // 1. Chercher decorators TypeORM
  for (const pattern of patterns.decorators) {
    if (pattern.test(content)) {
      fileAnalysis.hasDecorators = true;
      const decoratorName = pattern.source.match(/@(\w+)/)[1];
      fileAnalysis.decoratorsFound.push(decoratorName);
      results.summary.decoratorUsages++;
    }
  }

  // 2. Chercher TypeOrmModule.forFeature([...])
  let match;
  while ((match = patterns.typeormModule.exec(content)) !== null) {
    const entitiesBlock = match[1];
    // Parser les noms d'entities dans le bloc
    const entityNames = entitiesBlock
      .split(',')
      .map(e => e.trim())
      .filter(e => e && /^[A-Z]/.test(e)); // Commence par majuscule

    fileAnalysis.entitiesInModule.push(...entityNames);
    results.summary.moduleUsages++;
  }

  // 3. Chercher @InjectRepository(Entity)
  const injectPattern = /@InjectRepository\((\w+)(?:,\s*['"](\w+)['"])?\)/g;
  while ((match = injectPattern.exec(content)) !== null) {
    const entityName = match[1];
    const connectionName = match[2] || 'default';
    fileAnalysis.repositoryInjections.push({ entity: entityName, connection: connectionName });
    results.summary.repositoryInjections++;
  }

  // 4. Chercher imports d'entities
  const importPattern = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['\"]([^'\"]*entity[^'\"]*)['\"];?/g;
  while ((match = importPattern.exec(content)) !== null) {
    const importedItems = match[1] || match[2];
    const importPath = match[3];
    fileAnalysis.imports.push({ items: importedItems, from: importPath });
  }

  // Stocker analyse si pertinente
  if (
    fileAnalysis.hasDecorators ||
    fileAnalysis.entitiesInModule.length > 0 ||
    fileAnalysis.repositoryInjections.length > 0 ||
    fileAnalysis.imports.length > 0
  ) {
    results.details[relativePath] = fileAnalysis;
  }
}

/**
 * Identifier entities supprimées qui sont CRITIQUES
 */
function identifyCriticalEntities() {
  const entityUsage = {};

  // Initialiser compteurs
  for (const entity of deletedEntities) {
    entityUsage[entity] = {
      name: entity,
      usageCount: 0,
      usedInFiles: [],
      reasons: [],
    };
  }

  // Analyser chaque fichier
  for (const [filePath, analysis] of Object.entries(results.details)) {
    // Vérifier imports
    for (const imp of analysis.imports) {
      for (const entity of deletedEntities) {
        if (imp.from.includes(entity) || imp.items.includes(entity.replace('.entity', ''))) {
          if (!entityUsage[entity]) {
            entityUsage[entity] = {
              name: entity,
              usageCount: 0,
              usedInFiles: [],
              reasons: [],
            };
          }
          entityUsage[entity].usageCount++;
          if (!entityUsage[entity].usedInFiles.includes(filePath)) {
            entityUsage[entity].usedInFiles.push(filePath);
          }
          entityUsage[entity].reasons.push(`Imported in ${filePath}`);
        }
      }
    }

    // Vérifier TypeOrmModule.forFeature
    for (const entityName of analysis.entitiesInModule) {
      const entityKey = `${entityName.toLowerCase()}.entity`;
      if (entityUsage[entityKey]) {
        entityUsage[entityKey].usageCount += 2; // Plus critique
        if (!entityUsage[entityKey].usedInFiles.includes(filePath)) {
          entityUsage[entityKey].usedInFiles.push(filePath);
        }
        entityUsage[entityKey].reasons.push(`Used in TypeOrmModule.forFeature in ${filePath}`);
      }
    }

    // Vérifier @InjectRepository
    for (const injection of analysis.repositoryInjections) {
      const entityKey = `${injection.entity.toLowerCase()}.entity`;
      if (entityUsage[entityKey]) {
        entityUsage[entityKey].usageCount += 3; // Très critique
        if (!entityUsage[entityKey].usedInFiles.includes(filePath)) {
          entityUsage[entityKey].usedInFiles.push(filePath);
        }
        entityUsage[entityKey].reasons.push(
          `Injected via @InjectRepository in ${filePath} (connection: ${injection.connection})`
        );
      }
    }

    // Si le fichier a des decorators et importe une entity, c'est critique
    if (analysis.hasDecorators) {
      for (const imp of analysis.imports) {
        for (const entity of deletedEntities) {
          if (imp.from.includes(entity)) {
            if (!entityUsage[entity]) continue;
            entityUsage[entity].usageCount += 2;
            entityUsage[entity].reasons.push(
              `Used with decorators (${analysis.decoratorsFound.join(', ')}) in ${filePath}`
            );
          }
        }
      }
    }
  }

  // Classifier: CRITICAL vs CAN_REMOVE
  for (const [entity, usage] of Object.entries(entityUsage)) {
    if (usage.usageCount > 0) {
      results.critical.push({
        entity: entity,
        usageCount: usage.usageCount,
        files: usage.usedInFiles,
        reasons: [...new Set(usage.reasons)], // Dédupliquer
      });
      results.summary.criticalEntities++;
    } else {
      results.canRemove.push(entity);
      results.summary.unusedEntities++;
    }
  }

  // Trier par usage décroissant
  results.critical.sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Générer rapport lisible
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAPPORT D\'ANALYSE TYPEORM');
  console.log('='.repeat(80));

  console.log('\n📈 STATISTIQUES GLOBALES:');
  console.log(`  ✓ Fichiers scannés: ${results.summary.totalFilesScanned}`);
  console.log(`  ✓ Usages de decorators: ${results.summary.decoratorUsages}`);
  console.log(`  ✓ TypeOrmModule.forFeature: ${results.summary.moduleUsages}`);
  console.log(`  ✓ @InjectRepository: ${results.summary.repositoryInjections}`);
  console.log(`  ✓ Entities CRITIQUES: ${results.summary.criticalEntities}`);
  console.log(`  ✓ Entities inutilisées: ${results.summary.unusedEntities}`);

  console.log('\n🔴 ENTITIES CRITIQUES (À RESTAURER):');
  if (results.critical.length === 0) {
    console.log('  Aucune entity critique détectée.');
  } else {
    for (const item of results.critical) {
      console.log(`\n  • ${item.entity} (score: ${item.usageCount})`);
      console.log(`    Utilisé dans ${item.files.length} fichier(s):`);
      for (const file of item.files.slice(0, 3)) {
        console.log(`      - ${file}`);
      }
      if (item.files.length > 3) {
        console.log(`      ... et ${item.files.length - 3} autre(s)`);
      }
      console.log(`    Raisons principales:`);
      for (const reason of item.reasons.slice(0, 2)) {
        console.log(`      - ${reason}`);
      }
    }
  }

  console.log('\n✅ ENTITIES INUTILISÉES (Peuvent être supprimées):');
  if (results.canRemove.length === 0) {
    console.log('  Aucune entity inutilisée détectée.');
  } else {
    for (const entity of results.canRemove) {
      console.log(`  • ${entity}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📄 Rapport détaillé sauvegardé: apps/api/typeorm-usage-analysis.json');
  console.log('='.repeat(80) + '\n');
}

/**
 * Obtenir la liste des fichiers supprimés depuis git
 */
function getDeletedEntitiesFromGit() {
  try {
    console.log('🔍 Recherche des entities supprimées en Phase 1 (commit f024017b)...');
    const output = execSync('git show f024017b --name-only --diff-filter=D', {
      cwd: path.join(__dirname, '../../..'),
      encoding: 'utf-8',
    });

    const deletedFiles = output
      .split('\n')
      .filter(line => line.includes('entity.ts') && !line.includes('.spec.'))
      .map(line => path.basename(line));

    console.log(`  ✓ Trouvé ${deletedFiles.length} entities supprimées\n`);

    // Mettre à jour la liste
    deletedEntities.length = 0;
    deletedEntities.push(...deletedFiles.map(f => f.replace('.ts', '')));
  } catch (error) {
    console.warn('⚠️  Impossible de récupérer les fichiers depuis git, utilisation liste par défaut');
  }
}

/**
 * Main
 */
function main() {
  console.log('🚀 Démarrage de l\'analyse TypeORM...\n');

  // 1. Obtenir liste entities supprimées
  getDeletedEntitiesFromGit();

  // 2. Scanner tous les fichiers
  console.log('📂 Scan du répertoire src/...');
  scanDirectory(srcDir, analyzeFile);

  // 3. Identifier entities critiques
  console.log('🔬 Analyse des usages...');
  identifyCriticalEntities();

  // 4. Générer rapport
  generateReport();

  // 5. Sauvegarder JSON
  const outputPath = path.join(__dirname, '../typeorm-usage-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 6. Créer script de restauration
  generateRestoreScript();
}

/**
 * Générer script bash pour restaurer les entities critiques
 */
function generateRestoreScript() {
  const scriptPath = path.join(__dirname, 'restore-critical-entities.sh');
  let script = `#!/bin/bash
# Script généré automatiquement par analyze-typeorm-usage.js
# Restaure les entities TypeORM critiques depuis le commit avant Phase 1

set -e

echo "🔄 Restauration des entities TypeORM critiques..."
echo ""

COMMIT_BEFORE_DELETION="f024017b~1"

`;

  // Trouver les chemins complets des entities à restaurer
  const entitiesToRestore = results.critical.map(item => {
    // Chercher dans les fichiers analysés où l'entity était importée
    for (const [filePath, analysis] of Object.entries(results.details)) {
      for (const imp of analysis.imports) {
        if (imp.from.includes(item.entity)) {
          // Reconstruire le chemin probable
          const parts = imp.from.split('/');
          if (parts.includes('entities') || parts.includes('core')) {
            // C'est un import relatif, reconstruire le chemin absolu
            const dir = path.dirname(filePath);
            const resolvedPath = path.resolve(srcDir, dir, imp.from);
            return resolvedPath.replace(/\\/g, '/') + '.ts';
          }
        }
      }
    }
    return null;
  }).filter(Boolean);

  // Dédupliquer
  const uniquePaths = [...new Set(entitiesToRestore)];

  for (const entityPath of uniquePaths) {
    const relativePath = entityPath.replace(path.join(__dirname, '../').replace(/\\/g, '/'), '');
    script += `echo "  ✓ Restoring ${relativePath}"\n`;
    script += `git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/${relativePath}" 2>/dev/null || echo "    ⚠️  File not found in git history"\n\n`;
  }

  script += `
echo ""
echo "✅ Restauration terminée!"
echo ""
echo "Prochaine étape: Nettoyer les imports dupliqués"
echo "  → node apps/api/scripts/cleanup-duplicate-imports.js"
`;

  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');

  console.log(`📝 Script de restauration créé: ${path.relative(process.cwd(), scriptPath)}`);
}

// Exécuter
main();
