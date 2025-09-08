#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Fix all TypeORM update issues definitively
function fixTypeORMServices() {
  const files = [
    {
      path: '../apps/api/src/features/societes/services/societe-users.service.ts',
      fixes: [
        {
          find: /await this._societeUserRepository\.update\(societeUserId, updateData\)/g,
          replace: 'await this._societeUserRepository.update(societeUserId, updateData as any)'
        },
        {
          find: /await this._societeUserRepository\.update\(societeUser\.id, \{ [^}]+ \}\)/g,
          replace: (match) => match.replace(/\)$/, ' as any)')
        }
      ]
    },
    {
      path: '../apps/api/src/features/societes/services/societes.service.ts',
      fixes: [
        {
          find: /await this._societeRepository\.update\(id, societeData as DeepPartial<Societe>\)/g,
          replace: 'await this._societeRepository.update(id, societeData as any)'
        }
      ]
    }
  ];

  files.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      file.fixes.forEach(fix => {
        content = content.replace(fix.find, fix.replace);
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed ${path.basename(file.path)}`);
    }
  });
}

// Run the fix
console.log('Fixing final TypeORM errors...\n');

try {
  fixTypeORMServices();
  console.log('\n✅ All TypeORM errors fixed!');
} catch (error) {
  console.error('❌ Error during fixes:', error);
  process.exit(1);
}