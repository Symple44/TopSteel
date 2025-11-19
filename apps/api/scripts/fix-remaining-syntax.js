/**
 * Fix remaining syntax errors - specific patterns
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/domains/notifications/services/notification-rules-engine.service.ts',
    pattern: /import type { NotificationConditionEvaluator } from '\.\/notification-condition-evaluator\.service'\nimport type {\nimport { NotificationRule } from '@prisma\/client'\n\n  NotificationDeliveryOptions,\n  NotificationDeliveryService,\n} from '\.\/notification-delivery\.service'/,
    replacement: `import type { NotificationConditionEvaluator } from './notification-condition-evaluator.service'
import { NotificationRule } from '@prisma/client'
import type {
  NotificationDeliveryOptions,
  NotificationDeliveryService,
} from './notification-delivery.service'`
  },
  {
    file: 'src/features/admin/controllers/admin-menus.controller.ts',
    pattern: /import type { MenuConfiguration } from '\.\.\/entities\/menu-configuration\.entity'\nimport type {\nimport { MenuItem } from '@prisma\/client'\n  CreateMenuConfigDto,\n  MenuConfigurationService,\n  UpdateMenuConfigDto,\n} from '\.\.\/services\/menu-configuration\.service'/,
    replacement: `import type { MenuConfiguration } from '../entities/menu-configuration.entity'
import { MenuItem } from '@prisma/client'
import type {
  CreateMenuConfigDto,
  MenuConfigurationService,
  UpdateMenuConfigDto,
} from '../services/menu-configuration.service'`
  },
  {
    file: 'src/features/admin/system-parameters.service.ts',
    pattern: /} from '\.\/dto\/system-parameter\.dto'\nimport {\nimport { SystemParameter } from '@prisma\/client'\n  type ParameterCategory,\n  type ParameterType,\n  SystemParameter,\n} from '\.\/entitites\/system-parameter\.entity'/,
    replacement: `} from './dto/system-parameter.dto'
import { SystemParameter } from '@prisma/client'
import {
  type ParameterCategory,
  type ParameterType,
} from './entitites/system-parameter.entity'`
  },
  {
    file: 'src/features/parameters/dto/parameter-application.dto.ts',
    pattern: /import { ApiProperty } from '@nestjs\/swagger'\nimport {\nimport { ParameterApplication } from '@prisma\/client'\n\n  IsNotEmpty,\n  IsOptional,\n  IsString,\n} from 'class-validator'/,
    replacement: `import { ApiProperty } from '@nestjs/swagger'
import { ParameterApplication } from '@prisma/client'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'`
  },
  {
    file: 'src/features/parameters/dto/parameter-client.dto.ts',
    pattern: /import { ApiProperty } from '@nestjs\/swagger'\nimport {\nimport { ParameterClient } from '@prisma\/client'\n\n  IsNotEmpty,\n  IsOptional,\n  IsString,\n} from 'class-validator'/,
    replacement: `import { ApiProperty } from '@nestjs/swagger'
import { ParameterClient } from '@prisma/client'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'`
  },
];

let fixed = 0;
let errors = 0;

for (const fix of fixes) {
  const fullPath = path.join(__dirname, '..', fix.file);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`   ✅ ${fix.file}`);
      fixed++;
    } else {
      console.log(`   ⏭️  ${fix.file} (pattern not found)`);
    }
  } catch (error) {
    console.log(`   ❌ ${fix.file}: ${error.message}`);
    errors++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed} files`);
console.log(`   ❌ Errors: ${errors} files\n`);
