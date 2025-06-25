# fix-quotes.ps1 - Correction automatique des apostrophes en HTML entities
param(
    [string]$Path = "src",
    [switch]$DryRun = $false
)

Write-Host "🔧 Correction des apostrophes dans les fichiers TSX..." -ForegroundColor Cyan

$files = Get-ChildItem -Path $Path -Recurse -Include "*.tsx", "*.ts" -File
$totalFiles = $files.Count
$modifiedFiles = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Corrections spécifiques courantes
    $replacements = @{
        "n't " = "n&apos;t "        # can't, don't, won't
        "l'" = "l&apos;"           # l'entreprise
        "d'" = "d&apos;"           # d'une, d'un
        "'s " = "&apos;s "         # it's, he's
        "'re " = "&apos;re "       # they're, we're
        "'ll " = "&apos;ll "       # you'll, we'll
        "'ve " = "&apos;ve "       # I've, we've
        "'m " = "&apos;m "         # I'm
        "' " = "&apos; "           # Apostrophe suivie d'espace
        "'," = "&apos;,"           # Apostrophe suivie de virgule
        "'." = "&apos;."           # Apostrophe suivie de point
        "'!" = "&apos;!"           # Apostrophe suivie d'exclamation
        "'?" = "&apos;?"           # Apostrophe suivie d'interrogation
        
        # Guillemets doubles
        '""' = '&quot;&quot;'      # Doubles guillemets
        '" ' = '&quot; '           # Guillemet suivi d'espace
        '",' = '&quot;,'           # Guillemet suivi de virgule
        '".' = '&quot;.'           # Guillemet suivi de point
        '"!" = '&quot;!'           # Guillemet suivi d'exclamation
        '"?' = '&quot;?'           # Guillemet suivi d'interrogation
    }
    
    # Appliquer les remplacements
    foreach ($search in $replacements.Keys) {
        $replace = $replacements[$search]
        $content = $content -replace [regex]::Escape($search), $replace
    }
    
    # Cas spéciaux pour les textes entre balises JSX
    # Remplacer les apostrophes isolées dans le texte
    $content = $content -replace "(?<=>)[^<]*'([^<>]*)<", {
        param($match)
        $match.Value -replace "'", "&apos;"
    }
    
    if ($content -ne $originalContent) {
        $changes = ($originalContent.Length - $content.Length) + ($content.Length - $originalContent.Length)
        
        if ($DryRun) {
            Write-Host "  [DRY RUN] $($file.Name) - Corrections détectées" -ForegroundColor Yellow
        } else {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  ✅ $($file.Name) - Corrigé" -ForegroundColor Green
            $modifiedFiles++
        }
    }
}

if ($DryRun) {
    Write-Host "`n🔍 Mode DRY RUN - Aucun fichier modifié" -ForegroundColor Yellow
    Write-Host "   Lancez sans -DryRun pour appliquer les corrections" -ForegroundColor Gray
} else {
    Write-Host "`n✅ Correction terminée:" -ForegroundColor Green
    Write-Host "   Fichiers analysés: $totalFiles" -ForegroundColor White
    Write-Host "   Fichiers modifiés: $modifiedFiles" -ForegroundColor White
}

Write-Host "`n💡 Testez le linting après les corrections:" -ForegroundColor Cyan
Write-Host "   pnpm lint" -ForegroundColor Gray