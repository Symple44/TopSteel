'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Menu, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface AddToMenuButtonProps {
  queryBuilderId: string
  queryBuilderName: string
  onAddedToMenu?: () => void
}

const iconOptions = [
  { value: 'BarChart3', label: '📊 Graphique à barres' },
  { value: 'PieChart', label: '🥧 Graphique circulaire' },
  { value: 'LineChart', label: '📈 Graphique linéaire' },
  { value: 'Table', label: '📋 Tableau' },
  { value: 'Database', label: '🗄️ Base de données' },
  { value: 'TrendingUp', label: '📈 Tendance' },
  { value: 'Activity', label: '📊 Activité' },
  { value: 'FileBarChart', label: '📊 Rapport' }
]

export function AddToMenuButton({ 
  queryBuilderId, 
  queryBuilderName, 
  onAddedToMenu 
}: AddToMenuButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: queryBuilderName,
    icon: 'BarChart3'
  })

  const handleAddToMenu = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // D'abord, préparer les données pour le menu
      const menuData = await apiClient.post(`/query-builder/${queryBuilderId}/add-to-menu`, {
        title: formData.title,
        icon: formData.icon
      })

      // Ensuite, ajouter au menu personnel de l'utilisateur
      await apiClient.post('/admin/menus/user-data-view', {
        queryBuilderId: menuData.data.queryBuilderId,
        title: menuData.data.title,
        icon: menuData.data.icon
      })

      toast({
        title: 'Succès',
        description: 'La vue a été ajoutée à votre menu personnel',
      })

      setOpen(false)
      onAddedToMenu?.()

      // Déclencher un rafraîchissement du menu
      window.dispatchEvent(new CustomEvent('menuPreferencesChanged'))

    } catch (error: any) {
      console.error('Erreur lors de l\'ajout au menu:', error)
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'ajouter la vue au menu',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="h-4 w-4 mr-2" />
          Ajouter au Menu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter au Menu Personnel</DialogTitle>
          <DialogDescription>
            Ajoutez cette vue à votre menu personnel pour un accès rapide.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Titre
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="col-span-3"
              placeholder="Nom dans le menu"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icône
            </Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleAddToMenu} disabled={loading}>
            {loading ? (
              <>
                <Plus className="h-4 w-4 mr-2 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}