#!/usr/bin/env node
// scripts/validate-env.js
// Script de validation des variables d'environnement

const { join } = require('path');
const { config } = require('dotenv');
const fs = require('fs');

// Charger la configuration
config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });

console.log('🔍 VALIDATION DE LA CONFIGURATION ENVIRONNEMENT\n');

// Variables requises
const requiredVars = [
  'DB_HOST',
  'DB_PORT', 
  'DB_USERNAME',
  'DB_NAME',
  'JWT_SECRET',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_URL'
];

// Variables optionnelles mais recommandées
const recommendedVars = [
  'DB_PASSWORD',
  'NEXTAUTH_SECRET',
  'REDIS_HOST'
];

let hasErrors = false;
let hasWarnings = false;

console.log('✅ VARIABLES REQUISES');
console.log('-'.repeat(40));

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(❌ : MANQUANT);
    hasErrors = true;
  } else {
    console.log(✅ : );
  }
});

console.log('\n⚠️  VARIABLES RECOMMANDEES');
console.log('-'.repeat(40));

recommendedVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(⚠️  : Non défini);
    hasWarnings = true;
  } else {
    console.log(✅ : Configuré);
  }
});

console.log('\n📋 RESUME');
console.log('-'.repeat(40));

if (hasErrors) {
  console.log('❌ Configuration incomplète - Variables manquantes détectées');
  console.log('💡 Editez le fichier .env.local pour ajouter les variables manquantes');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration basique - Certaines variables recommandées manquent');
  console.log('✅ Le projet peut démarrer mais certaines fonctionnalités peuvent être limitées');
} else {
  console.log('✅ Configuration complète - Toutes les variables sont définies');
}

console.log('\n🚀 Vous pouvez maintenant lancer: pnpm dev');
