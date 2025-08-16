# TopSteel Quality Check Script (PowerShell)
# Analyse la qualité du code, détecte les problèmes et génère des rapports

param(
    [Parameter(Position=0)]
    [ValidateSet("complexity", "duplication", "naming", "imports", "documentation", "bundle-size", "report", "all")]
    [string]$Command = "all"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ReportsDir = Join-Path $ProjectRoot "reports"
$QualityConfig = Join-Path $ProjectRoot ".quality.json"

# Fonctions utilitaires
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $color = switch ($Level) {
        "INFO" { "Blue" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Level] $Message" -ForegroundColor $color
}

function Write-Info { param([string]$Message) Write-Log $Message "INFO" }
function Write-Success { param([string]$Message) Write-Log $Message "SUCCESS" }
function Write-Warning { param([string]$Message) Write-Log $Message "WARNING" }
function Write-Error { param([string]$Message) Write-Log $Message "ERROR" }

# Créer le dossier de rapports
function New-ReportsDirectory {
    if (-not (Test-Path $ReportsDir)) {
        New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
        Write-Info "Reports directory created: $ReportsDir"
    }
}

# Charger la configuration de qualité
function Get-QualityConfig {
    if (Test-Path $QualityConfig) {
        Write-Info "Loading quality configuration from $QualityConfig"
        
        try {
            $config = Get-Content $QualityConfig | ConvertFrom-Json
            $script:CoverageThreshold = $config.thresholds.coverage.minimum ?? 80
            $script:ComplexityThreshold = $config.thresholds.complexity.cyclomatic ?? 10
            $script:DuplicationThreshold = $config.thresholds.duplication.percentage ?? 5
            $script:BundleSizeThreshold = $config.thresholds.bundleSize.web ?? "5MB"
        }
        catch {
            Write-Warning "Failed to parse quality configuration, using defaults"
            Set-DefaultThresholds
        }
    }
    else {
        Write-Warning "Quality configuration file not found, using defaults"
        Set-DefaultThresholds
    }
}

function Set-DefaultThresholds {
    $script:CoverageThreshold = 80
    $script:ComplexityThreshold = 10
    $script:DuplicationThreshold = 5
    $script:BundleSizeThreshold = "5MB"
}

# Analyser la complexité du code
function Test-CodeComplexity {
    Write-Info "Analyzing code complexity..."
    
    $complexityReport = Join-Path $ReportsDir "complexity-report.json"
    $complexitySummary = Join-Path $ReportsDir "complexity-summary.txt"
    
    # Rechercher les fichiers TypeScript
    $tsFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.ts" | 
               Where-Object { $_.FullName -notmatch "node_modules|dist|\.next" } |
               Select-Object -First 100
    
    # Générer un résumé basique (sans complexity-report qui n'est pas disponible sur Windows)
    $summary = @"
Code Complexity Analysis Report
================================
Generated at: $(Get-Date)

Total TypeScript files analyzed: $($tsFiles.Count)
"@
    
    # Analyser les fichiers pour détecter des patterns de complexité élevée
    $highComplexityFiles = @()
    
    foreach ($file in $tsFiles) {
        $content = Get-Content $file.FullName -Raw
        
        # Compter les structures de contrôle (approximation de la complexité cyclomatique)
        $ifCount = ([regex]::Matches($content, '\bif\s*\(')).Count
        $forCount = ([regex]::Matches($content, '\b(for|while)\s*\(')).Count
        $switchCount = ([regex]::Matches($content, '\bswitch\s*\(')).Count
        $tryCount = ([regex]::Matches($content, '\btry\s*\{')).Count
        $ternaryCount = ([regex]::Matches($content, '\?[^:]*:')).Count
        
        $approximateComplexity = $ifCount + $forCount + $switchCount + $tryCount + $ternaryCount + 1
        
        if ($approximateComplexity -gt $ComplexityThreshold) {
            $highComplexityFiles += [PSCustomObject]@{
                Path = $file.FullName.Replace($ProjectRoot, "").Replace("\", "/")
                Complexity = $approximateComplexity
            }
        }
    }
    
    $summary += "`n`nFiles with high complexity (>$ComplexityThreshold): $($highComplexityFiles.Count)"
    
    if ($highComplexityFiles.Count -gt 0) {
        Write-Warning "Found $($highComplexityFiles.Count) files with high complexity"
        $summary += "`n`nHigh complexity files:"
        foreach ($file in $highComplexityFiles) {
            $summary += "`n$($file.Path): $($file.Complexity)"
        }
    }
    else {
        Write-Success "All files have acceptable complexity"
    }
    
    $summary | Out-File -FilePath $complexitySummary -Encoding UTF8
}

# Détecter le code dupliqué
function Test-CodeDuplication {
    Write-Info "Detecting code duplication..."
    
    $duplicationSummary = Join-Path $ReportsDir "duplication-summary.txt"
    
    # Analyse basique de duplication (sans jscpd)
    $summary = @"
Code Duplication Analysis Report
================================
Generated at: $(Get-Date)

"@
    
    # Rechercher des patterns de duplication basiques
    $tsFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.ts", "*.tsx" | 
               Where-Object { $_.FullName -notmatch "node_modules|dist|\.next" }
    
    $duplicatePatterns = @()
    $functionRegex = 'function\s+\w+\s*\([^)]*\)\s*\{[^}]{50,}\}'
    
    foreach ($file in $tsFiles) {
        $content = Get-Content $file.FullName -Raw
        $functions = [regex]::Matches($content, $functionRegex)
        
        foreach ($func in $functions) {
            $similarFunctions = $tsFiles | ForEach-Object {
                $otherContent = Get-Content $_.FullName -Raw
                if ($otherContent -match [regex]::Escape($func.Value.Substring(0, [Math]::Min(100, $func.Value.Length)))) {
                    $_.FullName
                }
            } | Where-Object { $_ -ne $file.FullName }
            
            if ($similarFunctions.Count -gt 0) {
                $duplicatePatterns += [PSCustomObject]@{
                    File = $file.FullName.Replace($ProjectRoot, "").Replace("\", "/")
                    SimilarFiles = $similarFunctions.Count
                }
            }
        }
    }
    
    $summary += "Potential duplicate patterns found: $($duplicatePatterns.Count)"
    
    if ($duplicatePatterns.Count -gt 0) {
        Write-Warning "Found $($duplicatePatterns.Count) potential code duplications"
    }
    else {
        Write-Success "No significant code duplication found"
    }
    
    $summary | Out-File -FilePath $duplicationSummary -Encoding UTF8
}

# Vérifier les conventions de nommage
function Test-NamingConventions {
    Write-Info "Checking naming conventions..."
    
    $namingReport = Join-Path $ReportsDir "naming-conventions.txt"
    
    $summary = @"
Naming Conventions Report
========================
Generated at: $(Get-Date)

"@
    
    # Fichiers avec des espaces
    $filesWithSpaces = Get-ChildItem -Path $ProjectRoot -Recurse | 
                      Where-Object { $_.Name -match ' ' -and $_.FullName -notmatch "node_modules|dist|\.next" }
    
    $summary += "Files with spaces in name: $($filesWithSpaces.Count)"
    
    # Composants React sans PascalCase
    $reactComponents = Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.tsx" |
                      Where-Object { $_.FullName -notmatch "node_modules|dist|\.next" -and $_.Name -notmatch '^[A-Z][a-zA-Z]*\.tsx$' }
    
    $summary += "`nNon-PascalCase React components: $($reactComponents.Count)"
    
    if ($filesWithSpaces.Count -eq 0 -and $reactComponents.Count -eq 0) {
        Write-Success "All files follow naming conventions"
    }
    else {
        Write-Warning "Some files don't follow naming conventions"
    }
    
    $summary | Out-File -FilePath $namingReport -Encoding UTF8
}

# Analyser les imports inutilisés
function Test-UnusedImports {
    Write-Info "Checking for unused imports..."
    
    $unusedImportsReport = Join-Path $ReportsDir "unused-imports.txt"
    
    $summary = @"
Unused Imports Report
====================
Generated at: $(Get-Date)

"@
    
    # Utiliser Biome si disponible
    try {
        $biomeOutput = & biome check --reporter=json . 2>$null | ConvertFrom-Json
        $unusedImportsCount = ($biomeOutput.diagnostics | Where-Object { $_.category -eq "lint/correctness/noUnusedImports" }).Count
        
        $summary += "Files with unused imports: $unusedImportsCount"
        
        if ($unusedImportsCount -gt 0) {
            Write-Warning "Found unused imports in $unusedImportsCount files"
        }
        else {
            Write-Success "No unused imports found"
        }
    }
    catch {
        $summary += "Biome not available for unused imports check"
        Write-Warning "Biome not available for unused imports analysis"
    }
    
    $summary | Out-File -FilePath $unusedImportsReport -Encoding UTF8
}

# Vérifier la documentation
function Test-Documentation {
    Write-Info "Checking documentation coverage..."
    
    $docReport = Join-Path $ReportsDir "documentation-coverage.txt"
    
    $tsFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.ts" |
               Where-Object { $_.FullName -notmatch "node_modules|dist|\.next" }
    
    $documentedFiles = $tsFiles | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match '/\*\*'
    }
    
    $docCoverage = if ($tsFiles.Count -gt 0) { 
        [math]::Round(($documentedFiles.Count / $tsFiles.Count) * 100, 2) 
    } else { 0 }
    
    $summary = @"
Documentation Coverage Report
============================
Generated at: $(Get-Date)

Total TypeScript files: $($tsFiles.Count)
Files with JSDoc comments: $($documentedFiles.Count)
Documentation coverage: $docCoverage%
"@
    
    if ($docCoverage -ge 70) {
        Write-Success "Good documentation coverage: $docCoverage%"
    }
    elseif ($docCoverage -ge 50) {
        Write-Warning "Moderate documentation coverage: $docCoverage%"
    }
    else {
        Write-Warning "Low documentation coverage: $docCoverage%"
    }
    
    $summary | Out-File -FilePath $docReport -Encoding UTF8
}

# Vérifier la taille des bundles
function Test-BundleSize {
    Write-Info "Checking bundle sizes..."
    
    $bundleReport = Join-Path $ReportsDir "bundle-size.txt"
    
    $summary = @"
Bundle Size Report
==================
Generated at: $(Get-Date)

"@
    
    # Web app
    $webBuildPath = Join-Path $ProjectRoot "apps\web\.next"
    if (Test-Path $webBuildPath) {
        $webSize = (Get-ChildItem $webBuildPath -Recurse | Measure-Object -Property Length -Sum).Sum
        $webSizeMB = [math]::Round($webSize / 1MB, 2)
        $summary += "Web app bundle size: $webSizeMB MB"
        
        if ($webSizeMB -gt 10) {
            Write-Warning "Web app bundle is large: $webSizeMB MB"
        }
    }
    else {
        $summary += "Web app bundle: Not built"
    }
    
    # Marketplace storefront
    $marketplaceBuildPath = Join-Path $ProjectRoot "apps\marketplace-storefront\.next"
    if (Test-Path $marketplaceBuildPath) {
        $marketplaceSize = (Get-ChildItem $marketplaceBuildPath -Recurse | Measure-Object -Property Length -Sum).Sum
        $marketplaceSizeMB = [math]::Round($marketplaceSize / 1MB, 2)
        $summary += "`nMarketplace storefront bundle size: $marketplaceSizeMB MB"
    }
    else {
        $summary += "`nMarketplace storefront bundle: Not built"
    }
    
    Write-Success "Bundle size check completed"
    $summary | Out-File -FilePath $bundleReport -Encoding UTF8
}

# Générer un rapport de qualité global
function New-QualityReport {
    Write-Info "Generating global quality report..."
    
    $globalReport = Join-Path $ProjectRoot "quality-report.md"
    
    $gitCommit = try { git rev-parse HEAD 2>$null } catch { "unknown" }
    $gitBranch = try { git branch --show-current 2>$null } catch { "unknown" }
    
    $reportContent = @"
# TopSteel Quality Report

**Generated at:** $(Get-Date)
**Git Commit:** $gitCommit
**Branch:** $gitBranch

## Summary

This report provides an overview of the code quality metrics for the TopSteel project.

## Configuration Thresholds

- **Coverage Threshold:** $CoverageThreshold%
- **Complexity Threshold:** $ComplexityThreshold
- **Duplication Threshold:** $DuplicationThreshold%
- **Bundle Size Threshold:** $BundleSizeThreshold

## Reports Generated

"@
    
    # Ajouter les liens vers les rapports générés
    $reportFiles = Get-ChildItem -Path $ReportsDir -Include "*.txt", "*.json" -ErrorAction SilentlyContinue
    foreach ($report in $reportFiles) {
        $reportContent += "- [$($report.Name)](./reports/$($report.Name))`n"
    }
    
    $reportContent += @"

## Quality Metrics

### Code Complexity
"@
    
    $complexitySummaryPath = Join-Path $ReportsDir "complexity-summary.txt"
    if (Test-Path $complexitySummaryPath) {
        $reportContent += "`n````"
        $reportContent += "`n$(Get-Content $complexitySummaryPath -Raw)"
        $reportContent += "`n````"
    }
    else {
        $reportContent += "`nComplexity analysis not available."
    }
    
    $reportContent += @"

### Code Duplication
"@
    
    $duplicationSummaryPath = Join-Path $ReportsDir "duplication-summary.txt"
    if (Test-Path $duplicationSummaryPath) {
        $reportContent += "`n````"
        $reportContent += "`n$(Get-Content $duplicationSummaryPath -Raw)"
        $reportContent += "`n````"
    }
    else {
        $reportContent += "`nDuplication analysis not available."
    }
    
    $reportContent += @"

### Bundle Sizes
"@
    
    $bundleSizePath = Join-Path $ReportsDir "bundle-size.txt"
    if (Test-Path $bundleSizePath) {
        $reportContent += "`n````"
        $reportContent += "`n$(Get-Content $bundleSizePath -Raw)"
        $reportContent += "`n````"
    }
    else {
        $reportContent += "`nBundle size analysis not available."
    }
    
    $reportContent += @"

---

*This report was generated automatically by the TopSteel quality check system.*
"@
    
    $reportContent | Out-File -FilePath $globalReport -Encoding UTF8
    Write-Success "Global quality report generated: $globalReport"
}

# Fonction principale
function Invoke-QualityCheck {
    param([string]$Command)
    
    Write-Info "Starting TopSteel Quality Check..."
    Write-Info "Command: $Command"
    
    New-ReportsDirectory
    Get-QualityConfig
    
    switch ($Command) {
        "complexity" { Test-CodeComplexity }
        "duplication" { Test-CodeDuplication }
        "naming" { Test-NamingConventions }
        "imports" { Test-UnusedImports }
        "documentation" { Test-Documentation }
        "bundle-size" { Test-BundleSize }
        "report" { New-QualityReport }
        "all" {
            Test-CodeComplexity
            Test-CodeDuplication
            Test-NamingConventions
            Test-UnusedImports
            Test-Documentation
            Test-BundleSize
            New-QualityReport
        }
        default {
            Write-Error "Unknown command: $Command"
            Write-Host "Usage: .\quality-check.ps1 [complexity|duplication|naming|imports|documentation|bundle-size|report|all]"
            exit 1
        }
    }
    
    Write-Success "Quality check completed!"
}

# Exécuter la fonction principale
Invoke-QualityCheck -Command $Command