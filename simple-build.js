import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Simple Build Script');

// Fonction pour exécuter une commande avec spawn
function runCommand(command, args, workingDir = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Exécution: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      cwd: workingDir,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} ${args.join(' ')} - Réussi`);
        resolve(true);
      } else {
        console.log(`❌ ${command} ${args.join(' ')} - Échec (code: ${code})`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.log(`❌ Erreur: ${error.message}`);
      reject(error);
    });
  });
}

// Build des packages un par un
const buildOrder = [
  'packages/types',
  'packages/utils', 
  'packages/domains',
  'packages/config',
  'packages/ui',
  'packages/api-client'
];

async function buildPackages() {
  console.log('\n📦 Build des packages...');
  
  for (const packagePath of buildOrder) {
    const fullPath = path.join(__dirname, packagePath);
    const packageJsonPath = path.join(fullPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`\n📁 Building ${packageJson.name}...`);
      
      if (packageJson.scripts && packageJson.scripts.build) {
        try {
          await runCommand('npm', ['run', 'build'], fullPath);
        } catch (error) {
          console.log(`❌ Erreur lors du build de ${packageJson.name}`);
          process.exit(1);
        }
      } else {
        console.log(`⏭️  ${packageJson.name} - Pas de script build`);
      }
    }
  }
}

buildPackages().then(() => {
  console.log('\n🎉 Build des packages terminé avec succès!');
}).catch(error => {
  console.error('❌ Erreur lors du build:', error);
  process.exit(1);
});