const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

// Fonction pour exécuter Biome
async function runBiome() {
  try {
    console.log('🔧 Running Biome check...')
    const { stdout, stderr } = await execAsync('npx biome check src/ --reporter=summary')
    if (stderr && !stderr.includes('warnings')) {
      console.error('❌ Biome found issues:')
      console.error(stderr)
      process.exit(1)
    }
    console.log('✅ Biome check passed')
  } catch (error) {
    console.error('❌ Biome check failed:', error.message)
    process.exit(1)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exécuter Biome avant le build
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Exécuter Biome seulement en production
      // runBiome() // Décommentez pour activer
    }
    return config
  },
  // SUPPRIMÉ: transpilePackages (cause le problème)
  // Next.js doit utiliser les packages buildés, pas les sources
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  webpack: (config) => {
    config.resolve.symlinks = false
    return config
  },
  
  images: {
    formats: ['image/avif', 'image/webp']
  },
  
  eslint: { ignoreDuringBuilds: true }
}

module.exports = nextConfig



