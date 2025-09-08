// Configuration pour analyser et optimiser les bundles
module.exports = {
  analyzeServer: ['server', 'both'].includes(process.env.BUNDLE_ANALYZE),
  analyzeBrowser: ['browser', 'both'].includes(process.env.BUNDLE_ANALYZE),

  // Options d'analyse avancées
  bundleAnalyzerConfig: {
    server: {
      analyzerMode: 'static',
      reportFilename: '../../bundle-analysis/server.html',
      defaultSizes: 'parsed',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: '../../bundle-analysis/server-stats.json',
    },
    browser: {
      analyzerMode: 'static',
      reportFilename: '../../bundle-analysis/client.html',
      defaultSizes: 'gzip',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: '../../bundle-analysis/client-stats.json',
    },
  },

  // Seuils de taille pour alerter
  performanceBudget: {
    bundles: [
      {
        name: 'main',
        maxSize: '150kb',
      },
      {
        name: 'framework',
        maxSize: '100kb',
      },
      {
        name: 'vendor',
        maxSize: '200kb',
      },
    ],
    // Taille totale maximale
    maxTotalSize: '1.5mb',
  },
}

// Pour utiliser:
// ANALYZE=true pnpm build
// ou
// BUNDLE_ANALYZE=browser pnpm build
