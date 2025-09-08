// TypeScript compatibility fixes
// This file provides temporary type fixes for external libraries and complex type issues

// Note: Re-exports from @erp/domains are handled in the actual @erp/types module
// This declaration is removed to avoid export in module augmentation

declare module '@erp/domains' {
  // Add missing exports if needed
  export interface Permission {
    id: string
    code: string
    name: string
    description?: string
  }

  export interface Role {
    id: string
    code: string
    name: string
    permissions: Permission[]
  }
}

// Global type augmentations
declare global {
  interface Window {
    _nextOriginalFetch?: typeof fetch
  }
}

// Univer type fixes
declare module '@univerjs/core' {
  interface Univer {
    importExcel?: (buffer: ArrayBuffer | Uint8Array) => Promise<unknown>
    importFromBuffer?: (buffer: ArrayBuffer | Uint8Array) => Promise<unknown>
  }

  interface IWorkbookData {
    size?: number
    type?: string
    arrayBuffer?: () => Promise<ArrayBuffer>
  }
}

// Vite/Vitest compatibility
declare module 'vite' {
  // Type compatibility fixes
  interface DevEnvironment {
    // Add missing properties
  }
}

export {}
