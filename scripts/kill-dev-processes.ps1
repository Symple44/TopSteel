# Script pour tuer les processus Node.js orphelins
Write-Host "Recherche des processus Node.js en cours..." -ForegroundColor Yellow

# Trouver tous les processus node/nodemon
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*nodemon*" }

if ($nodeProcesses.Count -eq 0) {
    Write-Host "Aucun processus Node.js trouvé." -ForegroundColor Green
    exit
}

Write-Host "Processus Node.js trouvés:" -ForegroundColor Cyan
$nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet -AutoSize

$confirmation = Read-Host "Voulez-vous tuer tous ces processus? (y/N)"
if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force
            Write-Host "✓ Processus $($process.ProcessName) (PID: $($process.Id)) terminé" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Impossible de terminer le processus $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Annulé." -ForegroundColor Yellow
}