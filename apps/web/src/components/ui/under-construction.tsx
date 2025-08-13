import { Construction } from 'lucide-react'

interface UnderConstructionProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function UnderConstruction({
  title,
  description = 'Cette fonctionnalité sera bientôt disponible',
  icon: Icon = Construction,
}: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center space-y-4 max-w-md">
        <Icon className="h-16 w-16 text-muted-foreground mx-auto animate-pulse" />
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-lg">{description}</p>
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Nous travaillons activement sur cette fonctionnalité. Elle sera disponible
            prochainement.
          </p>
        </div>
      </div>
    </div>
  )
}
