#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Configure Turborepo remote caching
 */
function setupTurboCache() {
  console.log('🚀 Setting up Turborepo remote cache...\n');
  
  const turboDir = path.join(__dirname, '..', '.turbo');
  
  // Create .turbo directory if it doesn't exist
  if (!fs.existsSync(turboDir)) {
    fs.mkdirSync(turboDir, { recursive: true });
    console.log('✅ Created .turbo directory');
  }
  
  // Check if we're in CI environment
  const isCI = process.env.CI === 'true';
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    console.log('📦 Detected Vercel environment');
    console.log('   Remote caching will be automatically configured by Vercel');
    return;
  }
  
  if (isCI) {
    console.log('🔧 CI environment detected');
    console.log('   Set TURBO_TOKEN and TURBO_TEAM environment variables for remote caching');
    return;
  }
  
  // Local development setup
  console.log('💻 Local development environment');
  console.log('\nTo enable remote caching:');
  console.log('1. Create an account at https://turbo.build');
  console.log('2. Run: npx turbo login');
  console.log('3. Run: npx turbo link');
  console.log('\nLocal caching is already enabled and configured.\n');
  
  // Show current cache statistics
  try {
    const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache', 'turbo');
    if (fs.existsSync(cacheDir)) {
      const stats = fs.statSync(cacheDir);
      console.log('📊 Cache statistics:');
      console.log(`   Location: ${cacheDir}`);
      console.log(`   Size: ${(getDirSize(cacheDir) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Last modified: ${stats.mtime.toLocaleString()}`);
    }
  } catch (error) {
    // Cache stats are optional
  }
  
  console.log('\n✨ Turborepo cache configuration complete!');
}

/**
 * Get directory size recursively
 */
function getDirSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return size;
}

// Run if called directly
if (require.main === module) {
  setupTurboCache();
}

module.exports = { setupTurboCache };