# add-test-scripts.ps1
# Ajouter les scripts de test manquants dans tous les workspaces

Write-Host "📝 Ajout des scripts de test dans tous les workspaces" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

function Add-TestScripts {
    param([string]$PackagePath)
    
    if (Test-Path $PackagePath) {
        Write-Host "`n📦 Mise à jour de: $PackagePath" -ForegroundColor Yellow
        
        $package = Get-Content $PackagePath -Raw | ConvertFrom-Json
        
        # Vérifier si les scripts existent
        if (-not $package.scripts) {
            $package | Add-Member -Name "scripts" -Value ([PSCustomObject]@{}) -MemberType NoteProperty
        }
        
        # Ajouter test si absent
        if (-not $package.scripts.test) {
            $package.scripts | Add-Member -Name "test" -Value "jest" -MemberType NoteProperty -Force
            Write-Host "  ✅ Ajouté: test" -ForegroundColor Green
        }
        
        # Ajouter test:watch si absent
        if (-not $package.scripts."test:watch") {
            $package.scripts | Add-Member -Name "test:watch" -Value "jest --watch" -MemberType NoteProperty -Force
            Write-Host "  ✅ Ajouté: test:watch" -ForegroundColor Green
        }
        
        # Ajouter test:coverage si absent
        if (-not $package.scripts."test:coverage") {
            $package.scripts | Add-Member -Name "test:coverage" -Value "jest --coverage" -MemberType NoteProperty -Force
            Write-Host "  ✅ Ajouté: test:coverage" -ForegroundColor Green
        }
        
        # Ajouter test:debug si absent
        if (-not $package.scripts."test:debug") {
            $package.scripts | Add-Member -Name "test:debug" -Value "node --inspect-brk node_modules/.bin/jest --runInBand" -MemberType NoteProperty -Force
            Write-Host "  ✅ Ajouté: test:debug" -ForegroundColor Green
        }
        
        # Sauvegarder
        $package | ConvertTo-Json -Depth 100 | Set-Content $PackagePath -Encoding UTF8
    }
}

# Mettre à jour tous les packages
Add-TestScripts -PackagePath "apps/web/package.json"
Add-TestScripts -PackagePath "apps/api/package.json"
Add-TestScripts -PackagePath "packages/ui/package.json"
Add-TestScripts -PackagePath "packages/utils/package.json"
Add-TestScripts -PackagePath "packages/types/package.json"

# Mettre à jour le package.json racine aussi
Write-Host "`n📦 Mise à jour du package.json racine" -ForegroundColor Yellow
$rootPackage = Get-Content "package.json" -Raw | ConvertFrom-Json

if (-not $rootPackage.scripts."test:watch") {
    $rootPackage.scripts | Add-Member -Name "test:watch" -Value "turbo test:watch" -MemberType NoteProperty -Force
    Write-Host "  ✅ Ajouté: test:watch" -ForegroundColor Green
}

if (-not $rootPackage.scripts."test:coverage") {
    $rootPackage.scripts | Add-Member -Name "test:coverage" -Value "turbo test:coverage" -MemberType NoteProperty -Force
    Write-Host "  ✅ Ajouté: test:coverage" -ForegroundColor Green
}

$rootPackage | ConvertTo-Json -Depth 100 | Set-Content "package.json" -Encoding UTF8

Write-Host "`n✅ Scripts de test ajoutés partout !" -ForegroundColor Green
Write-Host "`n📋 Commandes disponibles maintenant :" -ForegroundColor Cyan
Write-Host "  pnpm test              # Lancer tous les tests" -ForegroundColor White
Write-Host "  pnpm test:watch        # Tests en mode watch" -ForegroundColor White
Write-Host "  pnpm test:coverage     # Tests avec couverture" -ForegroundColor White
Write-Host "  pnpm --filter @erp/web test:watch    # Watch pour web uniquement" -ForegroundColor White
Write-Host "  pnpm --filter @erp/api test:watch    # Watch pour api uniquement" -ForegroundColor White