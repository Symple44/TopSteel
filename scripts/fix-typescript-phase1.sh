#!/bin/bash
# Script Phase 1: Correction de la configuration TypeScript et erreurs de base
# Objectif: Résoudre 70% des erreurs (341 erreurs)

echo "🚀 Phase 1: Correction TypeScript - Configuration et erreurs de base"
echo "=================================================================="

# 1. Backup des fichiers importants
echo "📁 Création des backups..."
cp apps/web/tsconfig.json apps/web/tsconfig.json.backup
cp packages/ui/tsconfig.json packages/ui/tsconfig.json.backup

# 2. Correction des paths TypeScript dans apps/web
echo "🔧 Correction des paths TypeScript..."
cat > apps/web/tsconfig.paths.json << 'EOF'
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@erp/ui": ["../../packages/ui/src"],
      "@erp/ui/*": ["../../packages/ui/src/*"],
      "@erp/domains": ["../../packages/domains/src"],
      "@erp/domains/*": ["../../packages/domains/src/*"],
      "@erp/config": ["../../packages/config/src"],
      "@erp/config/*": ["../../packages/config/src/*"],
      "@erp/utilities": ["../../packages/utilities/src"],
      "@erp/utilities/*": ["../../packages/utilities/src/*"],
      "@erp/shared": ["../../packages/shared/src"],
      "@erp/shared/*": ["../../packages/shared/src/*"],
      "@erp/types": ["../../packages/types/src"],
      "@erp/types/*": ["../../packages/types/src/*"]
    }
  }
}
EOF

# 3. Script Node.js pour typer automatiquement les event handlers
echo "🔨 Création du script de correction des event handlers..."
cat > fix-event-handlers.js << 'EOF'
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns de remplacement pour les event handlers
const replacements = [
  // onChange handlers
  {
    pattern: /onChange=\{(\(e\)) => /g,
    replacement: 'onChange={(e: React.ChangeEvent<HTMLInputElement>) => '
  },
  {
    pattern: /onChange=\{(\(e\)) => /g,
    replacement: 'onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => '
  },
  // onValueChange handlers pour Select
  {
    pattern: /onValueChange=\{(\(value\)) => /g,
    replacement: 'onValueChange={(value: string) => '
  },
  // onCheckedChange handlers pour Checkbox
  {
    pattern: /onCheckedChange=\{(\(checked\)) => /g,
    replacement: 'onCheckedChange={(checked: boolean) => '
  },
  // onClick handlers
  {
    pattern: /onClick=\{(\(e\)) => /g,
    replacement: 'onClick={(e: React.MouseEvent<HTMLButtonElement>) => '
  },
  // onSubmit handlers
  {
    pattern: /onSubmit=\{(\(e\)) => /g,
    replacement: 'onSubmit={(e: React.FormEvent<HTMLFormElement>) => '
  }
];

// Fichiers à traiter
const files = glob.sync('apps/web/src/**/*.{tsx,ts}', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

console.log(`Processing ${files.length} files...`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log('Event handlers typing complete!');
EOF

# 4. Installer les dépendances nécessaires
echo "📦 Installation des dépendances..."
npm install -D glob

# 5. Exécuter le script de correction
echo "🔄 Application des corrections automatiques..."
node fix-event-handlers.js

# 6. Créer les types manquants dans l'API
echo "📝 Création des types manquants..."
mkdir -p apps/api/src/core/types
cat > apps/api/src/core/types/common.types.ts << 'EOF'
// Types communs pour l'API

export interface PricingContext {
  customerId?: string;
  productId?: string;
  quantity?: number;
  currency?: string;
  date?: Date;
  metadata?: Record<string, unknown>;
}

export interface EnrichedPricingContext extends PricingContext {
  [key: string]: unknown; // Index signature for dynamic properties
}

export interface ApiHeaders {
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  [key: string]: any; // Pour compatibilité legacy
}
EOF

# 7. Corriger l'erreur dans packages/domains
echo "🔧 Correction de packages/domains..."
cat > fix-domains.js << 'EOF'
const fs = require('fs');
const file = 'packages/domains/src/image/elasticsearch-service.ts';
const content = fs.readFileSync(file, 'utf8');

// Ajouter la propriété indexName
const classPattern = /export class ImageElasticsearchService {/;
const replacement = `export class ImageElasticsearchService {
  private readonly indexName = 'images';`;

const fixed = content.replace(classPattern, replacement);
fs.writeFileSync(file, fixed);
console.log('✅ Fixed packages/domains indexName');
EOF

node fix-domains.js

# 8. Vérification du résultat
echo ""
echo "📊 Vérification des corrections..."
echo "=================================="

# Compter les erreurs restantes
echo "Checking TypeScript errors in apps/web..."
cd apps/web && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"
cd ../..

echo "Checking TypeScript errors in apps/api..."
cd apps/api && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"
cd ../..

echo ""
echo "✅ Phase 1 terminée!"
echo "Prochaine étape: Exécuter ./scripts/fix-typescript-phase2.sh"