import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Installation et build complet');

function runCommand(command, args, workingDir = __dirname) {
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

async function installAndBuild() {
  try {
    console.log('\n📦 Installation des dépendances root...');
    await runCommand('npm', ['install']);
    
    console.log('\n📦 Build des packages...');
    await runCommand('node', ['simple-build.js']);
    
    console.log('\n🔧 Build de l\'API...');
    const apiPath = path.join(__dirname, 'apps', 'api');
    await runCommand('npm', ['run', 'build'], apiPath);
    
    console.log('\n🌐 Build de l\'app Web...');
    const webPath = path.join(__dirname, 'apps', 'web');
    await runCommand('npm', ['run', 'build'], webPath);
    
    console.log('\n🎉 BUILD COMPLET RÉUSSI !');
    console.log('✅ Packages: types, utils, domains, config, ui, api-client');
    console.log('✅ API: @erp/api');
    console.log('✅ Web: @erp/web');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du build:', error.message);
    console.log('\n🔍 Vérifiez les erreurs ci-dessus pour plus de détails');
    process.exit(1);
  }
}

installAndBuild();