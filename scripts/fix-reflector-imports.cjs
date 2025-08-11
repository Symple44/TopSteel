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
  
  // Fix type-only imports for Reflector from @nestjs/core
  const regex = /import type (.*Reflector.*) from (['"]@nestjs\/core['"])/g;
  
  const newContent = content.replace(regex, (match, imports, path) => {
    modified = true;
    return `import ${imports} from ${path}`;
  });
  
  if (modified) {
    fs.writeFileSync(file, newContent);
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files with type-only Reflector imports`);