import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Final Build Script - Packages & Apps');

function runCommand(command, args, workingDir) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Exécution: ${command} ${args.join(' ')}`);
    console.log(`📁 Dans: ${workingDir}`);
    
    const process = spawn(command, args, {
      cwd: workingDir,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Réussi`);
        resolve(true);
      } else {
        console.log(`❌ Échec (code: ${code})`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.log(`❌ Erreur: ${error.message}`);
      reject(error);
    });
  });
}

async function buildAll() {
  try {
    // 1. Build des packages (déjà testé et fonctionne)
    console.log('\n📦 Build des packages...');
    await runCommand('node', ['simple-build.js'], __dirname);
    
    // 2. Build de l'API
    console.log('\n🔧 Build de l\'API...');
    const apiPath = path.join(__dirname, 'apps', 'api');
    await runCommand('npm', ['run', 'build'], apiPath);
    
    // 3. Build de l'app Web
    console.log('\n🌐 Build de l\'app Web...');
    const webPath = path.join(__dirname, 'apps', 'web');
    await runCommand('npm', ['run', 'build'], webPath);
    
    console.log('\n🎉 Build complet terminé avec succès!');
    console.log('\n📋 Résumé:');
    console.log('✅ Packages: types, utils, domains, config, ui, api-client');
    console.log('✅ API: @erp/api');
    console.log('✅ Web: @erp/web');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du build complet:', error.message);
    process.exit(1);
  }
}

buildAll();