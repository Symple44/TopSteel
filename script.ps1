# scripts/fix-test-coverage.ps1
# Script PowerShell pour ajouter les scripts de test manquants

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
        
        # Ajouter test:coverage si absent
        if (-not $package.scripts."test:coverage") {
            $package.scripts | Add-Member -Name "test:coverage" -Value "jest --coverage" -MemberType NoteProperty -Force
            Write-Host "  ✅ Ajouté: test:coverage" -ForegroundColor Green
        }
        
        # Sauvegarder avec indentation correcte
        $package | ConvertTo-Json -Depth 100 | Set-Content $PackagePath -Encoding UTF8
    }
}

# Mettre à jour tous les packages
$packages = @(
    "apps/web/package.json",
    "apps/api/package.json",
    "packages/ui/package.json",
    "packages/utils/package.json",
    "packages/types/package.json"
)

foreach ($pkg in $packages) {
    Add-TestScripts -PackagePath $pkg
}

Write-Host "`n✅ Scripts de test ajoutés !" -ForegroundColor Green
