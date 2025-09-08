// Global TypeScript fixes for external libraries and complex issues

declare module 'next/server' {
  interface NextRequest {
    pathname?: string
    nextUrl?: {
      pathname?: string
    }
  }
}

declare module 'next/headers' {
  function headers(): {
    get(key: string): string | null
  }
}

// Fix for ui-components conflicts - single declaration to avoid duplicates
declare module '@/lib/ui-components-complete' {
  const DataTable: React.ComponentType<unknown>
  export { DataTable }
}

declare module '@/lib/ui-exports' {
  const DataTable: React.ComponentType<unknown>
  export { DataTable }
}

// Vite compatibility
declare module 'vite' {
  interface DevEnvironment {
    pluginContainer?: {
      buildStart?: (options: unknown) => void | Promise<void>
      resolveId?: (id: string, importer?: string) => string | null | Promise<string | null>
      [key: string]: unknown
    }
  }
}

declare module 'vitest/config' {
  interface DevEnvironment {
    pluginContainer?: {
      buildStart?: (options: unknown) => void | Promise<void>
      resolveId?: (id: string, importer?: string) => string | null | Promise<string | null>
      [key: string]: unknown
    }
  }
}

export {}
