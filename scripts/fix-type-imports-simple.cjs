const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      results.push(...findFiles(filePath, pattern));
    } else if (stat.isFile() && pattern.test(file)) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Find all TypeScript files
const files = findFiles('apps/api/src', /\.ts$/);

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix type-only imports for local services
  // Match patterns like: import type { SomeService } from './some.service'
  // or: import type { SomeService } from '../services/some.service'
  const regex = /import type (.*Service.*) from (['"]\.(?:\.)?\/.*['"])/g;
  
  const newContent = content.replace(regex, (match, imports, path) => {
    // Only fix if it's a Service import from a local file
    if (imports.includes('Service')) {
      modified = true;
      return `import ${imports} from ${path}`;
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(file, newContent);
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files with type-only service imports`);