#!/usr/bin/env node

/**
 * 🔄 SCRIPT DE MIGRATION AUTOMATISÉ - TOPSTEEL ERP
 * Migration des imports de composants vers packages/ui unifiés
 * 
 * Phase 5: Nettoyage des doublons et mise à jour des imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration de migration
const MIGRATION_CONFIG = {
  baseDir: './apps/web/src',
  backupDir: './migration-backup',
  
  // Mappings des imports à remplacer
  importMappings: [
    // Button
    {
      from: "from '@/components/ui/button'",
      to: "from '@erp/ui/primitives'",
      components: ['Button', 'buttonVariants']
    },
    
    // Dialog
    {
      from: "from '@/components/ui/dialog'",
      to: "from '@erp/ui/primitives'", 
      components: [
        'Dialog', 'DialogPortal', 'DialogOverlay', 'DialogTrigger',
        'DialogClose', 'DialogContent', 'DialogHeader', 'DialogFooter',
        'DialogTitle', 'DialogDescription'
      ]
    },
    
    // DropdownMenu (2 versions)
    {
      from: "from '@/components/ui/dropdown-menu'",
      to: "from '@erp/ui/primitives'",
      components: [
        'DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent',
        'DropdownMenuItem', 'DropdownMenuSeparator', 'DropdownMenuLabel',
        'DropdownMenuShortcut', 'DropdownMenuGroup', 'DropdownMenuCheckboxItem',
        'DropdownMenuRadioGroup', 'DropdownMenuRadioItem', 'DropdownMenuSub',
        'DropdownMenuSubTrigger', 'DropdownMenuSubContent'
      ]
    },
    {
      from: "from '@/components/ui/dropdown-menu-fixed'",
      to: "from '@erp/ui/primitives'",
      components: [
        'DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent',
        'DropdownMenuItem', 'DropdownMenuSeparator', 'DropdownMenuLabel'
      ]
    },
    
    // Tooltip (3 versions)
    {
      from: "from '@/components/ui/tooltip-fixed'",
      to: "from '@erp/ui/primitives'",
      components: [
        'TooltipProvider', 'Tooltip', 'TooltipTrigger', 'TooltipContent', 'SimpleTooltip'
      ]
    },
    {
      from: "from '@/components/ui/tooltip-simple'",
      to: "from '@erp/ui/primitives'",
      components: [
        'TooltipProvider', 'Tooltip', 'TooltipTrigger', 'TooltipContent', 'SimpleTooltip'
      ]
    },
    {
      from: "from '@/components/ui/tooltip-portal'",
      to: "from '@erp/ui/primitives'",
      components: [
        'TooltipProvider', 'Tooltip', 'TooltipTrigger', 'TooltipContent', 'SimpleTooltip'
      ]
    }
  ],

  // Fichiers à supprimer après migration
  filesToDelete: [
    './apps/web/src/components/ui/button.tsx',
    './apps/web/src/components/ui/dialog.tsx',
    './apps/web/src/components/ui/dropdown-menu.tsx',
    './apps/web/src/components/ui/dropdown-menu-fixed.tsx',
    './apps/web/src/components/ui/tooltip-fixed.tsx',
    './apps/web/src/components/ui/tooltip-simple.tsx',
    './apps/web/src/components/ui/tooltip-portal.tsx'
  ]
};

// Utilitaires
function log(message, level = 'info') {
  const prefix = {
    info: '🔄',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[level];
  console.log(`${prefix} ${message}`);
}

function createBackup() {
  log('Création du backup de sécurité...');
  if (!fs.existsSync(MIGRATION_CONFIG.backupDir)) {
    fs.mkdirSync(MIGRATION_CONFIG.backupDir, { recursive: true });
  }
  
  // Backup des fichiers à supprimer
  MIGRATION_CONFIG.filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
      const backupPath = path.join(MIGRATION_CONFIG.backupDir, path.basename(file));
      fs.copyFileSync(file, backupPath);
      log(`Backup créé: ${backupPath}`, 'success');
    }
  });
}

function getAllTsxFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllTsxFiles(fullPath));
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function migrateImports() {
  log('Début de la migration des imports...');
  
  const files = getAllTsxFiles(MIGRATION_CONFIG.baseDir);
  let totalReplacements = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let fileChanged = false;
    
    MIGRATION_CONFIG.importMappings.forEach(mapping => {
      if (content.includes(mapping.from)) {
        content = content.replace(new RegExp(mapping.from, 'g'), mapping.to);
        fileChanged = true;
        totalReplacements++;
        log(`Import mis à jour dans: ${file.replace(MIGRATION_CONFIG.baseDir, '')}`, 'success');
      }
    });
    
    if (fileChanged) {
      fs.writeFileSync(file, content);
    }
  });
  
  log(`Migration terminée: ${totalReplacements} imports mis à jour`, 'success');
}

function deleteOldFiles() {
  log('Suppression des fichiers doublons...');
  
  MIGRATION_CONFIG.filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      log(`Fichier supprimé: ${file}`, 'success');
    } else {
      log(`Fichier introuvable: ${file}`, 'warning');
    }
  });
}

function runTypeCheck() {
  log('Vérification TypeScript en cours...');
  try {
    execSync('cd apps/web && npm run type-check', { stdio: 'inherit' });
    log('TypeScript check réussi!', 'success');
    return true;
  } catch (error) {
    log('Erreurs TypeScript détectées', 'error');
    return false;
  }
}

// Script principal
async function main() {
  try {
    log('🚀 Début de la migration Phase 5 - Nettoyage des doublons');
    
    // 1. Créer backup
    createBackup();
    
    // 2. Migrer les imports
    migrateImports();
    
    // 3. Supprimer les fichiers doublons
    deleteOldFiles();
    
    // 4. Vérification TypeScript
    const typesOk = runTypeCheck();
    
    if (typesOk) {
      log('✨ Migration Phase 5 terminée avec succès!', 'success');
      log('📋 Résumé:', 'info');
      log(`   - ${MIGRATION_CONFIG.filesToDelete.length} fichiers supprimés`);
      log(`   - Imports migrés vers @erp/ui/primitives`);
      log(`   - Backup disponible dans: ${MIGRATION_CONFIG.backupDir}`);
    } else {
      log('⚠️ Migration terminée avec des erreurs de types à corriger', 'warning');
    }
    
  } catch (error) {
    log(`Erreur durant la migration: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { MIGRATION_CONFIG, main };