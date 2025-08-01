#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script pour vérifier que les corrections d'imports fonctionnent
 */

class FixVerifier {
  constructor() {
    this.results = {
      compilation: null,
      linting: null,
      warnings: [],
      errors: []
    };
  }

  async run() {
    console.log('🔍 Vérification des corrections d\'imports...');
    console.log('='.repeat(50));

    // Vérifier que le projet compile
    await this.checkCompilation();
    
    // Vérifier le linting si disponible
    await this.checkLinting();

    // Résumé final
    this.printSummary();
  }

  /**
   * Vérifier la compilation TypeScript
   */
  async checkCompilation() {
    console.log('📦 Vérification de la compilation TypeScript...');
    
    try {
      const compileResult = await this.runCommand('npx', ['tsc', '--noEmit'], {
        cwd: 'D:\\GitHub\\TopSteel\\apps\\api'
      });
      
      if (compileResult.success) {
        console.log('✅ Compilation TypeScript réussie');
        this.results.compilation = 'success';
      } else {
        console.log('❌ Erreurs de compilation TypeScript :');
        console.log(compileResult.stderr);
        this.results.compilation = 'error';
        this.results.errors.push('Erreurs de compilation TypeScript');
      }
    } catch (error) {
      console.log('⚠️  Impossible de vérifier la compilation :', error.message);
      this.results.compilation = 'skipped';
      this.results.warnings.push('Vérification de compilation ignorée');
    }
  }

  /**
   * Vérifier le linting
   */
  async checkLinting() {
    console.log('🔍 Vérification du linting...');
    
    try {
      // Vérifier si ESLint est disponible
      const packageJsonPath = path.join('D:\\GitHub\\TopSteel', 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.devDependencies?.eslint || packageJson.dependencies?.eslint) {
          const lintResult = await this.runCommand('npx', ['eslint', 'apps/api/src', '--ext', '.ts', '--format', 'compact'], {
            cwd: 'D:\\GitHub\\TopSteel'
          });
          
          if (lintResult.success) {
            console.log('✅ Linting réussi');
            this.results.linting = 'success';
          } else {
            console.log('⚠️  Avertissements de linting :');
            console.log(lintResult.stdout);
            this.results.linting = 'warnings';
            this.results.warnings.push('Avertissements de linting');
          }
        } else {
          console.log('ℹ️  ESLint non configuré - linting ignoré');
          this.results.linting = 'skipped';
        }
      }
    } catch (error) {
      console.log('⚠️  Impossible de vérifier le linting :', error.message);
      this.results.linting = 'skipped';
      this.results.warnings.push('Vérification de linting ignorée');
    }
  }

  /**
   * Exécuter une commande et retourner le résultat
   */
  runCommand(command, args, options = {}) {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr,
        });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          code: -1,
          stdout,
          stderr: error.message,
        });
      });
    });
  }

  /**
   * Afficher le résumé final
   */
  printSummary() {
    console.log('');
    console.log('📊 RÉSUMÉ DES VÉRIFICATIONS');
    console.log('='.repeat(50));
    
    // Statut de compilation
    const compileIcon = this.results.compilation === 'success' ? '✅' : 
                       this.results.compilation === 'error' ? '❌' : '⚠️';
    console.log(`${compileIcon} Compilation TypeScript: ${this.results.compilation || 'non vérifiée'}`);
    
    // Statut de linting
    const lintIcon = this.results.linting === 'success' ? '✅' : 
                    this.results.linting === 'warnings' ? '⚠️' :
                    this.results.linting === 'error' ? '❌' : 'ℹ️';
    console.log(`${lintIcon} Linting: ${this.results.linting || 'non vérifié'}`);

    console.log('');

    if (this.results.warnings.length > 0) {
      console.log('⚠️  AVERTISSEMENTS:');
      this.results.warnings.forEach(warning => console.log(`   • ${warning}`));
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ ERREURS:');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
      console.log('');
    }

    // Conclusion
    if (this.results.compilation === 'success') {
      console.log('🎉 Toutes les corrections d\'imports ont été appliquées avec succès !');
      console.log('💡 Votre application NestJS devrait maintenant fonctionner correctement.');
    } else if (this.results.compilation === 'error') {
      console.log('🚨 Il y a encore des erreurs de compilation à résoudre.');
      console.log('🔧 Vérifiez les erreurs ci-dessus et corrigez-les manuellement.');
    } else {
      console.log('ℹ️  Les corrections ont été appliquées.');
      console.log('💡 Testez manuellement votre application pour vous assurer qu\'elle fonctionne.');
    }
  }
}

// Exécution du script
const verifier = new FixVerifier();
verifier.run().catch(console.error);