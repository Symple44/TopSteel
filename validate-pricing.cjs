#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 VALIDATION FINALE DU SYSTÈME PRICING\n');
console.log('='.repeat(60));

const results = [];
const rootDir = __dirname;
const apiDir = path.join(rootDir, 'apps', 'api');
const pricingDir = path.join(apiDir, 'src', 'features', 'pricing');

// 1. Vérification de la structure
console.log('\n📁 Vérification de la structure des fichiers...');
const requiredFiles = [
  'pricing-unified.module.ts',
  'services/pricing-engine.service.ts',
  'services/pricing-cache.service.ts',
  'services/pricing-analytics.service.ts',
  'services/pricing-ml.service.ts',
  'services/pricing-webhooks.service.ts',
  'controllers/pricing.controller.ts',
  'controllers/pricing-analytics.controller.ts',
  'controllers/pricing-webhooks.controller.ts',
  'entities/pricing-log.entity.ts',
  'entities/webhook-subscription.entity.ts',
  'entities/webhook-event.entity.ts',
  'entities/webhook-delivery.entity.ts',
  'entities/sales-history.entity.ts'
];

const missingFiles = [];
for (const file of requiredFiles) {
  const filePath = path.join(pricingDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length === 0) {
  console.log('✅ Tous les fichiers requis sont présents');
  results.push({ name: 'Structure', status: 'success' });
} else {
  console.log(`❌ ${missingFiles.length} fichiers manquants:`, missingFiles);
  results.push({ name: 'Structure', status: 'error', details: missingFiles });
}

// 2. Vérification des dépendances
console.log('\n📦 Vérification des dépendances...');
const packageJsonPath = path.join(apiDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

const requiredDeps = [
  '@nestjs-modules/ioredis',
  '@nestjs/graphql',
  '@nestjs/apollo',
  '@nestjs/axios',
  '@nestjs/event-emitter',
  '@tensorflow/tfjs-node',
  'ioredis',
  'graphql',
  'apollo-server-express'
];

const missingDeps = requiredDeps.filter(dep => !deps[dep]);

if (missingDeps.length === 0) {
  console.log('✅ Toutes les dépendances sont installées');
  results.push({ name: 'Dépendances', status: 'success' });
} else {
  console.log(`❌ ${missingDeps.length} dépendances manquantes:`, missingDeps);
  results.push({ name: 'Dépendances', status: 'error', details: missingDeps });
}

// 3. Vérification du build
console.log('\n🔧 Vérification du build...');
try {
  process.chdir(apiDir);
  execSync('pnpm build', { stdio: 'pipe' });
  console.log('✅ Build réussi');
  results.push({ name: 'Build', status: 'success' });
} catch (error) {
  console.log('❌ Erreur de build');
  results.push({ name: 'Build', status: 'error' });
}

// 4. Vérification de la configuration
console.log('\n⚙️ Vérification de la configuration...');
const envFile = path.join(rootDir, '.env');
const requiredEnvVars = [
  'REDIS_HOST',
  'REDIS_PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD'
];

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  const missingVars = requiredEnvVars.filter(v => !envContent.includes(`${v}=`));
  
  if (missingVars.length === 0) {
    console.log('✅ Variables d\'environnement configurées');
    results.push({ name: 'Configuration', status: 'success' });
  } else {
    console.log(`⚠️ ${missingVars.length} variables manquantes:`, missingVars);
    results.push({ name: 'Configuration', status: 'warning', details: missingVars });
  }
} else {
  console.log('❌ Fichier .env manquant');
  results.push({ name: 'Configuration', status: 'error' });
}

// 5. Vérification des entités
console.log('\n🗃️ Vérification des entités...');
const entitiesDir = path.join(pricingDir, 'entities');
if (fs.existsSync(entitiesDir)) {
  const entities = fs.readdirSync(entitiesDir).filter(f => f.endsWith('.entity.ts'));
  console.log(`✅ ${entities.length} entités trouvées`);
  results.push({ name: 'Entités', status: 'success', count: entities.length });
} else {
  console.log('❌ Dossier entities manquant');
  results.push({ name: 'Entités', status: 'error' });
}

// 6. Vérification des services
console.log('\n🔧 Vérification des services...');
const servicesDir = path.join(pricingDir, 'services');
if (fs.existsSync(servicesDir)) {
  const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.service.ts'));
  console.log(`✅ ${services.length} services trouvés`);
  results.push({ name: 'Services', status: 'success', count: services.length });
} else {
  console.log('❌ Dossier services manquant');
  results.push({ name: 'Services', status: 'error' });
}

// 7. Vérification des contrôleurs
console.log('\n🎮 Vérification des contrôleurs...');
const controllersDir = path.join(pricingDir, 'controllers');
if (fs.existsSync(controllersDir)) {
  const controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.controller.ts'));
  console.log(`✅ ${controllers.length} contrôleurs trouvés`);
  results.push({ name: 'Contrôleurs', status: 'success', count: controllers.length });
} else {
  console.log('❌ Dossier controllers manquant');
  results.push({ name: 'Contrôleurs', status: 'error' });
}

// 8. Vérification des tests
console.log('\n🧪 Vérification des tests...');
const testsDir = path.join(pricingDir, 'tests');
if (fs.existsSync(testsDir)) {
  const tests = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));
  console.log(`✅ ${tests.length} fichiers de test trouvés`);
  results.push({ name: 'Tests', status: 'success', count: tests.length });
} else {
  console.log('⚠️ Dossier tests manquant');
  results.push({ name: 'Tests', status: 'warning' });
}

// RAPPORT FINAL
console.log('\n\n📊 RAPPORT DE VALIDATION');
console.log('='.repeat(60));

const successCount = results.filter(r => r.status === 'success').length;
const warningCount = results.filter(r => r.status === 'warning').length;
const errorCount = results.filter(r => r.status === 'error').length;

console.log(`\n✅ Succès: ${successCount}`);
console.log(`⚠️  Avertissements: ${warningCount}`);
console.log(`❌ Erreurs: ${errorCount}`);

const score = (successCount * 100) / results.length;
console.log(`\n🎯 Score global: ${score.toFixed(1)}%`);

if (errorCount === 0) {
  console.log('\n✨ Le système de pricing est prêt pour la production !');
} else if (errorCount <= 2) {
  console.log('\n⚡ Quelques corrections mineures sont nécessaires.');
} else {
  console.log('\n🔧 Des corrections importantes sont requises.');
}

// Sauvegarder le rapport
const report = {
  date: new Date().toISOString(),
  results,
  summary: {
    success: successCount,
    warnings: warningCount,
    errors: errorCount,
    score
  }
};

fs.writeFileSync(
  path.join(rootDir, 'pricing-validation-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Rapport sauvegardé: pricing-validation-report.json\n');