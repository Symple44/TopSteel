#!/usr/bin/env ts-node
/**
 * Script to replace console.log statements with proper logger calls
 * This helps reduce technical debt and improve production logging
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const LOGGER_IMPORT_API = "import { apiLogger } from '@erp/utils';";
const LOGGER_IMPORT_WEB = "import { webLogger } from '@erp/utils';";
const LOGGER_IMPORT_DB = "import { dbLogger } from '@erp/utils';";
const LOGGER_IMPORT_AUTH = "import { authLogger } from '@erp/utils';";

interface ReplacementRule {
  pattern: RegExp;
  replacement: string;
  loggerType: 'api' | 'web' | 'db' | 'auth' | 'generic';
}

const replacementRules: ReplacementRule[] = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    loggerType: 'generic'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    loggerType: 'generic'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    loggerType: 'generic'
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    loggerType: 'generic'
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    loggerType: 'generic'
  }
];

function determineLoggerType(filePath: string): 'api' | 'web' | 'db' | 'auth' | 'generic' {
  if (filePath.includes('/api/') || filePath.includes('apps/api/')) {
    return 'api';
  }
  if (filePath.includes('/web/') || filePath.includes('apps/web/')) {
    return 'web';
  }
  if (filePath.includes('/auth/') || filePath.includes('auth.')) {
    return 'auth';
  }
  if (filePath.includes('database') || filePath.includes('migration') || filePath.includes('repository')) {
    return 'db';
  }
  return 'generic';
}

function getLoggerImport(loggerType: string): string {
  switch (loggerType) {
    case 'api':
      return LOGGER_IMPORT_API;
    case 'web':
      return LOGGER_IMPORT_WEB;
    case 'db':
      return LOGGER_IMPORT_DB;
    case 'auth':
      return LOGGER_IMPORT_AUTH;
    default:
      return "import { logger } from '@erp/utils';";
  }
}

function getLoggerName(loggerType: string): string {
  switch (loggerType) {
    case 'api':
      return 'apiLogger';
    case 'web':
      return 'webLogger';
    case 'db':
      return 'dbLogger';
    case 'auth':
      return 'authLogger';
    default:
      return 'logger';
  }
}

function processFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Check if file contains console statements
    const hasConsole = /console\.(log|error|warn|debug|info)\(/g.test(content);
    if (!hasConsole) {
      return false;
    }

    const loggerType = determineLoggerType(filePath);
    const loggerName = getLoggerName(loggerType);
    
    // Replace console statements
    replacementRules.forEach(rule => {
      const replacement = rule.replacement.replace('logger', loggerName);
      content = content.replace(rule.pattern, replacement);
    });

    // Add logger import if not present
    const importStatement = getLoggerImport(loggerType);
    const hasLoggerImport = content.includes('@erp/utils') && content.includes(loggerName);
    
    if (!hasLoggerImport) {
      // Find the best place to add the import
      const importMatch = content.match(/^import .* from ['"].*['"];?$/m);
      if (importMatch) {
        const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
      } else {
        // Add at the beginning of the file
        content = importStatement + '\n\n' + content;
      }
    }

    // Write back only if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log('🔍 Searching for files with console statements...\n');

  // Patterns to search for TypeScript/JavaScript files
  const patterns = [
    'apps/api/src/**/*.ts',
    'apps/web/src/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
  ];

  // Files to exclude
  const excludePatterns = [
    '**/node_modules/**',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.test.tsx',
    '**/*.spec.tsx',
    '**/__tests__/**',
    '**/dist/**',
    '**/.next/**',
    '**/logger.ts', // Don't modify the logger itself
  ];

  let totalProcessed = 0;
  let totalSkipped = 0;

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: excludePatterns,
      absolute: true,
    });

    files.forEach(file => {
      if (processFile(file)) {
        totalProcessed++;
      } else {
        totalSkipped++;
      }
    });
  });

  console.log('\n📊 Summary:');
  console.log(`   - Files processed: ${totalProcessed}`);
  console.log(`   - Files skipped: ${totalSkipped}`);
  console.log('\n✨ Console replacement completed!');
  console.log('⚠️  Please review the changes and run tests to ensure everything works correctly.');
}

// Run the script
if (require.main === module) {
  main();
}