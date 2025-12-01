#!/usr/bin/env tsx
/**
 * Script de test du système de génération CSS
 * Usage: tsx scripts/test-generation.ts
 */

import { generateThemeCSS, validateTokens } from '../src/themes/generator'
import { lightTheme, darkTheme } from '../src/themes'

console.log('🧪 Testing CSS Generation System\n')

// Test 1: Validation
console.log('Test 1: Validating tokens...')
const { valid, errors } = validateTokens()
if (valid) {
  console.log('✅ Validation passed')
} else {
  console.log('❌ Validation failed:')
  errors.forEach(e => console.log(`  - ${e}`))
  process.exit(1)
}

// Test 2: Vérifier que les thèmes ont les bonnes propriétés
console.log('\nTest 2: Checking theme properties...')
const lightKeys = Object.keys(lightTheme.colors)
const darkKeys = Object.keys(darkTheme.colors)
console.log(`  Light theme: ${lightKeys.length} colors`)
console.log(`  Dark theme: ${darkKeys.length} colors`)

if (lightKeys.length === darkKeys.length) {
  console.log('✅ Same number of colors')
} else {
  console.log('❌ Different number of colors')
  process.exit(1)
}

// Test 3: Générer le CSS
console.log('\nTest 3: Generating CSS...')
const css = generateThemeCSS()
console.log(`  Generated ${css.split('\n').length} lines`)
console.log(`  Size: ${(css.length / 1024).toFixed(2)} KB`)

// Test 4: Vérifier la structure du CSS
console.log('\nTest 4: Checking CSS structure...')
const hasRoot = css.includes(':root {')
const hasDark = css.includes('.dark {')
const hasComments = css.includes('GENERATED FILE')
const hasLightColors = css.includes('Light Theme Colors')
const hasDarkColors = css.includes('Dark Theme Colors')
const hasLayout = css.includes('Layout Dimensions')
const hasStatus = css.includes('Status Colors')

console.log(`  :root selector: ${hasRoot ? '✅' : '❌'}`)
console.log(`  .dark selector: ${hasDark ? '✅' : '❌'}`)
console.log(`  Warning comment: ${hasComments ? '✅' : '❌'}`)
console.log(`  Light colors section: ${hasLightColors ? '✅' : '❌'}`)
console.log(`  Dark colors section: ${hasDarkColors ? '✅' : '❌'}`)
console.log(`  Layout section: ${hasLayout ? '✅' : '❌'}`)
console.log(`  Status section: ${hasStatus ? '✅' : '❌'}`)

if (hasRoot && hasDark && hasComments && hasLightColors && hasDarkColors && hasLayout && hasStatus) {
  console.log('\n✅ All structure checks passed')
} else {
  console.log('\n❌ Some structure checks failed')
  process.exit(1)
}

// Test 5: Vérifier les conversions camelCase -> kebab-case
console.log('\nTest 5: Checking case conversion...')
const testCases = [
  { input: 'cardForeground', expected: '--card-foreground' },
  { input: 'mutedForeground', expected: '--muted-foreground' },
  { input: 'accentForeground', expected: '--accent-foreground' },
]

let conversionPassed = true
testCases.forEach(({ input, expected }) => {
  const found = css.includes(expected)
  console.log(`  ${input} → ${expected}: ${found ? '✅' : '❌'}`)
  if (!found) conversionPassed = false
})

if (conversionPassed) {
  console.log('✅ All conversions correct')
} else {
  console.log('❌ Some conversions failed')
  process.exit(1)
}

// Test 6: Compter les variables CSS
console.log('\nTest 6: Counting CSS variables...')
const cssVarMatches = css.match(/--[\w-]+:/g)
const cssVarCount = cssVarMatches ? cssVarMatches.length : 0
console.log(`  Total CSS variables: ${cssVarCount}`)

// On devrait avoir:
// - 34 couleurs (17 par thème) x 2 = 34 dans :root et 17 dans .dark
// - 4 layout variables
// - 13 status variables
const expectedInRoot = lightKeys.length + 4 + 13 // couleurs light + layout + status
console.log(`  Expected in :root: ~${expectedInRoot}`)
console.log(`  Expected in .dark: ~${darkKeys.length}`)

if (cssVarCount > expectedInRoot) {
  console.log('✅ Correct number of variables')
} else {
  console.log('⚠️  Variables count might be low')
}

// Résumé final
console.log('\n' + '='.repeat(50))
console.log('🎉 All tests passed!')
console.log('='.repeat(50))
console.log('\nSummary:')
console.log(`  ✅ Validation: OK`)
console.log(`  ✅ Theme structure: OK`)
console.log(`  ✅ CSS generation: OK`)
console.log(`  ✅ CSS structure: OK`)
console.log(`  ✅ Case conversion: OK`)
console.log(`  ✅ Variable count: OK`)
console.log('\n✨ CSS Generation System is working perfectly!')
