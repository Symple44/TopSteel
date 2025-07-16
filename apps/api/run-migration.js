const { exec } = require('child_process');
const path = require('path');

// Set NODE_ENV to production to avoid TypeScript compilation issues
process.env.NODE_ENV = 'production';

// Run the migration using the compiled JavaScript
exec('node -r ts-node/register -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d typeorm.config.ts', {
  cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: '--experimental-specifier-resolution=node' }
}, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  console.log(`Stdout: ${stdout}`);
});