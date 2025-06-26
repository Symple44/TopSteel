#!/usr/bin/env pwsh
# =========================================================================
# APPLICATION CONFIGURATION VS CODE
# Création des fichiers de configuration VS Code pour ERP TopSteel
# =========================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                    CONFIGURATION VS CODE ERP TOPSTEEL" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# Créer le dossier .vscode
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" -Force | Out-Null
    Write-Host "[+] Dossier .vscode créé" -ForegroundColor Green
}

# =========================================================================
# 1. TASKS.JSON
# =========================================================================

Write-Host "[*] Création tasks.json..." -ForegroundColor Yellow

$tasksJson = @{
    version = "2.0.0"
    tasks   = @(
        @{
            label          = "🚀 ERP: Setup Complet"
            type           = "shell"
            command        = "pwsh"
            args           = @("scripts/setup-erp.ps1")
            group          = @{
                kind      = "build"
                isDefault = $true
            }
            presentation   = @{
                echo   = $true
                reveal = "always"
                focus  = $false
                panel  = "new"
            }
            problemMatcher = @()
            detail         = "Installation complète du projet ERP TopSteel"
        },
        @{
            label        = "🔄 ERP: Setup Force (Reset)"
            type         = "shell"
            command      = "pwsh"
            args         = @("scripts/setup-erp.ps1", "-Force")
            group        = "build"
            presentation = @{
                echo   = $true
                reveal = "always"
                panel  = "new"
            }
            detail       = "Réinstallation forcée avec suppression des données existantes"
        },
        @{
            label        = "▶️ ERP: Démarrer Serveurs"
            type         = "shell"
            command      = "pnpm"
            args         = @("dev")
            group        = "build"
            presentation = @{
                echo   = $true
                reveal = "always"
                panel  = "new"
            }
            detail       = "Démarre les serveurs API et Web en mode développement"
        },
        @{
            label        = "🏗️ ERP: Build Packages"
            type         = "shell"
            command      = "pnpm"
            args         = @("build:packages")
            group        = "build"
            presentation = @{
                echo   = $true
                reveal = "always"
            }
            detail       = "Construit les packages partagés (types, utils, config)"
        },
        @{
            label        = "🗄️ DB: Status"
            type         = "shell"
            command      = "pwsh"
            args         = @("scripts/manage-db.ps1", "status")
            group        = "test"
            presentation = @{
                echo   = $true
                reveal = "always"
                panel  = "new"
            }
            detail       = "Affiche l'état de la base de données"
        },
        @{
            label        = "💾 DB: Backup"
            type         = "shell"
            command      = "pwsh"
            args         = @("scripts/manage-db.ps1", "backup")
            group        = "build"
            presentation = @{
                echo   = $true
                reveal = "always"
                panel  = "new"
            }
            detail       = "Crée une sauvegarde de la base de données"
        },
        @{
            label        = "🔄 DB: Reset Database"
            type         = "shell"
            command      = "pwsh"
            args         = @("scripts/manage-db.ps1", "reset")
            group        = "build"
            presentation = @{
                echo   = $true
                reveal = "always"
                panel  = "new"
            }
            detail       = "Remet à zéro la base de données (ATTENTION: destructif)"
        },
        @{
            label        = "🔍 ERP: Lint"
            type         = "shell"
            command      = "pnpm"
            args         = @("lint")
            group        = "test"
            presentation = @{
                echo   = $true
                reveal = "always"
            }
            detail       = "Vérifie la qualité du code"
        },
        @{
            label        = "🧹 ERP: Clean"
            type         = "shell"
            command      = "pnpm"
            args         = @("clean")
            group        = "build"
            presentation = @{
                echo   = $true
                reveal = "always"
            }
            detail       = "Nettoie les fichiers de build et cache"
        },
        @{
            label        = "🔧 ERP: Check Environment"
            type         = "shell"
            command      = "pnpm"
            args         = @("check:env")
            group        = "test"
            presentation = @{
                echo   = $true
                reveal = "always"
            }
            detail       = "Vérifie les variables d'environnement"
        }
    )
}

$tasksJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/tasks.json"
Write-Host "[+] tasks.json créé" -ForegroundColor Green

# =========================================================================
# 2. LAUNCH.JSON
# =========================================================================

Write-Host "[*] Création launch.json..." -ForegroundColor Yellow

$launchJson = @{
    version        = "0.2.0"
    configurations = @(
        @{
            name       = "🐛 Debug API (NestJS)"
            type       = "node"
            request    = "launch"
            # CORRECTION: Échappement correct des variables VS Code
            program    = "`${workspaceFolder}/apps/api/dist/main.js"
            cwd        = "`${workspaceFolder}/apps/api"
            env        = @{
                NODE_ENV = "development"
            }
            sourceMaps = $true
            outFiles   = @("`${workspaceFolder}/apps/api/dist/**/*.js")
            console    = "integratedTerminal"
            restart    = $true
        },
        @{
            name    = "🐛 Debug Web (Next.js)"
            type    = "node"
            request = "launch"
            program = "`${workspaceFolder}/apps/web/node_modules/.bin/next"
            args    = @("dev")
            cwd     = "`${workspaceFolder}/apps/web"
            env     = @{
                NODE_ENV = "development"
            }
            console = "integratedTerminal"
        }
    )
}

$launchJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/launch.json"
Write-Host "[+] launch.json créé" -ForegroundColor Green

# =========================================================================
# 3. SETTINGS.JSON
# =========================================================================

Write-Host "[*] Création settings.json..." -ForegroundColor Yellow

$settingsJson = @{
    "typescript.preferences.includePackageJsonAutoImports" = "auto"
    "typescript.suggest.autoImports"                       = $true
    "typescript.preferences.importModuleSpecifier"         = "relative"
    "editor.formatOnSave"                                  = $true
    "editor.codeActionsOnSave"                             = @{
        "source.fixAll.eslint"   = $true
        "source.organizeImports" = $true
    }
    "files.associations"                                   = @{
        "*.env*" = "properties"
        "*.md"   = "markdown"
    }
    "search.exclude"                                       = @{
        "**/node_modules" = $true
        "**/dist"         = $true
        "**/.next"        = $true
        "**/coverage"     = $true
        "**/.turbo"       = $true
    }
    "files.watcherExclude"                                 = @{
        "**/node_modules/**" = $true
        "**/dist/**"         = $true
        "**/.next/**"        = $true
        "**/coverage/**"     = $true
        "**/.turbo/**"       = $true
    }
    "explorer.fileNesting.enabled"                         = $true
    "explorer.fileNesting.patterns"                        = @{
        # CORRECTION: Variables VS Code correctement échappées
        "*.ts"          = "`${capture}.js"
        "*.tsx"         = "`${capture}.js"
        "package.json"  = "package-lock.json,pnpm-lock.yaml,yarn.lock"
        ".env"          = ".env.*"
        "tsconfig.json" = "tsconfig.*.json"
        "README.md"     = "README.*"
    }
    "terminal.integrated.defaultProfile.windows"           = "PowerShell"
    "git.autofetch"                                        = $true
    "workbench.editor.enablePreview"                       = $false
    "editor.minimap.enabled"                               = $false
    "editor.rulers"                                        = @(80, 120)
}

$settingsJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/settings.json"
Write-Host "[+] settings.json créé" -ForegroundColor Green

# =========================================================================
# 4. EXTENSIONS.JSON
# =========================================================================

Write-Host "[*] Création extensions.json..." -ForegroundColor Yellow

$extensionsJson = @{
    recommendations         = @(
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.powershell",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense",
        "ckolkman.vscode-postgres",
        "rangav.vscode-thunder-client",
        "usernamehw.errorlens",
        "gruntfuggly.todo-tree"
    )
    unwantedRecommendations = @(
        "ms-vscode.vscode-typescript",
        "hookyqr.beautify"
    )
}

$extensionsJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/extensions.json"
Write-Host "[+] extensions.json créé" -ForegroundColor Green

# =========================================================================
# 5. SNIPPETS
# =========================================================================

Write-Host "[*] Création snippets..." -ForegroundColor Yellow

if (-not (Test-Path ".vscode/snippets")) {
    New-Item -ItemType Directory -Path ".vscode/snippets" -Force | Out-Null
}

# CORRECTION: Utilisation de here-strings pour éviter les problèmes d'échappement
$typescriptSnippetsContent = @'
{
  "NestJS Controller": {
    "prefix": "nest-controller",
    "body": [
      "import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';",
      "import { ApiTags, ApiOperation } from '@nestjs/swagger';",
      "",
      "@Controller('${1:resource}')",
      "@ApiTags('${1:resource}')",
      "export class ${2:Resource}Controller {",
      "  constructor(private readonly ${3:service}: ${2:Resource}Service) {}",
      "",
      "  @Get()",
      "  @ApiOperation({ summary: 'Get all ${1:resource}' })",
      "  findAll() {",
      "    return this.${3:service}.findAll();",
      "  }",
      "",
      "  @Get(':id')",
      "  findOne(@Param('id') id: string) {",
      "    return this.${3:service}.findOne(id);",
      "  }",
      "}"
    ],
    "description": "Créer un contrôleur NestJS"
  },
  "React Component": {
    "prefix": "react-component",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:Component}Props {",
      "  ${2:prop}: ${3:string};",
      "}",
      "",
      "export const ${1:Component}: React.FC<${1:Component}Props> = ({ ${2:prop} }) => {",
      "  return (",
      "    <div className=\"${4:container}\">",
      "      ${5:content}",
      "    </div>",
      "  );",
      "};"
    ],
    "description": "Créer un composant React"
  },
  "NestJS Service": {
    "prefix": "nest-service",
    "body": [
      "import { Injectable } from '@nestjs/common';",
      "",
      "@Injectable()",
      "export class ${1:Resource}Service {",
      "  async findAll() {",
      "    // TODO: Implement findAll logic",
      "    return [];",
      "  }",
      "",
      "  async findOne(id: string) {",
      "    // TODO: Implement findOne logic",
      "    return null;",
      "  }",
      "",
      "  async create(data: any) {",
      "    // TODO: Implement create logic",
      "    return data;",
      "  }",
      "",
      "  async update(id: string, data: any) {",
      "    // TODO: Implement update logic",
      "    return data;",
      "  }",
      "",
      "  async remove(id: string) {",
      "    // TODO: Implement remove logic",
      "    return { deleted: true };",
      "  }",
      "}"
    ],
    "description": "Créer un service NestJS"
  },
  "React Hook": {
    "prefix": "react-hook",
    "body": [
      "import { useState, useEffect } from 'react';",
      "",
      "export const use${1:Hook} = () => {",
      "  const [${2:state}, set${2/(.*)/${1:/capitalize}/}] = useState(${3:null});",
      "",
      "  useEffect(() => {",
      "    // TODO: Implement effect logic",
      "  }, []);",
      "",
      "  return {",
      "    ${2:state},",
      "    set${2/(.*)/${1:/capitalize}/}",
      "  };",
      "};"
    ],
    "description": "Créer un hook React personnalisé"
  }
}
'@

Set-Content ".vscode/snippets/typescript.json" $typescriptSnippetsContent
Write-Host "[+] Snippets TypeScript créés" -ForegroundColor Green

# =========================================================================
# 6. CRÉER UN FICHIER DE CORRECTION POST-GÉNÉRATION
# =========================================================================

Write-Host "[*] Création du correcteur post-génération..." -ForegroundColor Yellow

$postFixScript = @'
#!/usr/bin/env pwsh
# Script de correction des fichiers VS Code générés

Write-Host "🔧 Correction des variables VS Code..." -ForegroundColor Yellow

# Correction du launch.json
if (Test-Path ".vscode/launch.json") {
    $launchContent = Get-Content ".vscode/launch.json" -Raw
    
    # Corriger les variables VS Code mal échappées
    $launchContent = $launchContent -replace '`\$\{workspaceFolder\}', '${workspaceFolder}'
    $launchContent = $launchContent -replace '`\$\{capture\}', '${capture}'
    
    Set-Content ".vscode/launch.json" $launchContent
    Write-Host "✅ launch.json corrigé" -ForegroundColor Green
}

# Correction du settings.json
if (Test-Path ".vscode/settings.json") {
    $settingsContent = Get-Content ".vscode/settings.json" -Raw
    
    # Corriger les variables VS Code mal échappées
    $settingsContent = $settingsContent -replace '`\$\{capture\}', '${capture}'
    
    Set-Content ".vscode/settings.json" $settingsContent
    Write-Host "✅ settings.json corrigé" -ForegroundColor Green
}

Write-Host "🎉 Correction terminée !" -ForegroundColor Green
'@

Set-Content ".vscode/fix-config.ps1" $postFixScript
Write-Host "[+] Script de correction créé" -ForegroundColor Green

# =========================================================================
# EXÉCUTION DU CORRECTEUR
# =========================================================================

Write-Host "[*] Application des corrections..." -ForegroundColor Yellow
& ".vscode/fix-config.ps1"

# =========================================================================
# RÉSUMÉ
# =========================================================================

Write-Host "" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "✅ CONFIGURATION VS CODE TERMINÉE !" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White

Write-Host "📋 FICHIERS CRÉÉS :" -ForegroundColor Blue
Write-Host "✅ .vscode/tasks.json - Tâches automatisées" -ForegroundColor Green
Write-Host "✅ .vscode/launch.json - Configuration debug" -ForegroundColor Green  
Write-Host "✅ .vscode/settings.json - Paramètres éditeur" -ForegroundColor Green
Write-Host "✅ .vscode/extensions.json - Extensions recommandées" -ForegroundColor Green
Write-Host "✅ .vscode/snippets/typescript.json - Snippets de code" -ForegroundColor Green
Write-Host "✅ .vscode/fix-config.ps1 - Script de correction" -ForegroundColor Green
Write-Host "" -ForegroundColor White

Write-Host "🚀 UTILISATION DANS VS CODE :" -ForegroundColor Blue
Write-Host "1. Ctrl+Shift+P > 'Tasks: Run Task'" -ForegroundColor White
Write-Host "2. Choisissez une tâche (🚀 Setup, ▶️ Démarrer, 🗄️ DB Status, etc.)" -ForegroundColor White
Write-Host "3. Ou F1 > 'Tasks: Run Build Task' pour le setup complet" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "🔧 TÂCHES PRINCIPALES DISPONIBLES :" -ForegroundColor Blue
Write-Host "• 🚀 ERP: Setup Complet - Installation complète" -ForegroundColor White
Write-Host "• ▶️ ERP: Démarrer Serveurs - Lance pnpm dev" -ForegroundColor White
Write-Host "• 🗄️ DB: Status - État de la base de données" -ForegroundColor White
Write-Host "• 💾 DB: Backup - Sauvegarde automatique" -ForegroundColor White
Write-Host "• 🔄 DB: Reset Database - Remise à zéro" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "📝 SNIPPETS DISPONIBLES :" -ForegroundColor Blue
Write-Host "• nest-controller - Contrôleur NestJS complet" -ForegroundColor White
Write-Host "• nest-service - Service NestJS avec CRUD" -ForegroundColor White
Write-Host "• react-component - Composant React TypeScript" -ForegroundColor White
Write-Host "• react-hook - Hook React personnalisé" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "💡 CONSEIL :" -ForegroundColor Yellow
Write-Host "Redémarrez VS Code pour appliquer toute la configuration !" -ForegroundColor White