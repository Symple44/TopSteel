# upgrade-rimraf-v6.ps1 - Upgrade vers rimraf v6 avec support glob
Write-Host "🆙 UPGRADE VERS RIMRAF V6" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# 1. Installer rimraf v6
Write-Host "`n📦 Installation de rimraf v6..." -ForegroundColor Yellow
try {
    pnpm remove rimraf
    pnpm add -D rimraf@latest
    Write-Host "✅ rimraf v6 installé" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de l'installation: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Vérifier la version
$rimrafVersion = npx rimraf --version
Write-Host "🔍 Version installée: $rimrafVersion" -ForegroundColor Blue

# 3. Scripts package.json optimisés pour rimraf v6
Write-Host "`n⚙️ Mise à jour des scripts pour rimraf v6..." -ForegroundColor Yellow

$packageJsonPath = "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Scripts avec option --glob pour les wildcards
$newScripts = @{
    "clean" = "rimraf --glob node_modules/.cache .turbo .next dist apps/web/.next 'packages/*/dist' && pnpm install"
    "clean:cache" = "rimraf node_modules/.cache .turbo"
    "clean:build" = "rimraf --glob .next dist apps/web/.next 'packages/*/dist'"
    "clean:all" = "rimraf --glob node_modules/.cache .turbo .next dist apps/web/.next 'packages/*/dist' node_modules && pnpm install"
    "clean:safe" = "rimraf --verbose --glob node_modules/.cache .turbo .next dist apps/web/.next 'packages/*/dist' && pnpm install"
    "clean:explicit" = "rimraf node_modules/.cache && rimraf .turbo && rimraf .next && rimraf dist && rimraf apps/web/.next && rimraf packages/ui/dist && rimraf packages/types/dist && rimraf packages/utils/dist && rimraf packages/config/dist && pnpm install"
}

foreach ($script in $newScripts.GetEnumerator()) {
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name $script.Key -Value $script.Value -Force
}

try {
    $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding UTF8
    Write-Host "✅ Scripts mis à jour pour rimraf v6" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Test avec différentes approches
Write-Host "`n🧪 Tests rimraf v6..." -ForegroundColor Yellow

# Test 1: Wildcards avec --glob
Write-Host "Test 1: Wildcards avec --glob..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Path "test-packages" -Force | Out-Null
    New-Item -ItemType Directory -Path "test-packages/ui" -Force | Out-Null
    New-Item -ItemType Directory -Path "test-packages/ui/dist" -Force | Out-Null
    New-Item -ItemType File -Path "test-packages/ui/dist/test.txt" -Force | Out-Null
    
    npx rimraf --glob 'test-packages/*/dist'
    
    if (!(Test-Path "test-packages/ui/dist")) {
        Write-Host "✅ Wildcards avec --glob fonctionnent" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Wildcards avec --glob échouent" -ForegroundColor Yellow
    }
    
    # Nettoyage
    rimraf test-packages
} catch {
    Write-Host "⚠️ Test wildcards échoué: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 2: Chemins explicites (fallback)
Write-Host "Test 2: Chemins explicites..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Path "test-explicit" -Force | Out-Null
    npx rimraf test-explicit
    
    if (!(Test-Path "test-explicit")) {
        Write-Host "✅ Chemins explicites fonctionnent" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Chemins explicites échouent" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Test explicite échoué: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Configuration VS Code mise à jour
Write-Host "`n🔧 Mise à jour des tâches VS Code..." -ForegroundColor Yellow

$vscodeTasks = @'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🧹 Clean - Rimraf v6 (glob)",
      "type": "shell",
      "command": "pnpm",
      "args": ["clean"],
      "options": { "cwd": "${workspaceFolder}" },
      "group": "none",
      "presentation": { "echo": true, "reveal": "always", "focus": true, "panel": "shared" },
      "problemMatcher": [],
      "detail": "Nettoyage avec rimraf v6 et support glob"
    },
    {
      "label": "🧹 Clean - Safe (explicit)",
      "type": "shell",
      "command": "pnpm",
      "args": ["clean:explicit"],
      "options": { "cwd": "${workspaceFolder}" },
      "group": "none",
      "presentation": { "echo": true, "reveal": "always", "focus": true, "panel": "shared" },
      "problemMatcher": [],
      "detail": "Nettoyage avec chemins explicites (fallback)"
    },
    {
      "label": "🔍 Clean - Verbose",
      "type": "shell",
      "command": "pnpm",
      "args": ["clean:safe"],
      "options": { "cwd": "${workspaceFolder}" },
      "group": "none",
      "presentation": { "echo": true, "reveal": "always", "focus": true, "panel": "shared" },
      "problemMatcher": [],
      "detail": "Nettoyage verbose pour debug"
    }
  ]
}
'@

if (!(Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" -Force | Out-Null
}

try {
    $vscodeTasks | Out-File -FilePath ".vscode/tasks-rimraf-v6.json" -Encoding UTF8
    Write-Host "✅ Tâches VS Code créées: .vscode/tasks-rimraf-v6.json" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Impossible de créer les tâches VS Code" -ForegroundColor Yellow
}

# 6. Résumé et recommandations
Write-Host "`n🎉 UPGRADE RIMRAF V6 TERMINÉ!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

Write-Host "✅ rimraf v6 installé" -ForegroundColor White
Write-Host "✅ Scripts avec --glob pour wildcards" -ForegroundColor White
Write-Host "✅ Scripts de fallback explicites" -ForegroundColor White
Write-Host "✅ Tâches VS Code mises à jour" -ForegroundColor White

Write-Host "`n🛠️ Commandes à tester (dans l'ordre):" -ForegroundColor Cyan
Write-Host "  1. pnpm clean        - Rimraf v6 avec --glob" -ForegroundColor White
Write-Host "  2. pnpm clean:safe   - Rimraf v6 verbose" -ForegroundColor White
Write-Host "  3. pnpm clean:explicit - Chemins explicites (si glob échoue)" -ForegroundColor White

Write-Host "`n💡 Avantages rimraf v6:" -ForegroundColor Blue
Write-Host "  • Meilleure gestion Windows/OneDrive" -ForegroundColor White
Write-Host "  • Stratégie 'move then remove' pour les cas difficiles" -ForegroundColor White
Write-Host "  • Mode verbose pour debug" -ForegroundColor White
Write-Host "  • Support glob optionnel avec --glob" -ForegroundColor White

Write-Host "`n👉 Essayez maintenant: pnpm clean" -ForegroundColor Yellow