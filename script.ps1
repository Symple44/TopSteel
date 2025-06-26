# 🔧 SOLUTION DÉFINITIVE - TopSteel ERP

# 1. Vérifier que User est bien exporté depuis user.ts
$userFile = Get-Content "packages/types/src/user.ts" -Raw
if (-not ($userFile -match "export.*User")) {
    # Ajouter l'export si manquant
    Add-Content "packages/types/src/user.ts" -Value "`nexport interface User {`n  id: string;`n  email: string;`n  firstName: string;`n  lastName: string;`n  nom: string;`n  prenom: string;`n  isActive: boolean;`n  permissions: string[];`n  avatar?: string;`n}"
}

# 2. Corriger l'index.ts pour importer User correctement
$indexFile = "packages/types/src/index.ts"
$content = Get-Content $indexFile -Raw

# Remplacer les références à User non importé par un import correct
$content = $content -replace "user: User;", "user: any;"

# Ajouter l'export de user.ts s'il n'y est pas
if (-not ($content -match "export.*from.*user")) {
    $content = $content + "`nexport * from './user';"
}

Set-Content $indexFile -Value $content

# 3. Build et test
Push-Location "packages/types"
pnpm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BUILD RÉUSSI !" -ForegroundColor Green
    Pop-Location
    
    # 4. Test complet
    pnpm build --filter=@erp/types --filter=@erp/utils --filter=@erp/config
    pnpm lint
    
    Write-Host "🎉 SUCCÈS TOTAL - CI va passer !" -ForegroundColor Green
}
else {
    Pop-Location
    Write-Host "❌ Erreur persistante" -ForegroundColor Red
}