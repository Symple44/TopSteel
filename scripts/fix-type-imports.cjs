const fs = require('node:fs')
const _path = require('node:path')
const glob = require('glob')

// Find all TypeScript files
const files = glob.sync('apps/api/src/**/*.ts')

let _fixedCount = 0

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8')
  let modified = false

  // Fix type-only imports for local services
  // Match patterns like: import type { SomeService } from './some.service'
  // or: import type { SomeService } from '../services/some.service'
  const regex = /import type (.*Service.*) from (['"]\.(?:\.)?\/.*['"])/g

  const newContent = content.replace(regex, (match, imports, path) => {
    // Only fix if it's a Service import from a local file
    if (imports.includes('Service')) {
      modified = true
      return `import ${imports} from ${path}`
    }
    return match
  })

  if (modified) {
    fs.writeFileSync(file, newContent)
    _fixedCount++
  }
})
