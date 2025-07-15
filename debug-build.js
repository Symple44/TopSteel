import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Diagnostic des problèmes de build');

// Vérifier la structure des packages
const packagesDir = path.join(__dirname, 'packages');
const appsDir = path.join(__dirname, 'apps');

console.log('\n📁 Packages trouvés:');
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir);
  packages.forEach(pkg => {
    const packagePath = path.join(packagesDir, pkg);
    const packageJsonPath = path.join(packagePath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`  ✓ ${pkg} (${packageJson.name})`);
      
      if (packageJson.scripts && packageJson.scripts.build) {
        console.log(`    Build script: ${packageJson.scripts.build}`);
      } else {
        console.log(`    ⚠️  Pas de script build défini`);
      }
    }
  });
}

console.log('\n📱 Apps trouvées:');
if (fs.existsSync(appsDir)) {
  const apps = fs.readdirSync(appsDir);
  apps.forEach(app => {
    const appPath = path.join(appsDir, app);
    const packageJsonPath = path.join(appPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`  ✓ ${app} (${packageJson.name})`);
      
      if (packageJson.scripts && packageJson.scripts.build) {
        console.log(`    Build script: ${packageJson.scripts.build}`);
      } else {
        console.log(`    ⚠️  Pas de script build défini`);
      }
    }
  });
}

console.log('\n🔨 Test de build packages...');
try {
  console.log('Exécution de: pnpm build:packages');
  const result = execSync('pnpm build:packages', { 
    stdio: 'pipe',
    cwd: __dirname,
    encoding: 'utf8'
  });
  console.log('✓ Build packages réussi');
  console.log(result);
} catch (error) {
  console.log('❌ Erreur lors du build packages:');
  console.log(error.stdout || '');
  console.log(error.stderr || '');
}

console.log('\n🎯 Test de build global...');
try {
  console.log('Exécution de: pnpm build');
  const result = execSync('pnpm build', { 
    stdio: 'pipe',
    cwd: __dirname,
    encoding: 'utf8'
  });
  console.log('✓ Build global réussi');
  console.log(result);
} catch (error) {
  console.log('❌ Erreur lors du build global:');
  console.log(error.stdout || '');
  console.log(error.stderr || '');
}

console.log('\n📋 Diagnostic terminé');