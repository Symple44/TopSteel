const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour supprimer récursivement un dossier
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirectory(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// Nettoyer le cache Next.js
const nextDir = path.join(__dirname, '.next');
console.log('Nettoyage du cache Next.js...');

if (fs.existsSync(nextDir)) {
  deleteDirectory(nextDir);
  console.log('Cache Next.js nettoyé avec succès.');
} else {
  console.log('Pas de cache Next.js à nettoyer.');
}

// Nettoyer le cache Webpack
const cacheDir = path.join(__dirname, '.next/cache');
if (fs.existsSync(cacheDir)) {
  deleteDirectory(cacheDir);
  console.log('Cache Webpack nettoyé avec succès.');
}

// Nettoyer le cache des modules
const nodeModulesDir = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesDir)) {
  console.log('Nettoyage des node_modules locaux...');
  deleteDirectory(nodeModulesDir);
  console.log('Node_modules locaux nettoyés.');
}

// Réinstaller les dépendances
console.log('Réinstallation des dépendances...');
try {
  execSync('pnpm install', { stdio: 'inherit', cwd: __dirname });
  console.log('Dépendances réinstallées avec succès.');
} catch (error) {
  console.error('Erreur lors de la réinstallation:', error.message);
}

console.log('Nettoyage terminé. Redémarrez le serveur de développement.');