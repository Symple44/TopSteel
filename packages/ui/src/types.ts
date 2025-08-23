// Re-export all component types for better TypeScript resolution
export type { ButtonProps } from './components/primitives/button/Button'
export type { BadgeProps } from './components/data-display/badge/Badge'
export type { 
  CardProps,
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardTitleProps,
} from './components/layout/card/Card'

// Re-export components with proper typing
export { Button } from './components/primitives/button/Button'
export { Badge } from './components/data-display/badge/Badge'
export { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/layout/card/Card'