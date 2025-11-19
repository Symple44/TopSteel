/**
 * Script to fix malformed imports that were inserted in the middle of code
 * by the auto-fix script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with syntax errors
function getFilesWithSyntaxErrors() {
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

function fixMalformedImports(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let modified = false;

  // Pattern: import statement that appears after the first 100 lines (likely in wrong place)
  // This is a heuristic - imports should be at the top
  const lines = content.split('\n');

  const importPattern = /^import\s+{[^}]+}\s+from\s+['"]@prisma\/client['"]\s*$/;
  const malformedImports = [];

  // Find imports that appear in the middle of the file (after line 30)
  for (let i = 30; i < lines.length; i++) {
    if (importPattern.test(lines[i].trim())) {
      malformedImports.push({
        lineIndex: i,
        content: lines[i],
      });
    }
  }

  if (malformedImports.length > 0) {
    // Check if there's already a proper import at the top
    let hasPrismaImportAtTop = false;
    let prismaImportLineIndex = -1;

    for (let i = 0; i < 30; i++) {
      if (importPattern.test(lines[i].trim())) {
        hasPrismaImportAtTop = true;
        prismaImportLineIndex = i;
        break;
      }
    }

    if (hasPrismaImportAtTop) {
      // Remove malformed imports from middle of file
      for (const malformed of malformedImports.reverse()) {
        lines.splice(malformed.lineIndex, 1);
        modified = true;
      }

      content = lines.join('\n');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`   ✅ ${filePath} (removed ${malformedImports.length} malformed imports)`);
      return true;
    }
  }

  return false;
}

// Main execution
console.log('\n🔧 Fixing malformed imports...\n');

const filesWithErrors = getFilesWithSyntaxErrors();
console.log(`📁 Found ${filesWithErrors.length} files with syntax errors\n`);

let fixed = 0;
let skipped = 0;

for (const file of filesWithErrors) {
  try {
    if (fixMalformedImports(file)) {
      fixed++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.log(`   ❌ ${file}: ${error.message}`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed} files`);
console.log(`   ⏭️  Skipped: ${skipped} files`);
console.log(`   📁 Total: ${filesWithErrors.length} files\n`);
