/**
 * Layout Tokens - TopSteel Design System
 * Dimensions centralisées pour le layout de l'application
 */

export const layoutTokens = {
  sidebar: {
    width: '260px',
    collapsedWidth: '64px',
    mobileBreakpoint: '768px',
  },
  header: {
    height: '56px',
  },
  content: {
    maxWidth: '1400px',
    padding: '1rem',
    paddingLg: '1.5rem',
  },
  container: {
    center: true,
    padding: '2rem',
    screens2xl: '1400px',
  },
} as const;

export type LayoutTokens = typeof layoutTokens;

// CSS Variables pour injection
export const layoutCSSVariables = {
  '--sidebar-width': layoutTokens.sidebar.width,
  '--sidebar-collapsed-width': layoutTokens.sidebar.collapsedWidth,
  '--header-height': layoutTokens.header.height,
  '--content-max-width': layoutTokens.content.maxWidth,
} as const;
