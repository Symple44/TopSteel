/**
 * Animation Tokens - TopSteel Design System
 * Durées et courbes d'animation
 */

export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '200ms',
  moderate: '300ms',
  slow: '500ms',
  slower: '700ms',
} as const

export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const

/**
 * Transitions prédéfinies
 */
export const transitions = {
  colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  shadow: 'box-shadow',
  transform: 'transform',
  all: 'all',
} as const

/**
 * Keyframes pour animations CSS
 * Ces noms correspondent aux animations définies dans globals.css
 */
export const keyframeNames = {
  accordionDown: 'accordion-down',
  accordionUp: 'accordion-up',
  fadeIn: 'fade-in',
  fadeOut: 'fade-out',
  slideIn: 'slide-in',
  slideOut: 'slide-out',
  scaleIn: 'scale-in',
  pulseGlow: 'pulse-glow',
  shimmer: 'shimmer',
  skeletonPulse: 'skeleton-pulse',
  slideUpAndFade: 'slideUpAndFade',
  slideDownAndFade: 'slideDownAndFade',
} as const

/**
 * Classes d'animation Tailwind prêtes à l'emploi
 */
export const animationClasses = {
  fadeIn: 'animate-in fade-in-0',
  fadeOut: 'animate-out fade-out-0',
  slideInFromTop: 'animate-in slide-in-from-top',
  slideInFromBottom: 'animate-in slide-in-from-bottom',
  slideInFromLeft: 'animate-in slide-in-from-left',
  slideInFromRight: 'animate-in slide-in-from-right',
  zoomIn: 'animate-in zoom-in-95',
  zoomOut: 'animate-out zoom-out-95',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
} as const

export const animations = {
  duration,
  easing,
  transitions,
  keyframeNames,
  animationClasses,
} as const

export type Duration = typeof duration
export type Easing = typeof easing
export type Animations = typeof animations
