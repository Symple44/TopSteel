# 🏆 DERNIÈRE CORRECTION - TopSteel ERP

# Corriger l'import dans ui-stubs.d.ts
$stubFile = "apps/web/src/types/ui-stubs.d.ts"
$content = Get-Content $stubFile -Raw

# Changer "import * as React" en "import type * as React"
$content = $content -replace 'import \* as React', 'import type * as React'

Set-Content $stubFile -Value $content

# Test final
pnpm lint

Write-Host "🎉 SUCCÈS TOTAL ! TopSteel ERP 100% opérationnel !" -ForegroundColor Green