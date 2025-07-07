// packages/config/prettier/base.js - Configuration Prettier améliorée
module.exports = {
  // ===== FORMATAGE DE BASE =====
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  
  // ===== FORMATAGE AVANCÉ =====
  trailingComma: 'es5',
  printWidth: 80,
  proseWrap: 'always',
  
  // ===== FORMATAGE DES OBJETS =====
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  
  // ===== FORMATAGE DES FONCTIONS =====
  arrowParens: 'always',
  
  // ===== FORMATAGE MULTI-PLATEFORME =====
  endOfLine: 'lf',
  
  // ===== FORMATAGE EMBARQUÉ =====
  embeddedLanguageFormatting: 'auto',
  
  // ===== PLUGINS =====
  plugins: ['prettier-plugin-tailwindcss'],
  
  // ===== CONFIGURATION TAILWIND =====
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['cn', 'clsx', 'cva'],
  tailwindAttributes: ['className', 'class'],
  
  // ===== OVERRIDES POUR FICHIERS SPÉCIFIQUES =====
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve',
        printWidth: 100,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
}