# Guide de création de composants

Ce guide montre comment créer des composants dans le projet ERP Métallerie.

## Structure d'un composant

### Composant simple

```typescript
// src/components/features/projet-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Projet } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ProjetCardProps {
  projet: Projet
  onClick?: () => void
}

export function ProjetCard({ projet, onClick }: ProjetCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-shadow hover:shadow-md" 
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{projet.reference}</CardTitle>
          <Badge>{projet.statut}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          {projet.client.nom}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Montant HT</span>
            <span className="font-medium">
              {formatCurrency(projet.montantHT)}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Avancement</span>
              <span>{projet.avancement}%</span>
            </div>
            <Progress value={projet.avancement} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Composant avec état

```typescript
// src/components/features/projet-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProjet } from '@/hooks/use-projets'

const projetSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  dateDebut: z.date().optional(),
  dateFin: z.date().optional(),
})

type ProjetFormData = z.infer<typeof projetSchema>

export function ProjetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createProjet = useCreateProjet()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjetFormData>({
    resolver: zodResolver(projetSchema),
  })

  const onSubmit = async (data: ProjetFormData) => {
    setIsSubmitting(true)
    try {
      await createProjet.mutateAsync(data)
      reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
          placeholder="Description du projet"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">
            {errors.description.message}
          </p>
        )}
      </div>
      
      {/* Autres champs... */}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : 'Créer le projet'}
      </Button>
    </form>
  )
}
```

### Composant avec hooks personnalisés

```typescript
// src/components/features/stocks-alerts.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useStocksAlerts } from '@/hooks/use-stocks'
import { formatNumber } from '@/lib/utils'

export function StocksAlerts() {
  const { data: alerts, isLoading } = useStocksAlerts()
  
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Envoyer une notification
      new Notification('Alerte stock', {
        body: `${alerts.length} produits en stock critique`,
        icon: '/icon-192x192.png',
      })
    }
  }, [alerts])

  if (isLoading || !alerts || alerts.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Stock critique</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {alerts.map((stock) => (
            <li key={stock.id} className="text-sm">
              {stock.produit.designation} - 
              Stock: {formatNumber(stock.quantiteDisponible)} / 
              Min: {formatNumber(stock.quantiteMinimale)}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
```

## Conventions de nommage

### Fichiers et dossiers
- **Composants** : `kebab-case.tsx` (ex: `projet-card.tsx`)
- **Hooks** : `use-*.ts` (ex: `use-projets.ts`)
- **Types** : `PascalCase` dans `index.ts`
- **Services** : `*.service.ts` (ex: `projets.service.ts`)

### Composants
- **Nom du composant** : `PascalCase` (ex: `ProjetCard`)
- **Props interface** : `ComponentNameProps` (ex: `ProjetCardProps`)
- **Événements** : `onAction` (ex: `onClick`, `onSubmit`)

### Variables et fonctions
- **Variables** : `camelCase`
- **Constantes** : `UPPER_SNAKE_CASE`
- **Fonctions** : `camelCase`
- **Types/Interfaces** : `PascalCase`

## Organisation des imports

```typescript
// 1. Imports React/Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Imports de bibliothèques tierces
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// 3. Imports de composants UI
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 4. Imports de composants custom
import { ProjetCard } from '@/components/features/projet-card'

// 5. Imports de hooks
import { useProjets } from '@/hooks/use-projets'

// 6. Imports de services/utils
import { projetsService } from '@/services/projets.service'
import { formatCurrency } from '@/lib/utils'

// 7. Imports de types
import { Projet, ProjetStatut } from '@/types'

// 8. Imports de styles (si nécessaire)
import styles from './component.module.css'
```

## Tests (à implémenter)

```typescript
// src/components/features/__tests__/projet-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjetCard } from '../projet-card'
import { mockProjet } from '@/tests/mocks'

describe('ProjetCard', () => {
  it('affiche les informations du projet', () => {
    render(<ProjetCard projet={mockProjet} />)
    
    expect(screen.getByText(mockProjet.reference)).toBeInTheDocument()
    expect(screen.getByText(mockProjet.client.nom)).toBeInTheDocument()
  })

  it('appelle onClick quand on clique sur la carte', () => {
    const handleClick = jest.fn()
    render(<ProjetCard projet={mockProjet} onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('article'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Bonnes pratiques

1. **Composants purs** : Préférez les composants fonctionnels
2. **Props typées** : Toujours typer les props avec TypeScript
3. **Décomposition** : Un composant = une responsabilité
4. **Réutilisabilité** : Créez des composants génériques
5. **Performance** : Utilisez `React.memo` pour les composants lourds
6. **Accessibilité** : Ajoutez les attributs ARIA nécessaires
7. **Responsive** : Utilisez les classes Tailwind responsive

## Exemple complet : Modal de création

```typescript
// src/components/features/create-projet-modal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ProjetForm } from './projet-form'
import { useCreateProjet } from '@/hooks/use-projets'

export function CreateProjetModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const createProjet = useCreateProjet()

  const handleSuccess = (projet: Projet) => {
    setOpen(false)
    router.push(`/projets/${projet.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau projet de métallerie.
          </DialogDescription>
        </DialogHeader>
        <ProjetForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
```

---

Ce guide vous aidera à maintenir une cohérence dans la création de vos composants. N'hésitez pas à l'adapter selon les besoins spécifiques de votre projet.