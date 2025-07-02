// scripts/validate-build.mjs - Validation du build
import { existsSync, statSync } from 'fs'
import { join } from 'path'

const distPath = './dist'
const requiredFiles = [
  'index.js',
  'index.mjs', 
  'index.d.ts'
]

console.log('🔍 Validation du build...')

// Vérifier que le dossier dist existe
if (!existsSync(distPath)) {
  console.error('❌ Dossier dist manquant')
  process.exit(1)
}

// Vérifier les fichiers requis
for (const file of requiredFiles) {
  const filePath = join(distPath, file)
  if (!existsSync(filePath)) {
    console.error(`❌ Fichier manquant: ${file}`)
    process.exit(1)
  }
  
  const stats = statSync(filePath)
  if (stats.size === 0) {
    console.error(`❌ Fichier vide: ${file}`)
    process.exit(1)
  }
}

console.log('✅ Build validé avec succès')
console.log(`📦 Fichiers générés: ${requiredFiles.join(', ')}`)
