/**
 * Script to delete duplicate TypeORM entities
 * Reads from TYPEORM_CLEANUP_REPORT.json and deletes files
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../docs/TYPEORM_CLEANUP_REPORT.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('\n🗑️  Deleting Duplicate TypeORM Entities...\n');
console.log(`   Total to delete: ${report.duplicates.length} files\n`);

let deleted = 0;
let errors = 0;

report.duplicates.forEach((dup, index) => {
  try {
    if (fs.existsSync(dup.file)) {
      fs.unlinkSync(dup.file);
      console.log(`   ✅ [${index + 1}/${report.duplicates.length}] ${dup.name}`);
      deleted++;
    } else {
      console.log(`   ⚠️  [${index + 1}/${report.duplicates.length}] ${dup.name} (not found)`);
    }
  } catch (error) {
    console.error(`   ❌ [${index + 1}/${report.duplicates.length}] ${dup.name}: ${error.message}`);
    errors++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Deleted: ${deleted} files`);
console.log(`   ❌ Errors: ${errors} files`);
console.log(`   📁 Remaining: ${report.uncertain.length + report.missing.length} entity files\n`);

// Clean up empty directories
console.log('🧹 Cleaning up empty directories...\n');

function removeEmptyDirectories(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      removeEmptyDirectories(fullPath);
    }
  }

  // Check if directory is now empty
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0) {
    fs.rmdirSync(dir);
    console.log(`   🗑️  Removed empty directory: ${dir}`);
  }
}

// Clean from src/domains and src/features
const domainsDir = path.join(__dirname, '../src/domains');
const featuresDir = path.join(__dirname, '../src/features');

if (fs.existsSync(domainsDir)) {
  removeEmptyDirectories(domainsDir);
}
if (fs.existsSync(featuresDir)) {
  removeEmptyDirectories(featuresDir);
}

console.log('\n✅ Cleanup complete!\n');
