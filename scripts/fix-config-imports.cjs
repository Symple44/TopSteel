const fs = require('node:fs')
const path = require('node:path')

function findFiles(dir, pattern) {
  const results = []
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      results.push(...findFiles(filePath, pattern))
    } else if (stat.isFile() && pattern.test(file)) {
      results.push(filePath)
    }
  }

  return results
}

// Find all TypeScript files
const files = findFiles('apps/api/src', /\.ts$/)

let _fixedCount = 0

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8')
  let modified = false

  // Fix type-only imports for ConfigService, JwtService, etc. from @nestjs packages
  const regex = /import type (.*(?:ConfigService|JwtService).*) from (['"]@nestjs\/.*['"])/g

  const newContent = content.replace(regex, (_match, imports, path) => {
    modified = true
    return `import ${imports} from ${path}`
  })

  if (modified) {
    fs.writeFileSync(file, newContent)
    _fixedCount++
  }
})
