import type { Plugin, OutputOptions, NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup'

export function preserveUseClientDirective(): Plugin {
  return {
    name: 'preserve-use-client',

    // Use generateBundle which runs after all other processing including minification
    generateBundle(_options: NormalizedOutputOptions, bundle: OutputBundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          const outputChunk = chunk as OutputChunk
          // Add 'use client' directive at the very beginning
          if (!outputChunk.code.startsWith('"use client"') && !outputChunk.code.startsWith("'use client'")) {
            outputChunk.code = `"use client";\n${outputChunk.code}`
          }
        }
      }
    },
  }
}
