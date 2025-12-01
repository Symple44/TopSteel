/**
 * Spacing Tokens - TopSteel Design System
 * Espacements et dimensions
 */

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const

/**
 * Tailles sémantiques pour les composants
 */
export const componentSizes = {
  height: {
    xs: '1.5rem',   // 24px - h-6
    sm: '2rem',     // 32px - h-8
    md: '2.5rem',   // 40px - h-10
    lg: '3rem',     // 48px - h-12
    xl: '3.5rem',   // 56px - h-14
  },
  width: {
    xs: '4rem',     // 64px
    sm: '8rem',     // 128px
    md: '12rem',    // 192px
    lg: '16rem',    // 256px
    xl: '20rem',    // 320px
  },
} as const

/**
 * Largeurs de conteneurs
 */
export const containerWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * Dimensions du layout
 * @deprecated Use layoutTokens from './layout' instead
 * Kept for backwards compatibility
 */
export const layoutDimensions = {
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '64px',
  headerHeight: '56px',
  contentMaxWidth: '1400px',
} as const

export type Spacing = typeof spacing
export type ComponentSizes = typeof componentSizes
export type ContainerWidths = typeof containerWidths
export type LayoutDimensions = typeof layoutDimensions
