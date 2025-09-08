#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Fix partner.controller.ts - @CurrentUser decorator syntax
function fixPartnerController() {
  const filePath = path.join(__dirname, '../apps/api/src/domains/partners/controllers/partner.controller.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix decorator syntax - should be on separate parameters
  content = content.replace(
    /@CurrentUser\(\) user: any/g,
    '@CurrentUser() user'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Fixed partner.controller.ts');
}

// Fix shared services - update syntax
function fixSharedServices() {
  const files = [
    '../apps/api/src/features/shared/services/shared-data-registry.service.ts',
    '../apps/api/src/features/shared/services/shared-material.service.ts',
    '../apps/api/src/features/shared/services/shared-process.service.ts',
    '../apps/api/src/features/shared/services/shared-quality-standard.service.ts',
    '../apps/api/src/features/shared/services/shared-supplier.service.ts',
    '../apps/api/src/features/societes/services/sites.service.ts',
    '../apps/api/src/features/societes/services/societe-users.service.ts',
    '../apps/api/src/features/societes/services/societes.service.ts'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove the 'as any' that was added incorrectly
      content = content.replace(
        /\.update\(([^,]+),\s*([^)]+)\s+as\s+any\)/g,
        '.update($1, $2)'
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed ${path.basename(file)}`);
    }
  });
}

// Run all fixes
console.log('Fixing syntax errors...\n');

try {
  fixPartnerController();
  fixSharedServices();
  
  console.log('\n✅ Syntax errors fixed!');
} catch (error) {
  console.error('❌ Error during fixes:', error);
  process.exit(1);
}