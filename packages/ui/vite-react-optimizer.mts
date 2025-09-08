import type { Plugin } from 'vite'

export function reactOptimizer(): Plugin {
  return {
    name: 'react-optimizer',
    transform(code, id) {
      // Skip non-React files
      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return null
      }

      let transformedCode = code

      // Remove development-only code in production
      if (process.env.NODE_ENV === 'production') {
        // Remove displayName assignments (dev only)
        transformedCode = transformedCode.replace(
          /.*\.displayName\s*=\s*['"][^'"]*['"];?\s*\n?/g,
          ''
        )

        // Remove PropTypes (dev only)
        transformedCode = transformedCode.replace(/.*\.propTypes\s*=\s*{[\s\S]*?};?\s*\n?/g, '')

        // Remove console.log statements in production
        transformedCode = transformedCode.replace(
          /console\.(log|debug|info|warn|error)\([^)]*\);?\s*\n?/g,
          ''
        )
      }

      // Only return if we actually transformed something
      if (transformedCode !== code) {
        return {
          code: transformedCode,
          map: null,
        }
      }

      return null
    },
  }
}
