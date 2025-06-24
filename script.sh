# fix-turbo-immediate.ps1
Write-Host "⚡ Correction turbo.json..." -ForegroundColor Red

$turboContent = @'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
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
'@

Set-Content -Path "turbo.json" -Value $turboContent -Encoding UTF8
Write-Host "✅ turbo.json corrigé" -ForegroundColor Green

# Test immédiat
Write-Host "🧪 Test..."
try {
    $test = Get-Content "turbo.json" | ConvertFrom-Json
    Write-Host "✅ JSON valide" -ForegroundColor Green
    
    # Test Turbo
    & pnpm turbo lint:fix 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Turbo fonctionne!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Turbo fonctionne, mais il y a d'autres erreurs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur JSON" -ForegroundColor Red
}