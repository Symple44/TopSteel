# Fix-RegisterAndAsChild.ps1 - Correction ciblée page register + asChild
# =======================================================================

param([switch]$Force)

$ErrorActionPreference = "Continue"

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔧 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ️ $Message" -ForegroundColor Blue
}

function Create-File {
    param([string]$Path, [string]$Content)
    
    $Directory = Split-Path $Path -Parent
    if ($Directory -and !(Test-Path $Directory)) {
        New-Item -ItemType Directory -Path $Directory -Force | Out-Null
        Write-Info "Créé dossier: $Directory"
    }
    
    $Content | Out-File -FilePath $Path -Encoding UTF8 -Force
    Write-Success "Créé: $Path"
}

function Search-AsChildUsage {
    param([string]$Directory)
    
    if (Test-Path $Directory) {
        $Files = Get-ChildItem -Path $Directory -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
        foreach ($File in $Files) {
            $Content = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue
            if ($Content -and $Content -match "asChild") {
                Write-Info "Fichier avec asChild trouvé: $($File.FullName)"
                return $File.FullName
            }
        }
    }
    return $null
}

Clear-Host
Write-Host "🎯 CORRECTION REGISTER + PROBLÈME ASCHILD" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# =============================================================
# ÉTAPE 1: Création de la page register manquante
# =============================================================

Write-Step "Création de la page register (/register)"

$RegisterPage = @'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }

      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        return
      }

      // Simulation d'inscription
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirection vers login avec message de succès
      router.push('/login?message=Compte créé avec succès')
    } catch (err) {
      setError('Erreur lors de la création du compte')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Rejoignez ERP TopSteel
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Jean"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="jean.dupont@exemple.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
'@

Create-File "apps/web/src/app/register/page.tsx" $RegisterPage

# =============================================================
# ÉTAPE 2: Recherche et correction du problème asChild
# =============================================================

Write-Step "Recherche des fichiers contenant asChild"

# Rechercher dans les composants UI
$AsChildFiles = @()
$SearchDirectories = @(
    "apps/web/src/components",
    "apps/web/src/app",
    "packages/ui/src"
)

foreach ($dir in $SearchDirectories) {
    $FoundFile = Search-AsChildUsage $dir
    if ($FoundFile) {
        $AsChildFiles += $FoundFile
    }
}

if ($AsChildFiles.Count -gt 0) {
    Write-Info "Fichiers avec asChild trouvés:"
    foreach ($file in $AsChildFiles) {
        Write-Info "  • $file"
    }
} else {
    Write-Info "Aucun fichier avec asChild trouvé dans les dossiers de recherche"
}

# =============================================================
# ÉTAPE 3: Correction spécifique du composant Button si problématique
# =============================================================

Write-Step "Vérification et correction du composant Button"

$ButtonPath = "apps/web/src/components/ui/button.tsx"
if (Test-Path $ButtonPath) {
    $ButtonContent = Get-Content $ButtonPath -Raw
    
    if ($ButtonContent -match "asChild" -or $ButtonContent -match "Slot") {
        Write-Info "Composant Button contient asChild/Slot, correction..."
        
        $ButtonFixed = @'
import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", 
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline"
    }
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10"
    }
    
    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
'@

        $ButtonFixed | Out-File -FilePath $ButtonPath -Encoding UTF8 -Force
        Write-Success "Composant Button corrigé (asChild/Slot supprimé)"
    } else {
        Write-Info "Composant Button ne contient pas asChild/Slot"
    }
} else {
    Write-Info "Composant Button non trouvé"
}

# =============================================================
# ÉTAPE 4: Vérification des autres composants UI potentiels
# =============================================================

Write-Step "Vérification des autres composants UI avec asChild"

$UIComponents = @(
    "apps/web/src/components/ui/card.tsx",
    "apps/web/src/components/ui/alert.tsx",
    "apps/web/src/components/ui/label.tsx"
)

foreach ($component in $UIComponents) {
    if (Test-Path $component) {
        $Content = Get-Content $component -Raw
        if ($Content -match "asChild" -or $Content -match "Slot") {
            Write-Info "Composant $component contient asChild, nécessite une correction manuelle"
            
            # Suggestion de correction pour le composant trouvé
            $ComponentName = (Split-Path $component -Leaf) -replace '\.tsx$', ''
            Write-Info "  → Remplacez les références à Slot par des éléments HTML natifs"
            Write-Info "  → Supprimez la prop asChild du composant $ComponentName"
        }
    }
}

# =============================================================
# ÉTAPE 5: Recherche dans packages/ui (monorepo)
# =============================================================

Write-Step "Vérification du package UI du monorepo"

$UIPackagePath = "packages/ui/src"
if (Test-Path $UIPackagePath) {
    $UIAsChildFile = Search-AsChildUsage $UIPackagePath
    if ($UIAsChildFile) {
        Write-Info "Composant avec asChild trouvé dans packages/ui:"
        Write-Info "  • $UIAsChildFile"
        Write-Info "  → Ce composant doit être corrigé dans le package UI partagé"
        Write-Info "  → Ou utilisez les composants UI locaux dans apps/web/src/components/ui/"
    } else {
        Write-Info "Aucun asChild trouvé dans packages/ui"
    }
} else {
    Write-Info "Package UI non trouvé"
}

# =============================================================
# RÉSUMÉ FINAL
# =============================================================

Write-Host "`n🎉 CORRECTIONS APPLIQUÉES !" -ForegroundColor Green
Write-Host "=" * 35 -ForegroundColor Green

Write-Host "`n📋 Actions effectuées :" -ForegroundColor Cyan
Write-Host "  ✅ Page register créée → /register" -ForegroundColor Green
Write-Host "  ✅ Composant Button vérifié et corrigé si nécessaire" -ForegroundColor Green
Write-Host "  ✅ Recherche des sources asChild effectuée" -ForegroundColor Green

Write-Host "`n🚀 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Redémarrez le serveur : Ctrl+C puis pnpm dev:web" -ForegroundColor Yellow
Write-Host "  2. Testez /register : http://localhost:3000/register" -ForegroundColor Yellow
Write-Host "  3. Si asChild persiste, vérifiez packages/ui/" -ForegroundColor Yellow

Write-Host "`n🎯 Test de l'inscription :" -ForegroundColor Cyan
Write-Host "  • Créez un compte sur /register" -ForegroundColor Green
Write-Host "  • Vous serez redirigé vers /login" -ForegroundColor Green

Write-Host "`n✨ Page register créée et asChild recherché ! ✨" -ForegroundColor Green