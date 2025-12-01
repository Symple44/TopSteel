/**
 * Light Theme - TopSteel Design System
 * Thème clair professionnel
 */

import type { ThemeConfig } from './types'

export const lightTheme: ThemeConfig = {
  name: 'light',
  displayName: 'Clair',
  description: 'Thème clair classique pour usage professionnel',
  cssClass: 'light',
  colors: {
    // Couleurs de base - Fond blanc pur
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',

    // Surfaces - Cartes et popovers
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',

    // Couleurs primaires - Bleu acier TopSteel
    primary: '217 91% 45%',
    primaryForeground: '220 13% 98%',

    // Couleurs secondaires - Gris clair
    secondary: '210 40% 96%',
    secondaryForeground: '222.2 84% 4.9%',

    // Couleurs muettes - Pour texte secondaire
    muted: '210 40% 96%',
    mutedForeground: '215.4 16.3% 46.9%',

    // Couleurs d'accent - Pour hover et interactions
    accent: '210 40% 96%',
    accentForeground: '222.2 84% 4.9%',

    // Couleurs destructives - Rouge pour actions dangereuses
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',

    // Interactions - Bordures et inputs
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',

    // Extensions TopSteel - Couleurs de statut
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '45 93% 47%',
    warningForeground: '0 0% 100%',
    info: '217 91% 60%',
    infoForeground: '0 0% 100%',
  },
}

export default lightTheme
