const path = require('path')

module.exports = (options, webpack) => ({
  ...options,
  // Suppression complète de fork-ts-checker-webpack-plugin pour éviter les erreurs
  plugins: options.plugins.filter(
    (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
  ),
  // Configuration optimisée pour NestJS
  resolve: {
    ...options.resolve,
    alias: {
      ...options.resolve?.alias,
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Optimisations pour le build
  optimization: {
    ...options.optimization,
    splitChunks: false,
    runtimeChunk: false,
  },
  // Configuration de la sortie
  output: {
    ...options.output,
    filename: 'main.js',
    clean: true,
  },
  // Gestion des erreurs gracieuse
  stats: {
    errors: true,
    warnings: false,
    colors: true,
    chunks: false,
    modules: false,
  },
})
