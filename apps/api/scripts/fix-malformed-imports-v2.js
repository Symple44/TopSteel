/**
 * Script to find and fix malformed Prisma imports
 * that were inserted in the middle of code
 */

const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    return { fixed: false, reason: 'File not found' };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let modified = false;

  // Pattern: import statement that appears anywhere in the file
  const prismaImportPattern = /^import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]\s*$/gm;

  const matches = [];
  let match;

  while ((match = prismaImportPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    matches.push({
      fullMatch: match[0],
      types: match[1],
      index: match.index,
      lineNumber: lineNumber,
    });
  }

  if (matches.length === 0) {
    return { fixed: false, reason: 'No Prisma imports found' };
  }

  if (matches.length === 1) {
    // Check if it's in a reasonable position (within first 50 lines)
    if (matches[0].lineNumber <= 50) {
      return { fixed: false, reason: 'Single import in good position' };
    }
    // Import is too far down, probably malformed
    // Move it to top
    const lines = content.split('\n');
    const importLine = matches[0].fullMatch;

    // Remove from current position
    lines[matches[0].lineNumber - 1] = '';

    // Find position after other imports (look for last import)
    let insertPosition = 0;
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertPosition = i + 1;
      }
    }

    // Insert at new position
    lines.splice(insertPosition, 0, importLine);

    content = lines.join('\n');
    modified = true;
  } else if (matches.length > 1) {
    // Multiple imports - keep the first one, merge types, remove others
    const firstImport = matches[0];

    // Collect all types from all imports
    const allTypes = new Set();
    for (const m of matches) {
      const types = m.types.split(',').map(t => t.trim()).filter(Boolean);
      types.forEach(t => allTypes.add(t));
    }

    const mergedTypes = Array.from(allTypes).sort().join(', ');
    const newImport = `import { ${mergedTypes} } from '@prisma/client'`;

    // Remove all imports from content
    let lines = content.split('\n');
    for (let i = matches.length - 1; i >= 0; i--) {
      const lineIndex = matches[i].lineNumber - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        lines[lineIndex] = '';
      }
    }

    // Find position to insert merged import (after other imports, within first 50 lines)
    let insertPosition = 0;
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      if (lines[i].trim().startsWith('import ') && !lines[i].includes('@prisma/client')) {
        insertPosition = i + 1;
      }
    }

    // Insert merged import
    lines.splice(insertPosition, 0, newImport);

    content = lines.join('\n');
    modified = true;
  }

  if (modified) {
    // Clean up multiple consecutive empty lines
    content = content.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(fullPath, content, 'utf8');
    return {
      fixed: true,
      reason: `Fixed ${matches.length} imports, merged types`
    };
  }

  return { fixed: false, reason: 'No changes needed' };
}

// Get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Main execution
console.log('\n🔧 Fixing malformed Prisma imports (V2)...\n');

const srcDir = path.join(__dirname, '../src');
const allFiles = getAllTsFiles(srcDir);

let fixed = 0;
let skipped = 0;
let errors = 0;

for (const fullPath of allFiles) {
  const relativePath = path.relative(path.join(__dirname, '..'), fullPath);

  try {
    const result = fixFile(relativePath);
    if (result.fixed) {
      console.log(`   ✅ ${relativePath}`);
      fixed++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.log(`   ❌ ${relativePath}: ${error.message}`);
    errors++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed} files`);
console.log(`   ⏭️  Skipped: ${skipped} files`);
console.log(`   ❌ Errors: ${errors} files`);
console.log(`   📁 Total: ${allFiles.length} files\n`);
