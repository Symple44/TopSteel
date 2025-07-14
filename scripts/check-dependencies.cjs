#!/usr/bin/env node

/**
 * 🔍 Script de vérification des dépendances
 * Vérifie les dépendances circulaires et la cohérence des packages
 */

const fs = require('fs');
const path = require('path');

const packages = ['domains', 'ui', 'utils', 'api-client', 'types', 'config'];
const packagesDir = path.join(__dirname, '..', 'packages');

console.log('🔍 Vérification des dépendances des packages...\n');

// Fonction pour lire le package.json
function readPackageJson(packageName) {
  const packagePath = path.join(packagesDir, packageName, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.warn(`⚠️  Package ${packageName} non trouvé`);
    return null;
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

// Construire le graphe de dépendances
const dependencyGraph = {};
const allDependencies = new Set();

packages.forEach(pkg => {
  const packageJson = readPackageJson(pkg);
  if (!packageJson) return;

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies
  };

  dependencyGraph[pkg] = Object.keys(deps)
    .filter(dep => dep.startsWith('@erp/'))
    .map(dep => dep.replace('@erp/', ''));

  Object.keys(deps).forEach(dep => {
    if (dep.startsWith('@erp/')) {
      allDependencies.add(dep.replace('@erp/', ''));
    }
  });
});

// Vérifier les dépendances circulaires
console.log('📊 Graphe de dépendances:');
console.log('=======================\n');

Object.entries(dependencyGraph).forEach(([pkg, deps]) => {
  console.log(`📦 @erp/${pkg}`);
  if (deps.length === 0) {
    console.log('   ✅ Aucune dépendance interne');
  } else {
    deps.forEach(dep => {
      console.log(`   ➜ @erp/${dep}`);
      
      // Vérifier la dépendance circulaire directe
      if (dependencyGraph[dep] && dependencyGraph[dep].includes(pkg)) {
        console.error(`   ❌ DÉPENDANCE CIRCULAIRE DÉTECTÉE avec @erp/${dep}`);
      }
    });
  }
  console.log('');
});

// Vérifier les packages orphelins
console.log('\n🔎 Vérification des packages orphelins:');
console.log('=====================================\n');

packages.forEach(pkg => {
  if (!allDependencies.has(pkg) && pkg !== 'config') {
    console.warn(`⚠️  @erp/${pkg} n'est utilisé par aucun autre package`);
  }
});

// Analyser la hiérarchie recommandée
console.log('\n📋 Hiérarchie recommandée:');
console.log('========================\n');
console.log('Niveau 0 (aucune dépendance): @erp/config');
console.log('Niveau 1 (base): @erp/utils');
console.log('Niveau 2 (domaines): @erp/domains, @erp/types');
console.log('Niveau 3 (UI): @erp/ui');
console.log('Niveau 4 (intégration): @erp/api-client');
console.log('Niveau 5 (applications): apps/*');

// Vérifier la conformité
console.log('\n✅ Vérifications de conformité:');
console.log('==============================\n');

// Vérifier que domains ne dépend pas de ui
if (!dependencyGraph.domains?.includes('ui')) {
  console.log('✅ @erp/domains ne dépend pas de @erp/ui');
} else {
  console.error('❌ @erp/domains ne devrait pas dépendre de @erp/ui');
}

// Vérifier que utils ne dépend de rien
if (dependencyGraph.utils?.length === 0 || !dependencyGraph.utils) {
  console.log('✅ @erp/utils n\'a pas de dépendances internes');
} else {
  console.error('❌ @erp/utils ne devrait pas avoir de dépendances internes');
}

// Générer un rapport
console.log('\n📊 Résumé:');
console.log('=========\n');
console.log(`Total de packages: ${packages.length}`);
console.log(`Packages avec dépendances internes: ${Object.values(dependencyGraph).filter(deps => deps.length > 0).length}`);
console.log(`Packages indépendants: ${Object.values(dependencyGraph).filter(deps => deps.length === 0).length}`);

// Afficher les commandes de build recommandées
console.log('\n🏗️  Ordre de build recommandé:');
console.log('============================\n');
console.log('1. pnpm --filter @erp/config build');
console.log('2. pnpm --filter @erp/utils build');
console.log('3. pnpm --filter @erp/types build');
console.log('4. pnpm --filter @erp/domains build');
console.log('5. pnpm --filter @erp/ui build');
console.log('6. pnpm --filter @erp/api-client build');
console.log('7. pnpm --filter "./apps/*" build');

console.log('\n✨ Vérification terminée!');