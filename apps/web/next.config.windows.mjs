import baseConfig from './next.config.mjs'

/** @type {import('next').NextConfig} */
const windowsConfig = {
  ...baseConfig,
  // Configuration spécifique pour Windows avec optimisation mémoire
  webpack: (config, { dev, isServer }) => {
    // Appeler la config webpack de base si elle existe
    if (baseConfig.webpack) {
      config = baseConfig.webpack(config, { dev, isServer })
    }

    // Optimisations mémoire pour Windows
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**']
      }

      // Désactiver le cache en développement pour économiser la mémoire
      config.cache = false
    }

    // Limiter le nombre de workers
    if (config.optimization) {
      config.optimization.minimize = false
    }

    return config
  },
  
  // Désactiver certaines fonctionnalités gourmandes en mémoire
  experimental: {
    ...baseConfig.experimental,
    // Désactiver le type checking pendant le build (on le fait séparément)
    typedRoutes: false,
    // Réduire la taille du bundle
    optimizeCss: false,
  },
  
  // Réduire le nombre de pages pré-rendues
  staticPageGenerationTimeout: 60,
}

export default windowsConfig