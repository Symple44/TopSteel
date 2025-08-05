/**
 * 🎨 THEME SWITCHER UNIFIÉ - TOPSTEEL ERP
 * Composant de commutation de thème connecté au provider unifié
 * Support des 3 thèmes : light, dark, vibrant + system
 */

import { ChevronDownIcon, MonitorIcon, MoonIcon, SparklesIcon, SunIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../primitives/dropdown'
import { type Theme, useTheme } from '../theme-provider'

// ===== TYPES =====

export interface ThemeSwitcherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variant du bouton
   * @default 'ghost'
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /**
   * Taille du bouton
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg' | 'icon'
  /**
   * Mode d'affichage
   * - 'toggle': Bouton simple qui cycle entre les thèmes
   * - 'dropdown': Menu déroulant avec tous les thèmes
   * @default 'dropdown'
   */
  mode?: 'toggle' | 'dropdown'
  /**
   * Afficher les labels des thèmes
   * @default true pour dropdown, false pour toggle
   */
  showLabels?: boolean
  /**
   * Afficher les icônes des thèmes
   * @default true
   */
  showIcons?: boolean
}

// ===== ICÔNES ET LABELS =====

const themeData: Record<Theme, { icon: React.ElementType; label: string; description?: string }> = {
  light: {
    icon: SunIcon,
    label: 'Clair',
    description: 'Thème clair classique',
  },
  dark: {
    icon: MoonIcon,
    label: 'Sombre',
    description: 'Thème sombre moderne',
  },
  vibrant: {
    icon: SparklesIcon,
    label: 'Vibrant',
    description: 'Thème vibrant TopSteel',
  },
  system: {
    icon: MonitorIcon,
    label: 'Système',
    description: 'Suivre les préférences système',
  },
}

// ===== COMPONENT =====

const ThemeSwitcher = React.forwardRef<HTMLButtonElement, ThemeSwitcherProps>(
  (
    {
      variant = 'ghost',
      size = 'default',
      mode = 'dropdown',
      showLabels,
      showIcons = true,
      className,
      ...props
    },
    ref
  ) => {
    const { theme, setTheme, themes, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Gestion SSR - éviter hydration mismatch
    React.useEffect(() => {
      setMounted(true)
    }, [])

    // Défaut showLabels basé sur le mode
    const shouldShowLabels = showLabels ?? mode === 'dropdown'

    // Fonction pour le mode toggle
    const toggleTheme = () => {
      const availableThemes = themes.filter((t) => t !== 'system')
      const currentIndex = availableThemes.indexOf(theme === 'system' ? resolvedTheme : theme)
      const nextIndex = (currentIndex + 1) % availableThemes.length
      setTheme(availableThemes[nextIndex])
    }

    // Données du thème actuel pour l'affichage
    const currentThemeData = themeData[theme] || themeData.light
    const CurrentIcon = currentThemeData.icon

    // Placeholder pendant hydration
    if (!mounted) {
      return (
        <Button ref={ref} variant={variant} size={size} className={className} disabled {...props}>
          {showIcons && <MoonIcon className="h-4 w-4" />}
          {shouldShowLabels && <span className="ml-2">Thème</span>}
        </Button>
      )
    }

    // Mode toggle simple
    if (mode === 'toggle') {
      return (
        <Button
          ref={ref}
          variant={variant}
          size={size}
          className={className}
          onClick={toggleTheme}
          title={`Thème actuel: ${currentThemeData.label}. Cliquer pour changer.`}
          {...props}
        >
          {showIcons && <CurrentIcon className="h-4 w-4" />}
          {shouldShowLabels && <span className="ml-2">{currentThemeData.label}</span>}
        </Button>
      )
    }

    // Mode dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn('gap-2', className)}
            {...props}
          >
            {showIcons && <CurrentIcon className="h-4 w-4" />}
            {shouldShowLabels && <span>{currentThemeData.label}</span>}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {themes.map((themeOption) => {
            const ThemeIcon = themeData[themeOption].icon
            const isActive = theme === themeOption

            return (
              <DropdownMenuItem
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={cn(
                  'gap-2 cursor-pointer',
                  isActive && 'bg-accent text-accent-foreground'
                )}
              >
                <ThemeIcon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{themeData[themeOption].label}</span>
                  {themeData[themeOption].description && (
                    <span className="text-xs text-muted-foreground">
                      {themeData[themeOption].description}
                    </span>
                  )}
                </div>
                {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

ThemeSwitcher.displayName = 'ThemeSwitcher'

export { ThemeSwitcher }
