// Simple dev server launcher for Windows
process.env.NODE_ENV = 'development';
require('ts-node').register({
  transpileOnly: true,
  project: './tsconfig.json'
});
require('tsconfig-paths/register');
require('./src/main');