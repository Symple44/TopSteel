'use client'

import { useState } from 'react'
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  File,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { Projet} from '@/types';
import { TypeDocument } from '@/types'

interface ProjetDocumentsTabProps {
  projet: Projet
}

// Données mockées pour la démonstration
const mockDocuments = [
  {
    id: '1',
    nom: 'Plan de structure métallique.pdf',
    type: TypeDocument.PLAN,
    url: '#',
    taille: 2457600, // 2.4 MB
    uploadePar: 'Jean Dupont',
    createdAt: new Date('2025-06-15T10:30:00'),
  },
  {
    id: '2',
    nom: 'Devis initial.pdf',
    type: TypeDocument.DEVIS,
    url: '#',
    taille: 524288, // 512 KB
    uploadePar: 'Marie Martin',
    createdAt: new Date('2025-06-14T14:20:00'),
  },
  {
    id: '3',
    nom: 'Photos chantier - Avant travaux.zip',
    type: TypeDocument.PHOTO,
    url: '#',
    taille: 15728640, // 15 MB
    uploadePar: 'Pierre Durand',
    createdAt: new Date('2025-06-16T09:00:00'),
  },
  {
    id: '4',
    nom: 'Bon de commande matériaux.pdf',
    type: TypeDocument.BON_COMMANDE,
    url: '#',
    taille: 312000, // 305 KB
    uploadePar: 'Jean Dupont',
    createdAt: new Date('2025-06-17T11:45:00'),
  },
  {
    id: '5',
    nom: 'Note de calcul structure.xlsx',
    type: TypeDocument.AUTRE,
    url: '#',
    taille: 892928, // 872 KB
    uploadePar: 'Marc Leblanc',
    createdAt: new Date('2025-06-18T16:30:00'),
  },
]

export function ProjetDocumentsTab({ projet }: ProjetDocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('tous')
  const [isUploading, setIsUploading] = useState(false)

  const getDocumentIcon = (type: TypeDocument) => {
    switch (type) {
      case TypeDocument.PLAN:
        return <FileText className="h-8 w-8 text-blue-500" />
      case TypeDocument.PHOTO:
        return <Image className="h-8 w-8 text-green-500" />
      case TypeDocument.DEVIS:
      case TypeDocument.FACTURE:
      case TypeDocument.BON_COMMANDE:
      case TypeDocument.BON_LIVRAISON:
        return <FileText className="h-8 w-8 text-orange-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const getTypeBadge = (type: TypeDocument) => {
    const typeLabels = {
      [TypeDocument.PLAN]: 'Plan',
      [TypeDocument.DEVIS]: 'Devis',
      [TypeDocument.FACTURE]: 'Facture',
      [TypeDocument.BON_COMMANDE]: 'Bon de commande',
      [TypeDocument.BON_LIVRAISON]: 'Bon de livraison',
      [TypeDocument.PHOTO]: 'Photo',
      [TypeDocument.AUTRE]: 'Autre',
    }
    
    return <Badge variant="outline">{typeLabels[type]}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchSearch = doc.nom.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === 'tous' || doc.type === filterType
    return matchSearch && matchType
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setIsUploading(true)
      // Simulation d'upload
      setTimeout(() => {
        setIsUploading(false)
        // Ici, appeler l'API pour uploader le fichier
      }, 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Documents du projet</CardTitle>
              <CardDescription>
                Gérez tous les documents liés au projet
              </CardDescription>
            </div>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />
              <Button asChild disabled={isUploading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Upload en cours...' : 'Uploader des documents'}
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue /><SelectTrigger><SelectValue  /><SelectTrigger><SelectValue placeholder="Type de document" /></SelectTrigger></SelectTrigger>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value={TypeDocument.PLAN}>Plans</SelectItem>
                <SelectItem value={TypeDocument.DEVIS}>Devis</SelectItem>
                <SelectItem value={TypeDocument.FACTURE}>Factures</SelectItem>
                <SelectItem value={TypeDocument.BON_COMMANDE}>Bons de commande</SelectItem>
                <SelectItem value={TypeDocument.BON_LIVRAISON}>Bons de livraison</SelectItem>
                <SelectItem value={TypeDocument.PHOTO}>Photos</SelectItem>
                <SelectItem value={TypeDocument.AUTRE}>Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grille de documents */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                {getDocumentIcon(document.type)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Prévisualiser
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm truncate" title={document.nom}>
                  {document.nom}
                </h4>
                <div className="flex items-center gap-2">
                  {getTypeBadge(document.type)}
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.taille)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Ajouté par {document.uploadePar}</p>
                  <p>{formatDate(document.createdAt, 'time')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucun document trouvé</p>
            <p className="text-sm text-muted-foreground">
              Modifiez vos filtres ou uploadez un nouveau document
            </p>
          </CardContent>
        </Card>
      )}

      {/* Zone de drag & drop */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Glissez vos fichiers ici</p>
          <p className="text-sm text-muted-foreground mb-4">
            ou cliquez sur le bouton "Uploader des documents"
          </p>
          <p className="text-xs text-muted-foreground">
            Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP
          </p>
          <p className="text-xs text-muted-foreground">
            Taille maximale : 50 MB par fichier
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
