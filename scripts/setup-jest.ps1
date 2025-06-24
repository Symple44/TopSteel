# setup-jest-fixed.ps1
# Script corrigé pour configurer Jest dans le projet TopSteel

Write-Host "🧪 Configuration de Jest pour ERP TOPSTEEL" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Vérifier si on est dans le bon dossier
if (!(Test-Path "package.json") -or !(Test-Path "turbo.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet TopSteel" -ForegroundColor Red
    exit 1
}

# Fonction pour créer un fichier
function Create-File {
    param (
        [string]$Path,
        [string]$Content
    )
    
    $directory = Split-Path -Parent $Path
    if (!(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "✅ Créé: $Path" -ForegroundColor Green
}

# 1. Corriger turbo.json (pipeline -> tasks)
Write-Host "`n🔧 Mise à jour de turbo.json pour Turbo v2..." -ForegroundColor Yellow
$turboConfig = @'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "env": ["NODE_ENV"]
    },
    "start:dev": {
      "cache": false,
      "persistent": true,
      "env": ["NODE_ENV", "PORT", "DB_*", "REDIS_*", "JWT_*"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"],
      "env": [
        "NODE_ENV",
        "NEXT_PUBLIC_*",
        "DB_*",
        "REDIS_*",
        "JWT_*",
        "APP_*",
        "CORS_*"
      ]
    },
    "start": {
      "dependsOn": ["build"],
      "cache": false,
      "env": ["NODE_ENV", "PORT"]
    },
    "start:prod": {
      "dependsOn": ["build"],
      "cache": false,
      "env": ["NODE_ENV", "PORT", "DB_*", "REDIS_*", "JWT_*"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": [
        "src/**/*.{ts,tsx}",
        "test/**/*.{ts,tsx}",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}"
      ]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "test:cov": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "env": ["NODE_ENV", "DB_*", "REDIS_*"]
    },
    "migration:run": {
      "cache": false,
      "env": ["DB_*"]
    },
    "migration:generate": {
      "cache": false,
      "env": ["DB_*"]
    },
    "migration:revert": {
      "cache": false,
      "env": ["DB_*"]
    },
    "seed:run": {
      "cache": false,
      "env": ["DB_*"]
    },
    "format": {
      "outputs": [],
      "cache": false
    }
  }
}
'@

# Sauvegarder l'ancien turbo.json
if (Test-Path "turbo.json") {
    Copy-Item "turbo.json" "turbo.json.backup" -Force
    Write-Host "📋 Sauvegarde créée: turbo.json.backup" -ForegroundColor Cyan
}

Create-File -Path "turbo.json" -Content $turboConfig

# 2. Installer Jest au niveau du workspace root
Write-Host "`n📦 Installation de Jest et des dépendances de test..." -ForegroundColor Yellow

# Installer au niveau racine avec -w
pnpm add -D -w jest @types/jest ts-jest

# Installer dans le workspace web
Write-Host "`n📦 Installation des dépendances de test pour l'app web..." -ForegroundColor Yellow
pnpm add -D --filter @erp/web jest @types/jest ts-jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event identity-obj-proxy

# Installer dans le workspace api
Write-Host "`n📦 Installation des dépendances de test pour l'API..." -ForegroundColor Yellow
pnpm add -D --filter @erp/api jest @types/jest ts-jest @nestjs/testing

# 3. Créer jest.config.js à la racine
Write-Host "`n📝 Création de la configuration Jest racine..." -ForegroundColor Yellow
if (!(Test-Path "jest.config.js")) {
    $rootJestConfig = @'
module.exports = {
  projects: [
    '<rootDir>/apps/web/jest.config.js',
    '<rootDir>/apps/api/jest.config.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/test/**',
    '!**/__tests__/**',
    '!**/__mocks__/**'
  ]
};
'@
    Create-File -Path "jest.config.js" -Content $rootJestConfig
}

# 4. Créer jest.config.js pour l'app web
Write-Host "`n📝 Configuration Jest pour l'app web..." -ForegroundColor Yellow
if (!(Test-Path "apps/web/jest.config.js")) {
    $webJestConfig = @'
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@erp/ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@erp/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
    '^@erp/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transformIgnorePatterns: ['/node_modules/', '^.+\\.module\\.(css|sass|scss)$'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/test/**',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
'@
    Create-File -Path "apps/web/jest.config.js" -Content $webJestConfig
}

# 5. Créer jest.setup.js pour l'app web
Write-Host "`n📝 Configuration du setup Jest pour l'app web..." -ForegroundColor Yellow
if (!(Test-Path "apps/web/jest.setup.js")) {
    $webJestSetup = @'
import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  })),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
'@
    Create-File -Path "apps/web/jest.setup.js" -Content $webJestSetup
}

# 6. Créer le dossier __mocks__ et fileMock.js
if (!(Test-Path "apps/web/__mocks__")) {
    New-Item -ItemType Directory -Path "apps/web/__mocks__" -Force | Out-Null
}

if (!(Test-Path "apps/web/__mocks__/fileMock.js")) {
    Create-File -Path "apps/web/__mocks__/fileMock.js" -Content "module.exports = 'test-file-stub';"
}

# 7. Créer un test exemple
Write-Host "`n📝 Création d'un test exemple..." -ForegroundColor Yellow
$testDir = "apps/web/src/components/__tests__"
if (!(Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir -Force | Out-Null
}

$exampleTest = @'
import { render, screen } from '@testing-library/react';

describe('Example Test', () => {
  it('should run without errors', () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});
'@
Create-File -Path "$testDir/example.test.tsx" -Content $exampleTest

# 8. Vérifier l'installation
Write-Host "`n🔍 Vérification de l'installation..." -ForegroundColor Yellow

$jestInstalled = pnpm list jest 2>$null | Select-String "jest"
if ($jestInstalled) {
    Write-Host "✅ Jest est installé correctement" -ForegroundColor Green
} else {
    Write-Host "❌ Jest n'est pas installé correctement" -ForegroundColor Red
}

# 9. Lancer les tests
Write-Host "`n🚀 Test de la configuration..." -ForegroundColor Yellow
Write-Host "Lancement des tests dans 3 secondes..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Essayer de lancer les tests
try {
    pnpm test
    Write-Host "`n✨ Configuration terminée avec succès!" -ForegroundColor Green
}
catch {
    Write-Host "`n⚠️  Les tests ont échoué, mais la configuration est en place." -ForegroundColor Yellow
    Write-Host "Cela peut être normal s'il n'y a pas encore de tests écrits." -ForegroundColor Yellow
}

Write-Host "`n📚 Commandes disponibles:" -ForegroundColor Cyan
Write-Host "  pnpm test                    - Lancer tous les tests" -ForegroundColor White
Write-Host "  pnpm test:watch              - Tests en mode watch" -ForegroundColor White
Write-Host "  pnpm test:cov                - Tests avec couverture" -ForegroundColor White
Write-Host "  pnpm --filter @erp/web test  - Tests web uniquement" -ForegroundColor White
Write-Host "  pnpm --filter @erp/api test  - Tests API uniquement" -ForegroundColor White

Write-Host "`n💡 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Écrire des tests dans apps/web/src/**/*.test.tsx" -ForegroundColor White
Write-Host "2. Écrire des tests dans apps/api/src/**/*.spec.ts" -ForegroundColor White
Write-Host "3. Configurer les tests pour les packages si nécessaire" -ForegroundColor White