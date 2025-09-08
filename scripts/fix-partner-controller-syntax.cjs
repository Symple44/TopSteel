#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function fixPartnerController() {
  const filePath = path.join(__dirname, '../apps/api/src/domains/partners/controllers/partner.controller.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all @CurrentUser() user declarations without type
  // These should have a comma between user and type
  content = content.replace(
    /@CurrentUser\(\) user User/g,
    '@CurrentUser() user: User'
  );
  
  // Fix @Req() declarations
  content = content.replace(
    /@Req\(\) req Request/g,
    '@Req() req: Request'
  );
  
  // Fix any other decorator parameter issues
  content = content.replace(
    /@Body\(\) ([a-zA-Z]+) ([A-Z])/g,
    '@Body() $1: $2'
  );
  
  content = content.replace(
    /@Query\(\) ([a-zA-Z]+) ([A-Z])/g,
    '@Query() $1: $2'
  );
  
  content = content.replace(
    /@Param\(([^)]+)\) ([a-zA-Z]+) ([A-Z])/g,
    '@Param($1) $2: $3'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Fixed partner.controller.ts syntax');
}

// Run the fix
console.log('Fixing partner controller syntax errors...\n');

try {
  fixPartnerController();
  console.log('\n✅ Partner controller syntax fixed!');
} catch (error) {
  console.error('❌ Error during fixes:', error);
  process.exit(1);
}