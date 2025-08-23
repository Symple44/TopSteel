const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Building @erp/ui package with proper type exports...');

// Step 1: Clean dist folder
console.log('📦 Cleaning dist folder...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Step 2: Run tsup for JavaScript files
console.log('🚀 Building JavaScript files...');
execSync('pnpm tsup', { stdio: 'inherit' });

// Step 3: Generate proper TypeScript declarations using tsc
console.log('📝 Generating TypeScript declarations...');
execSync('pnpm tsc --emitDeclarationOnly --declaration --declarationMap false --outDir dist', { stdio: 'inherit' });

// Step 4: Fix the main index.d.ts to properly export Button and other components
console.log('✨ Fixing type exports...');
const indexDtsPath = path.join('dist', 'index.d.ts');
if (fs.existsSync(indexDtsPath)) {
  let content = fs.readFileSync(indexDtsPath, 'utf-8');
  
  // Ensure Button is properly exported
  if (!content.includes('export { Button }')) {
    // Add proper exports at the end
    const properExports = `
// Ensure proper named exports for critical components
export { Button } from './components/primitives/button/Button';
export type { ButtonProps } from './components/primitives/button/Button';
`;
    content += properExports;
    fs.writeFileSync(indexDtsPath, content);
  }
}

console.log('✅ Build completed successfully!');