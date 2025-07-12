const { exec } = require('node:child_process')
const { promisify } = require('node:util')
const execAsync = promisify(exec)

// Fonction pour exécuter Biome
async function runBiome() {
  try {
    const { stdout, stderr } = await execAsync('npx biome check src/ --reporter=summary')
    if (stderr && !stderr.includes('warnings')) {
      console.error('❌ Biome found issues:')
      console.error(stderr)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Biome check failed:', error.message)
    process.exit(1)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SUPPRIMÉ: transpilePackages (cause le problème)
  // Next.js doit utiliser les packages buildés, pas les sources

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  webpack: (config) => {
    config.resolve.symlinks = false
    return config
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
