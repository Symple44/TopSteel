import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function findTypeImports(dir: string, results: string[] = []): string[] {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const fullPath = join(dir, file)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      findTypeImports(fullPath, results)
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      const content = readFileSync(fullPath, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        // Chercher les imports type de services/providers qui causent des problèmes DI
        if (line.includes('import type') && (line.includes('Service') || line.includes('Repository') || line.includes('Provider'))) {
          results.push(`${fullPath}:${index + 1}: ${line.trim()}`)
        }
      })
    }
  }
  
  return results
}

const srcDir = join(__dirname, '..')
const typeImports = findTypeImports(srcDir)

console.log(`Found ${typeImports.length} problematic type imports:\n`)
typeImports.forEach(imp => console.log(imp))