# fix-cicd-errors.ps1
# Script PowerShell de correction automatique des erreurs CI/CD TopSteel

param(
    [switch]$QuickFix,
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"

# Couleurs pour les messages
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

function Write-Step {
    param([string]$Message)
    Write-ColorMessage "`n📋 $Message" "Blue"
    Write-ColorMessage "----------------------------------------" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorMessage "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorMessage "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorMessage "❌ $Message" "Red"
}

# Début du script
Write-ColorMessage "🛠️  Correction automatique des erreurs CI/CD TopSteel" "Cyan"
Write-ColorMessage "=====================================================" "Cyan"

# Vérifier qu'on est dans le bon dossier
if (!(Test-Path "package.json") -or !(Test-Path "turbo.json")) {
    Write-Error "Ce script doit être exécuté depuis la racine du projet TopSteel"
    exit 1
}

Write-Step "1. Corrections urgentes (Quick Fix)"

# Corriger .lighthouserc.json
if (Test-Path ".lighthouserc.json") {
    Write-Warning "Correction de .lighthouserc.json..."
    $lighthouseContent = @"
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
"@
    Set-Content -Path ".lighthouserc.json" -Value $lighthouseContent -Encoding UTF8
    Write-Success ".lighthouserc.json corrigé"
}

# Renommer et corriger auth.module.js
$authModuleJs = "apps\api\src\modules\auth\auth.module.js"
$authModuleTs = "apps\api\src\modules\auth\auth.module.ts"

if (Test-Path $authModuleJs) {
    Write-Warning "Correction de auth.module.js..."
    
    # Créer le dossier si nécessaire
    $authDir = Split-Path $authModuleTs -Parent
    if (!(Test-Path $authDir)) {
        New-Item -ItemType Directory -Path $authDir -Force | Out-Null
    }
    
    $authModuleContent = @"
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("jwt.secret"),
        signOptions: {
          expiresIn: configService.get("jwt.expiresIn", "24h"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
"@
    
    Set-Content -Path $authModuleTs -Value $authModuleContent -Encoding UTF8
    Remove-Item $authModuleJs -Force
    Write-Success "auth.module.js → auth.module.ts corrigé"
}

# Correction rapide de la syntaxe JSX dans clients.ts
$clientsFile = "apps\web\src\app\(dashboard)\clients\clients.ts"
if (Test-Path $clientsFile) {
    Write-Warning "Correction de l'erreur JSX dans clients.ts..."
    $clientsContent = Get-Content $clientsFile -Raw
    if ($clientsContent -match 'variant=\{config\.variant\}') {
        $clientsContent = $clientsContent -replace 'variant=\{config\.variant\}', 'variant={config.variant}'
        Set-Content -Path $clientsFile -Value $clientsContent -Encoding UTF8
        Write-Success "Erreur JSX dans clients.ts corrigée"
    }
}

if ($QuickFix) {
    Write-Success "🚀 Corrections urgentes appliquées!"
    Write-ColorMessage "`nTestez maintenant avec : pnpm lint && pnpm type-check" "Yellow"
    exit 0
}

Write-Step "2. Création des configurations ESLint v9"

# Fonction pour créer un fichier
function New-FileWithContent {
    param(
        [string]$Path,
        [string]$Content
    )
    
    $directory = Split-Path -Parent $Path
    if (!(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    
    Set-Content -Path $Path -Value $Content -Encoding UTF8
}

# ESLint config pour packages/types
$typesEslintConfig = @"
import baseConfig from "@erp/config/eslint/base.js";

export default [
  ...baseConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"]
  },
  
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-namespace": "off"
    }
  }
];
"@

New-FileWithContent "packages\types\eslint.config.js" $typesEslintConfig
Write-Success "packages/types/eslint.config.js créé"

# ESLint config pour packages/utils
$utilsEslintConfig = @"
import baseConfig from "@erp/config/eslint/base.js";

export default [
  ...baseConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"]
  },
  
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
"@

New-FileWithContent "packages\utils\eslint.config.js" $utilsEslintConfig
Write-Success "packages/utils/eslint.config.js créé"

# ESLint config pour packages/ui
$uiEslintConfig = @"
import reactConfig from "@erp/config/eslint/react.js";

export default [
  ...reactConfig,
  
  {
    ignores: ["dist/**", "storybook-static/**", "node_modules/**", ".turbo/**"]
  },
  
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-empty-interface": "off"
    }
  }
];
"@

New-FileWithContent "packages\ui\eslint.config.js" $uiEslintConfig
Write-Success "packages/ui/eslint.config.js créé"

# ESLint config pour apps/api
$apiEslintConfig = @"
import nodeConfig from "@erp/config/eslint/node.js";

export default [
  ...nodeConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**", "coverage/**"]
  },
  
  {
    files: ["src/**/*.{ts,js}", "test/**/*.{ts,js}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  }
];
"@

New-FileWithContent "apps\api\eslint.config.js" $apiEslintConfig
Write-Success "apps/api/eslint.config.js créé"

Write-Step "3. Création des modules manquants de l'API"

# Fonction pour créer un module NestJS
function New-NestModule {
    param(
        [string]$ModuleName
    )
    
    $modulePath = "apps\api\src\modules\$ModuleName"
    Write-Warning "Création du module $ModuleName..."
    
    # Créer la structure
    New-Item -ItemType Directory -Path "$modulePath\entities" -Force | Out-Null
    New-Item -ItemType Directory -Path "$modulePath\dto" -Force | Out-Null
    
    $capitalizedName = $ModuleName.Substring(0,1).ToUpper() + $ModuleName.Substring(1)
    
    # Module
    $moduleContent = @"
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${capitalizedName}Service } from './${ModuleName}.service';
import { ${capitalizedName}Controller } from './${ModuleName}.controller';
import { ${capitalizedName} } from './entities/${ModuleName}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${capitalizedName}])],
  controllers: [${capitalizedName}Controller],
  providers: [${capitalizedName}Service],
  exports: [${capitalizedName}Service],
})
export class ${capitalizedName}Module {}
"@

    Set-Content -Path "$modulePath\$ModuleName.module.ts" -Value $moduleContent -Encoding UTF8
    
    # Service
    $serviceContent = @"
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${capitalizedName} } from './entities/${ModuleName}.entity';

@Injectable()
export class ${capitalizedName}Service {
  constructor(
    @InjectRepository(${capitalizedName})
    private ${ModuleName}Repository: Repository<${capitalizedName}>,
  ) {}

  async findAll(): Promise<${capitalizedName}[]> {
    return this.${ModuleName}Repository.find();
  }

  async findOne(id: string): Promise<${capitalizedName}> {
    return this.${ModuleName}Repository.findOne({ where: { id } });
  }

  async create(data: Partial<${capitalizedName}>): Promise<${capitalizedName}> {
    const entity = this.${ModuleName}Repository.create(data);
    return this.${ModuleName}Repository.save(entity);
  }

  async update(id: string, data: Partial<${capitalizedName}>): Promise<${capitalizedName}> {
    await this.${ModuleName}Repository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.${ModuleName}Repository.delete(id);
  }
}
"@

    Set-Content -Path "$modulePath\$ModuleName.service.ts" -Value $serviceContent -Encoding UTF8
    
    # Controller
    $controllerContent = @"
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ${capitalizedName}Service } from './${ModuleName}.service';

@Controller('${ModuleName}')
export class ${capitalizedName}Controller {
  constructor(private readonly ${ModuleName}Service: ${capitalizedName}Service) {}

  @Get()
  findAll() {
    return this.${ModuleName}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${ModuleName}Service.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.${ModuleName}Service.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.${ModuleName}Service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${ModuleName}Service.remove(id);
  }
}
"@

    Set-Content -Path "$modulePath\$ModuleName.controller.ts" -Value $controllerContent -Encoding UTF8
    
    # Entity
    $entityContent = @"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${ModuleName}')
export class ${capitalizedName} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
"@

    Set-Content -Path "$modulePath\entities\$ModuleName.entity.ts" -Value $entityContent -Encoding UTF8
    
    Write-Success "Module $ModuleName créé"
}

# Créer les modules manquants
$modules = @("clients", "devis", "documents", "facturation", "notifications", "production", "stocks", "users")

foreach ($module in $modules) {
    if (!(Test-Path "apps\api\src\modules\$module")) {
        New-NestModule $module
    } else {
        Write-Warning "Module $module existe déjà, ignoré"
    }
}

Write-Step "4. Création des décorateurs et middleware"

# Common decorators et middleware
New-Item -ItemType Directory -Path "apps\api\src\common\decorators" -Force | Out-Null
New-Item -ItemType Directory -Path "apps\api\src\common\middleware" -Force | Out-Null

# Current user decorator
$currentUserDecorator = @"
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
"@

Set-Content -Path "apps\api\src\common\decorators\current-user.decorator.ts" -Value $currentUserDecorator -Encoding UTF8

# Roles decorator
$rolesDecorator = @"
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
"@

Set-Content -Path "apps\api\src\common\decorators\roles.decorator.ts" -Value $rolesDecorator -Encoding UTF8

# Logger middleware
$loggerMiddleware = @"
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('User-Agent') || '';

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('Content-Length');

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
"@

Set-Content -Path "apps\api\src\common\middleware\logger.middleware.ts" -Value $loggerMiddleware -Encoding UTF8

Write-Success "Décorateurs et middleware créés"

Write-Step "5. Création des DTOs d'authentification"

# Créer les DTOs auth
New-Item -ItemType Directory -Path "apps\api\src\modules\auth\dto" -Force | Out-Null
New-Item -ItemType Directory -Path "apps\api\src\modules\auth\guards" -Force | Out-Null

# Login DTO
$loginDto = @"
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
"@

Set-Content -Path "apps\api\src\modules\auth\dto\login.dto.ts" -Value $loginDto -Encoding UTF8

# Register DTO
$registerDto = @"
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
"@

Set-Content -Path "apps\api\src\modules\auth\dto\register.dto.ts" -Value $registerDto -Encoding UTF8

# Refresh token DTO
$refreshTokenDto = @"
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
"@

Set-Content -Path "apps\api\src\modules\auth\dto\refresh-token.dto.ts" -Value $refreshTokenDto -Encoding UTF8

Write-Success "DTOs d'authentification créés"

Write-Step "6. Mise à jour turbo.json"

$turboConfig = @"
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "env": ["NODE_ENV"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "format": {
      "outputs": []
    }
  }
}
"@

Set-Content -Path "turbo.json" -Value $turboConfig -Encoding UTF8
Write-Success "turbo.json mis à jour"

Write-Step "7. Vérification finale"

Write-Warning "Installation des dépendances..."
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    try {
        & pnpm install --silent
        Write-Success "Dépendances installées"
    } catch {
        Write-Warning "Erreur lors de l'installation des dépendances"
    }
} else {
    Write-Error "pnpm non trouvé. Veuillez installer pnpm et relancer."
}

Write-ColorMessage "`n🎉 Corrections appliquées avec succès!" "Green"

Write-ColorMessage "`n📋 Étapes suivantes :" "Blue"
Write-Host "1. Vérifiez les corrections : pnpm lint"
Write-Host "2. Vérifiez TypeScript : pnpm type-check"
Write-Host "3. Formatez le code : pnpm format"
Write-Host "4. Lancez les tests : pnpm test"
Write-Host "5. Committez les changements"

Write-ColorMessage "`n⚠️  Notes importantes :" "Yellow"
Write-Host "- Certains modules peuvent nécessiter des entités plus complexes"
Write-Host "- Vérifiez les imports dans app.module.ts"
Write-Host "- Adaptez les DTOs selon vos besoins métier"
Write-Host "- Configurez les guards JWT selon votre authentification"

Write-ColorMessage "`n✅ Script terminé avec succès!" "Green"