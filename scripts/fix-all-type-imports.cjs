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
const files = findFiles('apps/api/src', /\\.ts$/);

// List of known services and guards that should NOT be type-only imports
const knownServicesAndGuards = [
  'HealthCheckService',
  'MemoryHealthIndicator',
  'DiskHealthIndicator',
  'CircuitBreakerHealthIndicator',
  'TenantProvisioningService',
  'LicenseManagementService',
  'ModuleRegistryService',
  'NotificationRuleEngineService',
  'PricingEngineService',
  'PricingMLService',
  'WebhookService',
  'CacheService',
  'RedisOptimizedService',
  'CircuitBreakerService',
  'MultiTenantDatabaseConfig',
  'DatabaseService',
  'AuthService',
  'JwtService',
  'ConfigService',
  'Reflector',
  'HealthService',
  'IntegrityService',
  'SystemHealthService',
  'TerminusModule',
  'TypeOrmHealthIndicator',
  'HttpHealthIndicator',
  'MicroserviceHealthIndicator',
  'GRPCHealthIndicator',
  'MongooseHealthIndicator',
];

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix type-only imports for services from @nestjs packages
  const nestjsRegex = /import\s+type\s+\{([^}]+)\}\s+from\s+(['"]@nestjs\/[^'"]+['"])/g;
  
  content = content.replace(nestjsRegex, (match, imports, modulePath) => {
    // Check if any of the imports are known services
    const importList = imports.split(',').map(i => i.trim());
    const hasService = importList.some(imp => {
      const cleanName = imp.replace(/\\s+as\\s+.*/, '').trim();
      return knownServicesAndGuards.some(service => cleanName.includes(service));
    });
    
    if (hasService) {
      modified = true;
      return `import {${imports}} from ${modulePath}`;
    }
    
    return match;
  });
  
  // Fix mixed type imports where services are incorrectly marked as type-only
  const mixedImportRegex = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+(['"][^'"]+['"])/g;
  
  content = content.replace(mixedImportRegex, (match, imports, modulePath) => {
    // Split imports into type and non-type
    const importList = imports.split(',').map(i => i.trim());
    const typeImports = [];
    const regularImports = [];
    
    importList.forEach(imp => {
      if (imp.startsWith('type ')) {
        typeImports.push(imp.substring(5).trim());
      } else {
        const cleanName = imp.replace(/\\s+as\\s+.*/, '').trim();
        // Check if this should be a regular import
        if (knownServicesAndGuards.some(service => cleanName.includes(service))) {
          regularImports.push(imp);
        } else if (cleanName.endsWith('Service') || 
                   cleanName.endsWith('Guard') || 
                   cleanName.endsWith('Repository') ||
                   cleanName.endsWith('Controller') ||
                   cleanName.endsWith('Module') ||
                   cleanName.endsWith('Indicator') ||
                   cleanName.endsWith('Provider')) {
          regularImports.push(imp);
        } else {
          regularImports.push(imp);
        }
      }
    });
    
    // Reconstruct the import statement
    if (regularImports.length > 0 && typeImports.length > 0) {
      const regularPart = regularImports.join(', ');
      const typePart = typeImports.map(t => `type ${t}`).join(', ');
      modified = true;
      return `import { ${regularPart}, ${typePart} } from ${modulePath}`;
    }
    
    return match;
  });
  
  // Fix specific patterns for dependency injection issues
  const patterns = [
    {
      regex: /import\s+type\s+\{\s*TenantProvisioningService\s*\}/g,
      replacement: 'import { TenantProvisioningService }'
    },
    {
      regex: /import\s+type\s+\{([^}]*)(\w+Service)([^}]*)\}\s+from/g,
      replacement: 'import {$1$2$3} from'
    },
    {
      regex: /import\s+type\s+\{([^}]*)(\w+Guard)([^}]*)\}\s+from/g,
      replacement: 'import {$1$2$3} from'
    },
    {
      regex: /import\s+type\s+\{([^}]*)(\w+Repository)([^}]*)\}\s+from/g,
      replacement: 'import {$1$2$3} from'
    },
    {
      regex: /import\s+type\s+\{([^}]*)(\w+Indicator)([^}]*)\}\s+from/g,
      replacement: 'import {$1$2$3} from'
    }
  ];
  
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(file, content);
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\\nFixed ${fixedCount} files with type-only import issues`);