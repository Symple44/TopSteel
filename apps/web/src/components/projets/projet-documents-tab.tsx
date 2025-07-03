'use client'


interface ProjetDocumentsTabProps { 
  projet?: any 
  projetId?: string
}

import { Input } from "@/components/ui/input"
import {
import { useBusinessMetrics } from '@/lib/monitoring/business-metrics'
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@erp/ui'
import { Download, Edit, Eye, File, FileText, Image, Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'

interface Document {
  id: string
  nom: string
  type: 'PDF' | 'Image' | 'CAD' | 'Excel' | 'Word'
  taille: string
  dateAjout: string
  auteur: string
  categorie: 'Plan' | 'Photo' | 'Facture' | 'Devis' | 'Rapport' | 'Autre'
  url: string
}

const mockDocuments: Document[] = [
  {
    id: '1',
    nom: 'Plan_Hangar_A_v2.pdf',
    type: 'PDF',
    taille: '2.4 MB',
    dateAjout: '2024-03-15',
    auteur: 'Pierre Martin',
    categorie: 'Plan',
    url: '/documents/plan_hangar_a_v2.pdf'
  },
  {
    id: '2',
    nom: 'Photo_chantier_001.jpg',
    type: 'Image',
    taille: '1.8 MB',
    dateAjout: '2024-03-14',
    auteur: 'Jean Dupuis',
    categorie: 'Photo',
    url: '/documents/photo_chantier_001.jpg'
  },
  {
    id: '3',
    nom: 'Devis_materiaux.xlsx',
    type: 'Excel',
    taille: '542 KB',
    dateAjout: '2024-03-13',
    auteur: 'Marie Claire',
    categorie: 'Devis',
    url: '/documents/devis_materiaux.xlsx'
  },
  {
    id: '4',
    nom: 'Rapport_controle_qualite.docx',
    type: 'Word',
    taille: '1.2 MB',
    dateAjout: '2024-03-12',
    auteur: 'Pierre Martin',
    categorie: 'Rapport',
    url: '/documents/rapport_controle_qualite.docx'
  },
  {
    id: '5',
    nom: 'Structure_3D.dwg',
    type: 'CAD',
    taille: '5.1 MB',
    dateAjout: '2024-03-11',
    auteur: 'Jean Dupuis',
    categorie: 'Plan',
    url: '/documents/structure_3d.dwg'
  }
]

export function ProjetDocumentsTab({ projet }: ProjetDocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [filterCategorie, setFilterCategorie] = useState('toutes')
  const [isUploading, setIsUploading] = useState(false)

  const filteredDocuments = mockDocuments.filter(document => {
    const matchesSearch = document.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.auteur.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'tous' || document.type === filterType
    const matchesCategorie = filterCategorie === 'toutes' || document.categorie === filterCategorie
    
    return matchesSearch && matchesType && matchesCategorie
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'Image':
        return <Image className="h-5 w-5 text-green-500" />
      case 'CAD':
        return <File className="h-5 w-5 text-blue-500" />
      case 'Excel':
        return <FileText className="h-5 w-5 text-green-600" />
      case 'Word':
        return <FileText className="h-5 w-5 text-blue-600" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  // ✅ FIX: Mapping strict avec Record et fonction helper avec fallback
  const getCategorieBadge = (categorie: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'Plan': 'default',
      'Photo': 'secondary',
      'Facture': 'outline',
      'Devis': 'outline',
      'Rapport': 'secondary',
      'Autre': 'outline'
    }
    
    // ✅ FIX: Utilisation sécurisée avec fallback
    const variant = variants[categorie] || 'outline'
    return <Badge variant={variant}>{categorie}</Badge>
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setIsUploading(true)
      // Simulation d'upload
      setTimeout(() => {
        setIsUploading(false)
        console.log('Fichier(s) uploadé(s):', files)
      }, 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents du Projet</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Télécharger Tout
          </Button>
          <label htmlFor="file-upload">
            <Button disabled={isUploading} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Upload en cours...' : 'Ajouter Document'}
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.dwg,.xlsx,.docx"
          />
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm((e.target as HTMLInputElement | HTMLTextAreaElement).value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous types</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="Image">Images</SelectItem>
            <SelectItem value="CAD">CAD</SelectItem>
            <SelectItem value="Excel">Excel</SelectItem>
            <SelectItem value="Word">Word</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategorie} onValueChange={setFilterCategorie}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes</SelectItem>
            <SelectItem value="Plan">Plan</SelectItem>
            <SelectItem value="Photo">Photo</SelectItem>
            <SelectItem value="Facture">Facture</SelectItem>
            <SelectItem value="Devis">Devis</SelectItem>
            <SelectItem value="Rapport">Rapport</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.nom}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{document.taille}</span>
                      <span>•</span>
                      <span>Ajouté le {new Date(document.dateAjout).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Par {document.auteur}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* ✅ FIX: Utilisation de la fonction helper sécurisée */}
                    {getCategorieBadge(document.categorie)}
                    <Badge variant="outline">{document.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun document trouvé</p>
              <p className="text-sm">Essayez de modifier vos filtres</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques des Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['PDF', 'Image', 'CAD', 'Excel', 'Word'].map((type) => (
              <div key={type} className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">
                  {mockDocuments.filter(doc => doc.type === type).length}
                </div>
                <div className="text-sm text-gray-500">{type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
