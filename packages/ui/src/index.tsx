// packages/ui/src/index.ts
// Index temporaire pour faire fonctionner les tests

// Export d'un composant simple pour valider la configuration
export const Button = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
  return <button onClick={onClick}>{children}</button>
}

// Export d'un type pour valider TypeScript
export type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

// Export d'une fonction utilitaire
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
