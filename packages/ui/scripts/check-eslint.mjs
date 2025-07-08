// packages/ui/scripts/check-eslint.mjs
import { ESLint } from 'eslint'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function checkESLint() {
  try {
    const eslint = new ESLint({
      cwd: path.resolve(__dirname, '..'),
      fix: process.argv.includes('--fix')
    })
    
    const results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
    
    if (process.argv.includes('--fix')) {
      await ESLint.outputFixes(results)
    }
    
    const formatter = await eslint.loadFormatter('stylish')
    const resultText = formatter.format(results)
    
    if (resultText) {
      console.log(resultText)
    }
    
    const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0)
    
    if (errorCount > 0) {
      console.error(`❌ ESLint found ${errorCount} errors`)
      process.exit(1)
    } else {
      console.log('✅ ESLint check passed')
    }
  } catch (error) {
    console.error('❌ ESLint check failed:', error.message)
    process.exit(1)
  }
}

checkESLint()
