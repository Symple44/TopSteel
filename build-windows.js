import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Build Windows Script');

// Fonction pour exécuter une commande avec gestion d'erreur
function runCommand(command, workingDir = __dirname) {
  try {
    console.log(`\n▶️  Exécution: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: workingDir,
      shell: true // Force l'utilisation du shell Windows
    });
    console.log(`✅ ${command} - Réussi`);
    return true;
  } catch (error) {
    console.log(`❌ ${command} - Échec`);
    console.error(error.message);
    return false;
  }
}

// Ordre de build des packages
const buildOrder = [
  'packages/types',
  'packages/utils', 
  'packages/domains',
  'packages/config',
  'packages/ui',
  'packages/api-client'
];

console.log('\n📦 Build des packages dans l\'ordre des dépendances...');

for (const packagePath of buildOrder) {
  const fullPath = path.join(__dirname, packagePath);
  const packageJsonPath = path.join(fullPath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`\n📁 Building ${packageJson.name}...`);
    
    if (packageJson.scripts && packageJson.scripts.build) {
      const success = runCommand('pnpm build', fullPath);
      if (!success) {
        console.log(`❌ Erreur lors du build de ${packageJson.name}`);
        process.exit(1);
      }
    } else {
      console.log(`⏭️  ${packageJson.name} - Pas de script build`);
    }
  }
}

console.log('\n🎯 Build des applications...');

// Build des apps
const apps = ['apps/api', 'apps/web'];

for (const appPath of apps) {
  const fullPath = path.join(__dirname, appPath);
  const packageJsonPath = path.join(fullPath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`\n🚀 Building ${packageJson.name}...`);
    
    if (packageJson.scripts && packageJson.scripts.build) {
      const success = runCommand('pnpm build', fullPath);
      if (!success) {
        console.log(`❌ Erreur lors du build de ${packageJson.name}`);
        process.exit(1);
      }
    } else {
      console.log(`⏭️  ${packageJson.name} - Pas de script build`);
    }
  }
}

console.log('\n🎉 Build terminé avec succès!');