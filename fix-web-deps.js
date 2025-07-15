import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Réparation des dépendances Web');

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

async function fixWebDeps() {
  try {
    const webPath = path.join(__dirname, 'apps', 'web');
    
    console.log('\n📦 Installation des dépendances manquantes...');
    
    // Essayer d'installer avec npm
    try {
      await runCommand('npm', ['install', '@tanstack/query-core@^5.81.5'], webPath);
      console.log('✅ @tanstack/query-core installé avec npm');
    } catch (error) {
      console.log('❌ Échec avec npm, essai avec yarn...');
      try {
        await runCommand('yarn', ['add', '@tanstack/query-core@^5.81.5'], webPath);
        console.log('✅ @tanstack/query-core installé avec yarn');
      } catch (yarnError) {
        console.log('❌ Échec avec yarn aussi');
        throw yarnError;
      }
    }
    
    console.log('\n🔧 Test du build avec React Query restauré...');
    await runCommand('npm', ['run', 'build'], webPath);
    
    console.log('\n🎉 Build web réussi avec React Query!');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Solutions alternatives:');
    console.log('1. Utiliser pnpm install au niveau root');
    console.log('2. Copier node_modules/@tanstack/query-core depuis un autre projet');
    console.log('3. Utiliser les providers simplifiés temporairement');
  }
}

fixWebDeps();