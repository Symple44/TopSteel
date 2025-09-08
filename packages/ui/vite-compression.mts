import { writeFileSync } from 'node:fs'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import type { Plugin } from 'vite'

export function compressionPlugin(): Plugin {
  return {
    name: 'compression',
    writeBundle(options, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName]
        let content: string | Uint8Array

        if (chunk.type === 'chunk') {
          content = chunk.code
        } else if (chunk.type === 'asset') {
          content = chunk.source
        } else {
          continue
        }

        const filePath = `${options.dir}/${fileName}`

        // Create gzip version
        if (typeof content === 'string') {
          const gzipped = gzipSync(content)
          writeFileSync(`${filePath}.gz`, gzipped)

          // Create brotli version
          const brotli = brotliCompressSync(content)
          writeFileSync(`${filePath}.br`, brotli)
        } else if (content instanceof Uint8Array) {
          const gzipped = gzipSync(content)
          writeFileSync(`${filePath}.gz`, gzipped)

          const brotli = brotliCompressSync(content)
          writeFileSync(`${filePath}.br`, brotli)
        }
      }
    },
  }
}
