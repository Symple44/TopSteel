#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour corriger automatiquement les imports 'type' problématiques dans NestJS
 * 
 * Problème : les imports 'import type { Service }' ne peuvent pas être injectés par NestJS
 * Solution : convertir en 'import { Service }' quand le type est utilisé dans un constructeur
 */

class ImportTypeFixer {
  constructor(rootDir = 'D:\\GitHub\\TopSteel\\apps\\api\\src') {
    this.rootDir = rootDir;
    this.fixedFiles = [];
    this.stats = {
      filesProcessed: 0,
      filesFixed: 0,
      importsFixed: 0,
      errors: 0
    };
  }

  /**
   * Point d'entrée principal
   */
  async run() {
    console.log('🔧 Correction des imports type problématiques...');
    console.log(`📁 Répertoire de travail: ${this.rootDir}`);
    console.log('');

    try {
      const files = await this.findTypeScriptFiles();
      console.log(`📋 ${files.length} fichiers TypeScript trouvés`);
      console.log('');

      for (const filePath of files) {
        await this.processFile(filePath);
      }

      this.printSummary();
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution:', error.message);
      process.exit(1);
    }
  }

  /**
   * Trouver tous les fichiers TypeScript récursivement
   */
  async findTypeScriptFiles() {
    const files = [];
    
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Ignorer certains dossiers
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };

    walk(this.rootDir);
    return files;
  }

  /**
   * Traiter un fichier individuel
   */
  async processFile(filePath) {
    this.stats.filesProcessed++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixed = this.fixImportsInContent(content, filePath);
      
      if (fixed.hasChanges) {
        fs.writeFileSync(filePath, fixed.content, 'utf8');
        this.fixedFiles.push({
          path: filePath,
          fixes: fixed.fixes
        });
        this.stats.filesFixed++;
        this.stats.importsFixed += fixed.fixes.length;
        
        console.log(`✅ ${path.relative(this.rootDir, filePath)}`);
        fixed.fixes.forEach(fix => {
          console.log(`   📝 ${fix.description}`);
        });
        console.log('');
      }
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Erreur dans ${filePath}:`, error.message);
    }
  }

  /**
   * Corriger les imports dans le contenu d'un fichier
   */
  fixImportsInContent(content, filePath) {
    const lines = content.split('\n');
    const fixes = [];
    let hasChanges = false;

    // Extraire les imports type et les classes/interfaces utilisées dans les constructeurs
    const typeImports = this.extractTypeImports(lines);
    const constructorUsages = this.extractConstructorUsages(lines);
    const methodUsages = this.extractMethodParameterUsages(lines);
    
    // Combinaison des usages dans constructeurs et paramètres de méthodes
    const allUsages = [...new Set([...constructorUsages, ...methodUsages])];

    // Corriger les imports problématiques
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Détecter les imports type (plusieurs formats possibles)
      if (this.isTypeImportLine(line)) {
        const correctedLine = this.correctTypeImportLine(lines[i], allUsages, filePath);
        if (correctedLine.content !== lines[i]) {
          lines[i] = correctedLine.content;
          hasChanges = true;
          fixes.push(correctedLine.fix);
        }
      }
    }

    return {
      content: lines.join('\n'),
      hasChanges,
      fixes
    };
  }

  /**
   * Vérifier si une ligne contient un import type
   */
  isTypeImportLine(line) {
    return (
      line.includes('import type {') ||
      line.includes('import { type ') ||
      (line.includes('import type') && line.includes('from'))
    );
  }

  /**
   * Extraire tous les imports type d'un fichier
   */
  extractTypeImports(lines) {
    const imports = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (this.isTypeImportLine(trimmed)) {
        imports.push(trimmed);
      }
    }
    
    return imports;
  }

  /**
   * Extraire les types utilisés dans les constructeurs (injection de dépendance)
   */
  extractConstructorUsages(lines) {
    const usages = new Set();
    let inConstructor = false;
    let braceCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Détecter le début du constructeur
      if (trimmed.includes('constructor(')) {
        inConstructor = true;
        braceCount = 0;
      }
      
      if (inConstructor) {
        // Compter les accolades pour savoir quand on sort du constructeur
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        // Extraire les types utilisés dans les paramètres du constructeur
        const matches = trimmed.match(/:\s*([A-Z][a-zA-Z0-9_<>]+)/g);
        if (matches) {
          matches.forEach(match => {
            const type = match.replace(/:\s*/, '').replace(/[<>].*/, ''); // Enlever les génériques
            usages.add(type);
          });
        }
        
        // Sortir du constructeur quand toutes les accolades sont fermées
        if (braceCount <= 0 && trimmed.includes('}')) {
          inConstructor = false;
        }
      }
    }

    return Array.from(usages);
  }

  /**
   * Extraire les types utilisés dans les paramètres de méthodes
   */
  extractMethodParameterUsages(lines) {
    const usages = new Set();
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Détecter les méthodes avec des paramètres typés
      if (trimmed.includes('(') && trimmed.includes(':') && 
          (trimmed.includes('async ') || trimmed.includes('public ') || 
           trimmed.includes('private ') || trimmed.includes('protected ') ||
           trimmed.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(/))) {
        
        const matches = trimmed.match(/:\s*([A-Z][a-zA-Z0-9_<>]+)/g);
        if (matches) {
          matches.forEach(match => {
            const type = match.replace(/:\s*/, '').replace(/[<>].*/, ''); // Enlever les génériques
            usages.add(type);
          });
        }
      }
    }

    return Array.from(usages);
  }

  /**
   * Corriger une ligne d'import type
   */
  correctTypeImportLine(line, usages, filePath) {
    const originalLine = line;
    let correctedLine = line;
    const fixes = [];

    // Format 1: import type { Type1, Type2 } from 'module'
    const typeImportMatch = line.match(/import type\s*\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/);
    if (typeImportMatch) {
      const importedTypes = typeImportMatch[1].split(',').map(t => t.trim());
      const modulePath = typeImportMatch[2];
      
      const typesToConvert = importedTypes.filter(type => {
        const cleanType = type.replace(/\s+as\s+\w+/, ''); // Enlever les alias
        return usages.includes(cleanType);
      });
      
      if (typesToConvert.length > 0) {
        // Convertir seulement les types utilisés dans le constructeur
        const remainingTypes = importedTypes.filter(type => {
          const cleanType = type.replace(/\s+as\s+\w+/, '');
          return !usages.includes(cleanType);
        });
        
        let newImportLine = '';
        
        if (typesToConvert.length > 0) {
          newImportLine += `import { ${typesToConvert.join(', ')} } from '${modulePath}'`;
        }
        
        if (remainingTypes.length > 0) {
          if (newImportLine) newImportLine += '\n';
          const indentation = line.match(/^(\s*)/)[1];
          newImportLine += `${indentation}import type { ${remainingTypes.join(', ')} } from '${modulePath}'`;
        }
        
        correctedLine = newImportLine;
        fixes.push({
          description: `Converti 'import type' en 'import' pour: ${typesToConvert.join(', ')}`
        });
      }
    }

    // Format 2: import { type Type1, Type2, type Type3 } from 'module'
    const mixedImportMatch = line.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/);
    if (mixedImportMatch) {
      const imports = mixedImportMatch[1].split(',').map(imp => imp.trim());
      const modulePath = mixedImportMatch[2];
      
      const correctedImports = imports.map(imp => {
        if (imp.startsWith('type ')) {
          const typeName = imp.replace('type ', '');
          if (usages.includes(typeName)) {
            fixes.push({
              description: `Supprimé 'type' de l'import: ${typeName}`
            });
            return typeName;
          }
        }
        return imp;
      });
      
      if (fixes.length > 0) {
        const indentation = line.match(/^(\s*)/)[1];
        correctedLine = `${indentation}import { ${correctedImports.join(', ')} } from '${modulePath}'`;
      }
    }

    return {
      content: correctedLine,
      fix: fixes.length > 0 ? fixes[0] : null
    };
  }

  /**
   * Afficher le résumé des corrections
   */
  printSummary() {
    console.log('📊 RÉSUMÉ DES CORRECTIONS');
    console.log('=' .repeat(50));
    console.log(`📄 Fichiers traités: ${this.stats.filesProcessed}`);
    console.log(`✅ Fichiers corrigés: ${this.stats.filesFixed}`);
    console.log(`🔧 Imports corrigés: ${this.stats.importsFixed}`);
    console.log(`❌ Erreurs: ${this.stats.errors}`);
    console.log('');

    if (this.fixedFiles.length > 0) {
      console.log('📋 FICHIERS MODIFIÉS:');
      console.log('-'.repeat(50));
      this.fixedFiles.forEach(file => {
        console.log(`📁 ${path.relative(this.rootDir, file.path)}`);
        file.fixes.forEach(fix => {
          console.log(`   • ${fix.description}`);
        });
        console.log('');
      });
    }

    if (this.stats.filesFixed > 0) {
      console.log('🎉 Toutes les corrections ont été appliquées avec succès !');
      console.log('💡 N\'oubliez pas de vérifier que votre application compile correctement.');
    } else {
      console.log('ℹ️  Aucune correction nécessaire trouvée.');
    }
  }
}

// Exécution du script
const currentFile = fileURLToPath(import.meta.url);
const executeFile = process.argv[1];

if (currentFile === executeFile) {
  const rootDir = process.argv[2] || 'D:\\GitHub\\TopSteel\\apps\\api\\src';
  const fixer = new ImportTypeFixer(rootDir);
  fixer.run().catch(console.error);
}

export default ImportTypeFixer;