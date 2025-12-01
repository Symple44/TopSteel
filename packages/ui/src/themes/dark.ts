/**
 * Dark Theme - TopSteel Design System
 * Thème sombre moderne
 */

import type { ThemeConfig } from './types'

export const darkTheme: ThemeConfig = {
  name: 'dark',
  displayName: 'Sombre',
  description: 'Thème sombre moderne pour sessions prolongées',
  cssClass: 'dark',
  colors: {
    // Couleurs de base - Fond bleu-gris sombre
    background: '220 13% 18%',
    foreground: '220 9% 98%',

    // Surfaces - Légèrement plus claires que l'arrière-plan
    card: '220 13% 21%',
    cardForeground: '220 9% 98%',
    popover: '220 13% 21%',
    popoverForeground: '220 9% 98%',

    // Couleurs primaires - Bleu moderne plus lumineux
    primary: '217 91% 60%',
    primaryForeground: '220 13% 98%',

    // Couleurs secondaires - Gris moderne
    secondary: '220 13% 26%',
    secondaryForeground: '220 9% 98%',

    // Couleurs muettes - Entre background et card
    muted: '220 13% 26%',
    mutedForeground: '220 9% 78%',

    // Couleurs d'accent - Pour les survols
    accent: '220 13% 26%',
    accentForeground: '220 9% 98%',

    // Couleurs destructives - Rouge moderne
    destructive: '0 72% 51%',
    destructiveForeground: '220 13% 98%',

    // Interactions - Subtiles
    border: '220 13% 28%',
    input: '220 13% 28%',
    ring: '217 91% 60%',

    // Extensions TopSteel - Couleurs de statut adaptées
    success: '142 71% 45%',
    successForeground: '220 13% 98%',
    warning: '45 93% 58%',
    warningForeground: '220 13% 98%',
    info: '217 91% 60%',
    infoForeground: '220 13% 98%',
  },
}

export default darkTheme
