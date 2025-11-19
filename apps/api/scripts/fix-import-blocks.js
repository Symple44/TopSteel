/**
 * Script to fix import blocks where Prisma import was inserted
 * in the middle of a multiline import statement
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
      // Look for TS1003 errors (Identifier expected) which often indicate malformed imports
      const match = line.match(/^(src\/.+\.ts)\(\d+,\d+\): error TS1003/);
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

  // Pattern: import {\nimport { ... } from '@prisma/client'\n\n  (stuff from previous import)
  const badPattern = /import\s+{\s*\nimport\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]\s*\n\s*\n/;

  if (badPattern.test(content)) {
    // Extract the Prisma import types
    const match = content.match(badPattern);
    const prismaTypes = match[1];

    // Remove the malformed Prisma import from middle
    content = content.replace(/\nimport\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]\s*\n\s*\n/, '\n\n');

    // Find the end of the first import block
    const firstImportEnd = content.indexOf("} from 'typeorm'");
    if (firstImportEnd !== -1) {
      const insertPos = firstImportEnd + "} from 'typeorm'".length;
      content = content.slice(0, insertPos) + `\nimport {${prismaTypes}} from '@prisma/client'` + content.slice(insertPos);
    } else {
      // Fallback: add at top after other imports
      const lines = content.split('\n');
      let insertLine = 0;
      for (let i = 0; i < Math.min(30, lines.length); i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertLine = i + 1;
        }
      }
      lines.splice(insertLine, 0, `import {${prismaTypes}} from '@prisma/client'`);
      content = lines.join('\n');
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
console.log('\n🔧 Fixing malformed import blocks...\n');

const filesWithErrors = getFilesWithErrors();
console.log(`📁 Found ${filesWithErrors.length} files with identifier errors\n`);

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
