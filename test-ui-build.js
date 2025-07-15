import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Test du build du package UI');

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

async function testUIBuild() {
  const uiPath = path.join(__dirname, 'packages', 'ui');
  
  try {
    console.log('\n🧹 Nettoyage du dist...');
    await runCommand('npm', ['run', 'build:clean'], uiPath);
    
    console.log('\n🔨 Build tsup...');
    await runCommand('npx', ['tsup'], uiPath);
    
    console.log('\n🎉 Build UI réussi!');
  } catch (error) {
    console.error('\n❌ Erreur lors du build UI:', error.message);
  }
}

testUIBuild();