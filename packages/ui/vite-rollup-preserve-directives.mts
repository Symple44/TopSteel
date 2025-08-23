import type { Plugin } from 'rollup'

export function preserveUseClientDirective(): Plugin {
  return {
    name: 'preserve-use-client',
    
    renderChunk(code: string, chunk, options) {
      // Add 'use client' to all chunks since they contain React components with hooks
      // Skip if already present
      if (!code.startsWith('"use client"') && !code.startsWith("'use client'")) {
        return {
          code: '"use client";\n' + code,
          map: null
        }
      }
      
      return null
    }
  }
}