#!/bin/bash
# Script Phase 2: Élimination des types 'any' explicites
# Objectif: Remplacer tous les 'any' par des types appropriés

echo "🚀 Phase 2: Élimination des types 'any'"
echo "========================================"

# 1. Script pour remplacer les Record<string, any>
echo "🔧 Création du script de remplacement des Record<string, any>..."
cat > fix-record-any.js << 'EOF'
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
});

const replacements = {
  'Record<string, any>': 'Record<string, unknown>',
  'Record<string,any>': 'Record<string, unknown>',
  ': any[]': ': unknown[]',
  'Array<any>': 'Array<unknown>',
  ': any;': ': unknown;',
  ': any)': ': unknown)',
  '<any>': '<unknown>',
  'as any': 'as unknown',
  'Promise<any>': 'Promise<unknown>'
};

let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  Object.entries(replacements).forEach(([from, to]) => {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, to);
      modified = true;
      totalReplacements += matches.length;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\nTotal replacements: ${totalReplacements}`);
EOF

# 2. Script pour créer des types spécifiques
echo "📝 Création des types métier spécifiques..."
cat > packages/types/src/common.types.ts << 'EOF'
// Types communs pour tout le projet

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

export type FormData = Record<string, unknown>;

export type EventHandler<T = Element> = (event: React.ChangeEvent<T>) => void;

export type SelectHandler = (value: string) => void;

export type CheckboxHandler = (checked: boolean) => void;

export type SubmitHandler<T = FormData> = (data: T) => void | Promise<void>;

export type AsyncFunction<T = void> = () => Promise<T>;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export type Metadata = Record<string, unknown>;

export type QueryParams = Record<string, string | string[] | undefined>;

export type Headers = Record<string, string>;

export type ErrorWithMessage = {
  message: string;
  code?: string;
  details?: unknown;
};
EOF

# 3. Script pour remplacer les 'any' dans les composants React
echo "🔨 Script de typage des composants React..."
cat > fix-react-components.js << 'EOF'
const fs = require('fs');
const glob = require('glob');

// Trouve tous les fichiers React
const files = glob.sync('apps/web/src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Patterns spécifiques React
  const patterns = [
    // Props any
    {
      from: /interface (\w+)Props {\n([^}]*): any;/g,
      to: 'interface $1Props {\n$2: unknown;'
    },
    // State any
    {
      from: /useState<any>/g,
      to: 'useState<unknown>'
    },
    // useRef any
    {
      from: /useRef<any>/g,
      to: 'useRef<HTMLElement>'
    },
    // Children any
    {
      from: /children: any/g,
      to: 'children: React.ReactNode'
    },
    // Style any
    {
      from: /style: any/g,
      to: 'style: React.CSSProperties'
    },
    // ClassName any
    {
      from: /className: any/g,
      to: 'className: string'
    }
  ];

  patterns.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed React types in: ${file}`);
  }
});
EOF

# 4. Script pour typer les API responses
echo "🌐 Typage des réponses API..."
cat > fix-api-responses.js << 'EOF'
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('apps/web/src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remplacer les fetch sans types
  content = content.replace(
    /const response = await fetch\(/g,
    'const response: Response = await fetch('
  );
  
  // Typer les .json()
  content = content.replace(
    /const data = await response\.json\(\)/g,
    'const data = await response.json() as unknown'
  );
  
  // Typer les axios responses
  content = content.replace(
    /\.then\(\(response\) =>/g,
    '.then((response: AxiosResponse) =>'
  );
  
  fs.writeFileSync(file, content);
});

console.log('API responses typed!');
EOF

# 5. Exécuter tous les scripts
echo "🔄 Exécution des corrections..."
node fix-record-any.js
node fix-react-components.js
node fix-api-responses.js

# 6. Supprimer les @ts-nocheck et @ts-ignore
echo "🧹 Suppression des directives @ts-nocheck et @ts-ignore..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" \
  -exec sed -i '/@ts-nocheck/d; /@ts-ignore/d' {} \;

# 7. Vérification
echo ""
echo "📊 Vérification de l'élimination des 'any'..."
echo "============================================"
echo "Remaining 'any' types:"
grep -r ": any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist | wc -l
echo "Remaining 'as any':"
grep -r "as any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist | wc -l
echo "Remaining Record<string, any>:"
grep -r "Record<string, any>" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist | wc -l

echo ""
echo "✅ Phase 2 terminée!"
echo "Prochaine étape: Exécuter ./scripts/fix-typescript-phase3.sh"