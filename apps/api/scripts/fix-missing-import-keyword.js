/**
 * Script to fix cases where Prisma import broke an existing import block
 * by inserting between 'import type {' and the imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with syntax errors
function getFilesWithErrors() {
  try {
    execSync('npx tsc --noEmit', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return [];
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n');
    const files = new Set();

    for (const line of lines) {
      const match = line.match(/^(src\/.+\.ts)\(\d+,\d+\): error TS/);
      if (match) {
        files.add(match[1]);
      }
    }

    return Array.from(files);
  }
}

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let modified = false;

  // Pattern 1: import type {\nimport { ... } from '@prisma/client'\n\n  SOME_TOKEN,
  const pattern1 = /import type\s*{\s*\nimport\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]\s*\n\s*\n\s+([A-Z_][A-Z_0-9]*,?)/g;

  if (pattern1.test(content)) {
    const prismaImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/);
    if (prismaImportMatch) {
      const prismaTypes = prismaImportMatch[1];

      // Remove the Prisma import from its current position
      content = content.replace(/\nimport\s+{[^}]+}\s+from\s+['"]@prisma\/client['"]\s*\n/, '\n');

      // Fix the broken import type { block by adding back 'import type {'
      content = content.replace(/import type\s*{\s*\n\s*\n\s+([A-Z_])/, 'import type {\n  $1');

      // Insert Prisma import after the fixed import block
      const firstTypeImportEnd = content.indexOf('\nimport type {');
      if (firstTypeImportEnd !== -1) {
        // Find the end of this import block
        const blockStart = firstTypeImportEnd + 1;
        const blockEnd = content.indexOf('}', blockStart);
        if (blockEnd !== -1) {
          // Find the "} from '...'" part
          const fromMatch = content.slice(blockEnd).match(/}\s+from\s+['"][^'"]+['"]/);
          if (fromMatch) {
            const insertPos = blockEnd + fromMatch[0].length;
            content = content.slice(0, insertPos) + `\nimport { ${prismaTypes} } from '@prisma/client'` + content.slice(insertPos);
            modified = true;
          }
        }
      }
    }
  }

  // Pattern 2: Look for orphaned identifiers after a Prisma import
  // Lines that start with whitespace and capital letters (like tokens) without 'import' keyword
  const pattern2 = /}\s+from\s+['"]@prisma\/client['"]\s*\n\s*\n\s+([A-Z_][A-Z_0-9_,\s\n]+)\s*}\s+from/;

  if (pattern2.test(content) && !modified) {
    // Extract the orphaned tokens and the source
    const match = content.match(/}\s+from\s+['"]@prisma\/client['"]\s*\n\s*\n\s+([A-Z_][A-Z_0-9_,\s\n]+)\s*}\s+from\s+['"]([^'"]+)['"]/);

    if (match) {
      const tokens = match[1];
      const source = match[2];

      // Fix by adding 'import {' before the tokens
      content = content.replace(
        /}\s+from\s+['"]@prisma\/client['"]\s*\n\s*\n\s+([A-Z_][A-Z_0-9_,\s\n]+)\s*}\s+from\s+['"]([^'"]+)['"]/,
        `} from '@prisma/client'\nimport {\n  $1\n} from '$2'`
      );
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
console.log('\n🔧 Fixing missing import keywords...\n');

const filesWithErrors = getFilesWithErrors();
console.log(`📁 Found ${filesWithErrors.length} files with errors\n`);

let fixed = 0;

for (const file of filesWithErrors) {
  try {
    if (fixFile(file)) {
      fixed++;
    }
  } catch (error) {
    console.log(`   ❌ ${file}: ${error.message}`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed} files`);
console.log(`   📁 Total checked: ${filesWithErrors.length} files\n`);
