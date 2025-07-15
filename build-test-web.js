import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Test build web sans React Query');

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

async function testBuildWeb() {
  try {
    // 1. Build des packages d'abord
    console.log('\n📦 Build des packages...');
    await runCommand('node', ['simple-build.js'], __dirname);
    
    // 2. Build de l'app Web
    console.log('\n🌐 Build de l\'app Web...');
    const webPath = path.join(__dirname, 'apps', 'web');
    
    // Temporairement désactiver le prebuild
    console.log('\n🔧 Build sans prebuild...');
    await runCommand('npx', ['next', 'build'], webPath);
    
    console.log('\n🎉 Build web réussi!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du build web:', error.message);
    process.exit(1);
  }
}

testBuildWeb();