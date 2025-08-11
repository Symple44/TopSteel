#!/usr/bin/env node

/**
 * Script pour améliorer les types TypeScript et réduire les violations 'noExplicitAny'
 * Usage: node scripts/typescript-improvements.js [--analyze|--apply]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mode = process.argv[2] || '--analyze'
const APPLY_CHANGES = mode === '--apply'

// Types courants pour remplacer 'as any'
const commonTypes = {
  // Types pour les objets Request NestJS
  nestjsRequest: `interface EnhancedRequest {
  user?: {
    id: string;
    sub: string;
    email: string;
    globalRole?: string;
    role?: string;
  };
  tenant?: {
    societeId: string;
    userSocieteInfo?: any;
  };
  params?: Record<string, string>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, string | string[]>;
}`,

  // Types pour TypeORM metadata
  typeormMetadata: `interface EntityMetadata {
  historique?: Array<{
    date: Date;
    utilisateur: string;
    champ: string;
    ancienneValeur: unknown;
    nouvelleValeur: unknown;
  }>;
  [key: string]: unknown;
}`,

  // Types pour les responses HTTP
  httpResponse: `interface EnhancedResponse {
  writeHead: (statusCode: number, statusMessage?: string, headers?: Record<string, string>) => void;
  setHeader: (name: string, value: string) => void;
  [key: string]: unknown;
}`,

  // Types pour les configurations
  configObject: `interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  [key: string]: unknown;
}`,
}

/**
 * Patterns de remplacement pour les 'as any' les plus courants
 */
const replacementPatterns = [
  {
    pattern: /(request as any)/g,
    replacement: '(request as EnhancedRequest)',
    requiredInterface: 'nestjsRequest',
    description: 'Request objects dans NestJS',
  },
  {
    pattern: /(res as any)/g,
    replacement: '(res as EnhancedResponse)',
    requiredInterface: 'httpResponse',
    description: 'Response objects HTTP',
  },
  {
    pattern: /(this\.metadonnees as any)/g,
    replacement: '(this.metadonnees as EntityMetadata)',
    requiredInterface: 'typeormMetadata',
    description: 'Metadata TypeORM entities',
  },
  {
    pattern: /(config as any)/g,
    replacement: '(config as DatabaseConfig)',
    requiredInterface: 'configObject',
    description: 'Configuration objects',
  },
  {
    pattern: /(result as any)\.data/g,
    replacement: '(result as { data?: T }).data',
    requiredInterface: null,
    description: 'Generic result objects',
  },
  {
    pattern: /(\w+ as any)\.(\w+)/g,
    replacement: '($1 as Record<string, unknown>).$2',
    requiredInterface: null,
    description: 'Generic object property access',
  },
]

/**
 * Analyse un fichier pour détecter les violations 'as any'
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const anyMatches = content.match(/ as any/g)

  if (!anyMatches) return null

  const analysis = {
    file: filePath,
    violations: anyMatches.length,
    patterns: {},
    suggestions: [],
  }

  // Analyser les patterns
  replacementPatterns.forEach(({ pattern, description, replacement }) => {
    const matches = content.match(pattern)
    if (matches) {
      analysis.patterns[description] = matches.length
      analysis.suggestions.push({
        description,
        replacement,
        count: matches.length,
      })
    }
  })

  return analysis
}

/**
 * Applique les améliorations à un fichier
 */
function improveFile(filePath, _analysis) {
  let content = fs.readFileSync(filePath, 'utf8')
  let hasChanges = false
  const interfacesToAdd = new Set()

  // Appliquer les remplacements
  replacementPatterns.forEach(({ pattern, replacement, requiredInterface, description }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement)
      hasChanges = true

      if (requiredInterface) {
        interfacesToAdd.add(requiredInterface)
      }
    }
  })

  // Ajouter les interfaces nécessaires au début du fichier
  if (interfacesToAdd.size > 0) {
    const imports = content.match(/^import.*$/gm) || []
    const lastImportIndex =
      imports.length > 0
        ? content.lastIndexOf(imports[imports.length - 1]) + imports[imports.length - 1].length
        : 0

    const interfacesCode = Array.from(interfacesToAdd)
      .map(
        (key) => `\n// Types ajoutés pour améliorer la sécurité TypeScript\n${commonTypes[key]}\n`
      )
      .join('')

    content = content.slice(0, lastImportIndex) + interfacesCode + content.slice(lastImportIndex)
    hasChanges = true
  }

  if (hasChanges && APPLY_CHANGES) {
    fs.writeFileSync(filePath, content, 'utf8')
  }

  return hasChanges
}

/**
 * Trouve les fichiers avec le plus de violations
 */
function findWorstFiles() {
  const files = []
  const searchDirs = ['./apps', './packages']

  function searchDir(dir) {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        searchDir(fullPath)
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        const analysis = analyzeFile(fullPath)
        if (analysis) {
          files.push(analysis)
        }
      }
    }
  }

  searchDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      searchDir(dir)
    }
  })

  return files.sort((a, b) => b.violations - a.violations)
}

/**
 * Script principal
 */
function main() {
  const worstFiles = findWorstFiles()
  const _totalViolations = worstFiles.reduce((sum, f) => sum + f.violations, 0)
  worstFiles.slice(0, 10).forEach((file, _index) => {
    const _relativePath = path.relative('.', file.file)

    // Afficher les patterns les plus fréquents
    Object.entries(file.patterns).forEach(([_pattern, _count]) => {})
  })

  if (APPLY_CHANGES) {
    worstFiles.slice(0, 5).forEach((analysis, _index) => {
      const _relativePath = path.relative('.', analysis.file)

      const improved = improveFile(analysis.file, analysis)
      if (improved) {
      } else {
      }
    })
  }

  if (!APPLY_CHANGES) {
  }
}

// Exécution du script
main()

export { analyzeFile, improveFile, replacementPatterns }
