#!/usr/bin/env node

/**
 * Cartographie de l'usage ORM par domaine
 * Analyse chaque domaine pour scorer la complexité de migration
 * Génère roadmap priorisée pour Phase 3
 *
 * Usage: node apps/api/scripts/map-orm-usage-by-domain.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const results = {
  domains: {},
  summary: {
    totalDomains: 0,
    easyDomains: 0,
    mediumDomains: 0,
    highDomains: 0,
    veryHighDomains: 0,
    completedDomains: 0,
  },
  roadmap: [],
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
  injectRepository: /@InjectRepository\(/g,
  typeormModule: /TypeOrmModule\.forFeature\(\[([\s\S]*?)\]\)/g,
  prismaService: /PrismaService/g,
  typeormImport: /from\s+['"]typeorm['"]/g,
  prismaImport: /from\s+['"]@prisma\/client['"]/g,
};

/**
 * Identifier les domaines
 */
function identifyDomains() {
  const domains = new Set();

  // Domaines dans src/domains/
  const domainsDir = path.join(srcDir, 'domains');
  if (fs.existsSync(domainsDir)) {
    const dirs = fs.readdirSync(domainsDir);
    for (const dir of dirs) {
      const stat = fs.statSync(path.join(domainsDir, dir));
      if (stat.isDirectory() && !dir.startsWith('.')) {
        domains.add(`domains/${dir}`);
      }
    }
  }

  // Domaines dans src/features/
  const featuresDir = path.join(srcDir, 'features');
  if (fs.existsSync(featuresDir)) {
    const dirs = fs.readdirSync(featuresDir);
    for (const dir of dirs) {
      const stat = fs.statSync(path.join(featuresDir, dir));
      if (stat.isDirectory() && !dir.startsWith('.')) {
        domains.add(`features/${dir}`);
      }
    }
  }

  return Array.from(domains).sort();
}

/**
 * Scan récursif des fichiers dans un domaine
 */
function scanDomainDirectory(domainPath, callback) {
  if (!fs.existsSync(domainPath)) return;

  const files = fs.readdirSync(domainPath);

  for (const file of files) {
    const filePath = path.join(domainPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDomainDirectory(filePath, callback);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      callback(filePath);
    }
  }
}

/**
 * Analyse un domaine
 */
function analyzeDomain(domainName) {
  const domainPath = path.join(srcDir, domainName);

  const analysis = {
    name: domainName,
    status: 'HYBRID', // HYBRID, TYPEORM, PRISMA, COMPLETED
    files: {
      total: 0,
      entities: 0,
      services: 0,
      controllers: 0,
      modules: 0,
      tests: 0,
    },
    typeorm: {
      entities: [],
      decoratorCount: 0,
      repositoryInjections: 0,
      moduleRegistrations: 0,
      files: [],
    },
    prisma: {
      models: [],
      serviceUsages: 0,
      files: [],
    },
    tests: {
      unit: 0,
      e2e: 0,
      hasTests: false,
    },
    complexityScore: 0,
    complexity: 'UNKNOWN', // EASY, MEDIUM, HIGH, VERY_HIGH
    estimatedTime: '0h',
  };

  // Scanner tous les fichiers du domaine
  scanDomainDirectory(domainPath, (filePath) => {
    analysis.files.total++;

    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Catégoriser le fichier
    if (fileName.includes('.entity.')) {
      analysis.files.entities++;
      const entityName = fileName.replace('.entity.ts', '');
      analysis.typeorm.entities.push(entityName);
    } else if (fileName.includes('.service.')) {
      analysis.files.services++;
    } else if (fileName.includes('.controller.')) {
      analysis.files.controllers++;
    } else if (fileName.includes('.module.')) {
      analysis.files.modules++;
    } else if (fileName.includes('.test.') || fileName.includes('.spec.')) {
      analysis.files.tests++;
      if (fileName.includes('.e2e.')) {
        analysis.tests.e2e++;
      } else {
        analysis.tests.unit++;
      }
    }

    // Analyser usages TypeORM
    for (const pattern of patterns.typeormDecorators) {
      if (pattern.test(content)) {
        analysis.typeorm.decoratorCount++;
        if (!analysis.typeorm.files.includes(filePath)) {
          analysis.typeorm.files.push(filePath);
        }
      }
    }

    const repoMatches = content.match(patterns.injectRepository);
    if (repoMatches) {
      analysis.typeorm.repositoryInjections += repoMatches.length;
      if (!analysis.typeorm.files.includes(filePath)) {
        analysis.typeorm.files.push(filePath);
      }
    }

    const moduleMatches = content.match(patterns.typeormModule);
    if (moduleMatches) {
      analysis.typeorm.moduleRegistrations += moduleMatches.length;
      if (!analysis.typeorm.files.includes(filePath)) {
        analysis.typeorm.files.push(filePath);
      }
    }

    // Analyser usages Prisma
    const prismaMatches = content.match(patterns.prismaService);
    if (prismaMatches) {
      analysis.prisma.serviceUsages += prismaMatches.length;
      if (!analysis.prisma.files.includes(filePath)) {
        analysis.prisma.files.push(filePath);
      }
    }

    // Extraire models Prisma importés
    const prismaImportPattern = /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/g;
    let match;
    while ((match = prismaImportPattern.exec(content)) !== null) {
      const types = match[1]
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t && /^[A-Z]/.test(t));
      analysis.prisma.models.push(...types);
    }
  });

  // Dédupliquer models Prisma
  analysis.prisma.models = [...new Set(analysis.prisma.models)];

  // Déterminer statut
  if (analysis.typeorm.files.length === 0 && analysis.prisma.files.length > 0) {
    analysis.status = 'COMPLETED ✅';
  } else if (analysis.typeorm.files.length > 0 && analysis.prisma.files.length === 0) {
    analysis.status = 'TYPEORM ONLY ⚠️';
  } else if (analysis.typeorm.files.length > 0 && analysis.prisma.files.length > 0) {
    analysis.status = 'HYBRID ⚠️';
  } else {
    analysis.status = 'NO ORM 🤷';
  }

  // Tests
  analysis.tests.hasTests = analysis.tests.unit > 0 || analysis.tests.e2e > 0;

  // Calculer score de complexité
  analysis.complexityScore = calculateComplexityScore(analysis);

  // Classifier
  if (analysis.complexityScore === 0) {
    analysis.complexity = 'COMPLETED';
    analysis.estimatedTime = '0h';
  } else if (analysis.complexityScore <= 10) {
    analysis.complexity = 'EASY';
    analysis.estimatedTime = '1-2h';
  } else if (analysis.complexityScore <= 30) {
    analysis.complexity = 'MEDIUM';
    analysis.estimatedTime = '3-6h';
  } else if (analysis.complexityScore <= 50) {
    analysis.complexity = 'HIGH';
    analysis.estimatedTime = '1-2 jours';
  } else {
    analysis.complexity = 'VERY_HIGH';
    analysis.estimatedTime = '2-4 jours';
  }

  return analysis;
}

/**
 * Calculer score de complexité
 */
function calculateComplexityScore(analysis) {
  let score = 0;

  // Si déjà 100% Prisma, score = 0
  if (analysis.status === 'COMPLETED ✅') {
    return 0;
  }

  // Decorators TypeORM: +2 points par decorator
  score += analysis.typeorm.decoratorCount * 2;

  // Repository injections: +3 points par injection
  score += analysis.typeorm.repositoryInjections * 3;

  // Module registrations: +5 points par module
  score += analysis.typeorm.moduleRegistrations * 5;

  // Nombre d'entities TypeORM: +4 points par entity
  score += analysis.typeorm.entities.length * 4;

  // Relations complexes (approximation basée sur decorators)
  const relationDecorators = ['@ManyToOne', '@OneToMany', '@ManyToMany'];
  // Cette logique pourrait être améliorée en comptant spécifiquement

  // Bonus: Tests existants réduisent le score
  if (analysis.tests.e2e > 0) {
    score -= 10; // Tests E2E facilitent validation
  }
  if (analysis.tests.unit > 5) {
    score -= 5; // Bons tests unitaires
  }

  // Bonus: Si Prisma déjà utilisé, migration plus facile
  if (analysis.prisma.serviceUsages > 0) {
    score -= 5;
  }

  return Math.max(0, score);
}

/**
 * Générer roadmap priorisée
 */
function generateRoadmap() {
  const domainsList = Object.values(results.domains);

  // Trier par complexité croissante
  const sortedDomains = domainsList.sort((a, b) => {
    // Completed en premier (pour info)
    if (a.complexity === 'COMPLETED' && b.complexity !== 'COMPLETED') return -1;
    if (a.complexity !== 'COMPLETED' && b.complexity === 'COMPLETED') return 1;

    // Ensuite par score
    return a.complexityScore - b.complexityScore;
  });

  // Grouper par complexité
  const roadmap = {
    completed: sortedDomains.filter((d) => d.complexity === 'COMPLETED'),
    easy: sortedDomains.filter((d) => d.complexity === 'EASY'),
    medium: sortedDomains.filter((d) => d.complexity === 'MEDIUM'),
    high: sortedDomains.filter((d) => d.complexity === 'HIGH'),
    veryHigh: sortedDomains.filter((d) => d.complexity === 'VERY_HIGH'),
  };

  results.roadmap = roadmap;
}

/**
 * Générer rapport
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CARTOGRAPHIE DES DOMAINES - MIGRATION ORM');
  console.log('='.repeat(80));

  console.log('\n📈 STATISTIQUES GLOBALES:');
  console.log(`  ✓ Domaines analysés: ${results.summary.totalDomains}`);
  console.log(`  ✅ Complétés (100% Prisma): ${results.summary.completedDomains}`);
  console.log(`  🟢 EASY: ${results.summary.easyDomains}`);
  console.log(`  🟡 MEDIUM: ${results.summary.mediumDomains}`);
  console.log(`  🟠 HIGH: ${results.summary.highDomains}`);
  console.log(`  🔴 VERY HIGH: ${results.summary.veryHighDomains}`);

  // Completed
  if (results.roadmap.completed.length > 0) {
    console.log('\n✅ DOMAINES COMPLÉTÉS (100% Prisma):');
    for (const domain of results.roadmap.completed) {
      console.log(
        `  • ${domain.name} - ${domain.prisma.serviceUsages} usages Prisma, ${domain.tests.e2e} tests E2E`
      );
    }
  }

  // Easy
  if (results.roadmap.easy.length > 0) {
    console.log('\n🟢 ROUND 1 - EASY (1-2h chacun):');
    for (const domain of results.roadmap.easy) {
      console.log(
        `  ${results.roadmap.easy.indexOf(domain) + 1}. ${domain.name} (score: ${domain.complexityScore})`
      );
      console.log(`     TypeORM: ${domain.typeorm.entities.length} entities, ${domain.typeorm.repositoryInjections} repos`);
      console.log(`     Prisma: ${domain.prisma.models.length} models, ${domain.prisma.serviceUsages} usages`);
      console.log(`     Tests: ${domain.tests.unit} unit, ${domain.tests.e2e} E2E`);
    }
  }

  // Medium
  if (results.roadmap.medium.length > 0) {
    console.log('\n🟡 ROUND 2 - MEDIUM (3-6h chacun):');
    for (const domain of results.roadmap.medium) {
      console.log(
        `  ${results.roadmap.medium.indexOf(domain) + 1}. ${domain.name} (score: ${domain.complexityScore})`
      );
      console.log(`     TypeORM: ${domain.typeorm.entities.length} entities, ${domain.typeorm.repositoryInjections} repos`);
      console.log(`     Prisma: ${domain.prisma.models.length} models, ${domain.prisma.serviceUsages} usages`);
      console.log(`     Tests: ${domain.tests.unit} unit, ${domain.tests.e2e} E2E`);
    }
  }

  // High
  if (results.roadmap.high.length > 0) {
    console.log('\n🟠 ROUND 3 - HIGH (1-2 jours chacun):');
    for (const domain of results.roadmap.high) {
      console.log(
        `  ${results.roadmap.high.indexOf(domain) + 1}. ${domain.name} (score: ${domain.complexityScore})`
      );
      console.log(`     TypeORM: ${domain.typeorm.entities.length} entities, ${domain.typeorm.repositoryInjections} repos`);
      console.log(`     Prisma: ${domain.prisma.models.length} models, ${domain.prisma.serviceUsages} usages`);
      console.log(`     Tests: ${domain.tests.unit} unit, ${domain.tests.e2e} E2E`);
    }
  }

  // Very High
  if (results.roadmap.veryHigh.length > 0) {
    console.log('\n🔴 ROUND 4 - VERY HIGH (2-4 jours chacun):');
    for (const domain of results.roadmap.veryHigh) {
      console.log(
        `  ${results.roadmap.veryHigh.indexOf(domain) + 1}. ${domain.name} (score: ${domain.complexityScore})`
      );
      console.log(`     TypeORM: ${domain.typeorm.entities.length} entities, ${domain.typeorm.repositoryInjections} repos`);
      console.log(`     Prisma: ${domain.prisma.models.length} models, ${domain.prisma.serviceUsages} usages`);
      console.log(`     Tests: ${domain.tests.unit} unit, ${domain.tests.e2e} E2E`);
    }
  }

  // Timeline estimée
  console.log('\n⏱️  TIMELINE ESTIMÉE:');
  const easyTime = results.roadmap.easy.length * 1.5; // 1-2h moyenne = 1.5h
  const mediumTime = results.roadmap.medium.length * 4.5; // 3-6h moyenne = 4.5h
  const highTime = results.roadmap.high.length * 12; // 1-2 jours = 12h
  const veryHighTime = results.roadmap.veryHigh.length * 24; // 2-4 jours = 24h
  const totalHours = easyTime + mediumTime + highTime + veryHighTime;
  const totalDays = (totalHours / 8).toFixed(1);

  console.log(`  Round 1 (EASY): ${easyTime}h`);
  console.log(`  Round 2 (MEDIUM): ${mediumTime}h`);
  console.log(`  Round 3 (HIGH): ${highTime}h`);
  console.log(`  Round 4 (VERY HIGH): ${veryHighTime}h`);
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  TOTAL: ${totalHours}h (~${totalDays} jours de travail)`);

  console.log('\n' + '='.repeat(80));
  console.log('📄 Rapport détaillé sauvegardé: apps/api/domain-migration-roadmap.json');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main
 */
function main() {
  console.log('🚀 Démarrage de la cartographie des domaines...\n');

  // 1. Identifier domaines
  const domainNames = identifyDomains();
  console.log(`📂 Domaines identifiés: ${domainNames.length}\n`);

  // 2. Analyser chaque domaine
  for (const domainName of domainNames) {
    console.log(`  Analyse: ${domainName}...`);
    const analysis = analyzeDomain(domainName);
    results.domains[domainName] = analysis;
    results.summary.totalDomains++;

    // Compter par complexité
    switch (analysis.complexity) {
      case 'COMPLETED':
        results.summary.completedDomains++;
        break;
      case 'EASY':
        results.summary.easyDomains++;
        break;
      case 'MEDIUM':
        results.summary.mediumDomains++;
        break;
      case 'HIGH':
        results.summary.highDomains++;
        break;
      case 'VERY_HIGH':
        results.summary.veryHighDomains++;
        break;
    }
  }

  // 3. Générer roadmap
  console.log('\n🗺️  Génération de la roadmap...\n');
  generateRoadmap();

  // 4. Générer rapport
  generateReport();

  // 5. Sauvegarder JSON
  const outputPath = path.join(__dirname, '../domain-migration-roadmap.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
}

// Exécuter
main();
