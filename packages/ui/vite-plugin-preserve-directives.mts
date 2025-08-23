import type { Plugin } from 'vite'

export function preserveDirectives(): Plugin {
  return {
    name: 'preserve-use-client',
    
    transform(code: string, id: string) {
      if (!id.endsWith('.tsx') && !id.endsWith('.ts')) {
        return null
      }
      
      // Check if the file starts with 'use client'
      const hasUseClient = code.trimStart().startsWith("'use client'") || 
                          code.trimStart().startsWith('"use client"')
      
      if (!hasUseClient) {
        return null
      }
      
      // For modules with 'use client', ensure it's preserved in output
      return {
        code,
        map: null
      }
    },
    
    renderChunk(code: string, chunk) {
      // Check if any of the modules in this chunk had 'use client'
      const moduleIds = Object.keys(chunk.modules)
      const needsUseClient = moduleIds.some(id => {
        const moduleInfo = this.getModuleInfo(id)
        if (!moduleInfo) return false
        return moduleInfo.meta?.useClient === true
      })
      
      if (needsUseClient && !code.startsWith("'use client'")) {
        return "'use client';\n" + code
      }
      
      return null
    },
    
    moduleParsed(moduleInfo) {
      // Store metadata about modules that have 'use client'
      if (moduleInfo.code?.trimStart().startsWith("'use client'") || 
          moduleInfo.code?.trimStart().startsWith('"use client"')) {
        moduleInfo.meta = { ...moduleInfo.meta, useClient: true }
      }
    }
  }
}