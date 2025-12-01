#!/usr/bin/env tsx
/**
 * Script de génération CSS
 * Usage: pnpm generate:css
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateThemeCSS, validateTokens } from '../src/themes/generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const OUTPUT_DIR = join(__dirname, '../src/styles')
const OUTPUT_FILE = join(OUTPUT_DIR, 'generated-theme.css')

console.log('🎨 TopSteel CSS Generator')
console.log('========================')

// Validation
console.log('\n📋 Validating tokens...')
const { valid, errors } = validateTokens()

if (!valid) {
  console.error('❌ Validation failed:')
  errors.forEach(e => console.error(`  - ${e}`))
  process.exit(1)
}
console.log('✅ Tokens validated successfully')

// Génération
console.log('\n🔧 Generating CSS...')
const css = generateThemeCSS()

// Création du dossier si nécessaire
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Écriture du fichier
writeFileSync(OUTPUT_FILE, css, 'utf-8')
console.log(`✅ CSS generated: ${OUTPUT_FILE}`)

// Stats
const lines = css.split('\n').length
console.log(`\n📊 Stats:`)
console.log(`  - Lines: ${lines}`)
console.log(`  - Size: ${(css.length / 1024).toFixed(2)} KB`)

console.log('\n✨ Done!')
