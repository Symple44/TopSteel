'use client'

import { Badge } from "@erp/ui"
import { Button } from "@erp/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui"
import { Input } from "@erp/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@erp/ui"
import { Download, Edit, Eye, File, FileText, Image, Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'

interface ProjetDocumentsTabProps {
  projet?: any
  projetId?: string
}

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
    url: '/documents/plan_hangar_a_v2.pdf',
  },
  {
    id: '2',
    nom: 'Photo_chantier_001.jpg',
    type: 'Image',
    taille: '1.8 MB',
    dateAjout: '2024-03-14',
    auteur: 'Jean Dupuis',
    categorie: 'Photo',
    url: '/documents/photo_chantier_001.jpg',
  },
  {
    id: '3',
    nom: 'Devis_materiaux.xlsx',
    type: 'Excel',
    taille: '542 KB',
    dateAjout: '2024-03-13',
    auteur: 'Marie Claire',
    categorie: 'Devis',
    url: '/documents/devis_materiaux.xlsx',
  },
  {
    id: '4',
    nom: 'Rapport_controle_qualite.docx',
    type: 'Word',
    taille: '1.2 MB',
    dateAjout: '2024-03-12',
    auteur: 'Alain Dubois',
    categorie: 'Rapport',
    url: '/documents/rapport_controle_qualite.docx',
  },
]

export function ProjetDocumentsTab({ projet, projetId }: ProjetDocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('tous')
  const [selectedType, setSelectedType] = useState<string>('tous')

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'Image':
        return <Image className="h-4 w-4 text-blue-500" />
      case 'Excel':
        return <File className="h-4 w-4 text-green-500" />
      case 'Word':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'CAD':
        return <File className="h-4 w-4 text-orange-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      PDF: 'bg-red-100 text-red-800',
      Image: 'bg-blue-100 text-blue-800',
      Excel: 'bg-green-100 text-green-800',
      Word: 'bg-blue-100 text-blue-800',
      CAD: 'bg-orange-100 text-orange-800',
    }

    return (
      <Badge className={`${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </Badge>
    )
  }

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch =
      doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.auteur.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'tous' || doc.categorie === selectedCategory
    const matchesType = selectedType === 'tous' || doc.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  const handleDownload = (document: Document) => {
    // Simulation du téléchargement
    console.log('Téléchargement:', document.nom)
  }

  const handleView = (document: Document) => {
    // Simulation de l'aperçu
    console.log('Aperçu:', document.nom)
  }

  const handleEdit = (document: Document) => {
    // Simulation de l'édition
    console.log('Édition:', document.nom)
  }

  const handleDelete = (document: Document) => {
    // Simulation de la suppression
    console.log('Suppression:', document.nom)
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Documents du projet</h3>
          <p className="text-sm text-muted-foreground">Gérez tous les documents liés à ce projet</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Ajouter des fichiers
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom ou auteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes catégories</SelectItem>
                <SelectItem value="Plan">Plans</SelectItem>
                <SelectItem value="Photo">Photos</SelectItem>
                <SelectItem value="Facture">Factures</SelectItem>
                <SelectItem value="Devis">Devis</SelectItem>
                <SelectItem value="Rapport">Rapports</SelectItem>
                <SelectItem value="Autre">Autres</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous types</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Image">Images</SelectItem>
                <SelectItem value="Excel">Excel</SelectItem>
                <SelectItem value="Word">Word</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mockDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Documents total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mockDocuments.filter((d) => d.type === 'PDF').length}
            </div>
            <p className="text-xs text-muted-foreground">Documents PDF</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mockDocuments.filter((d) => d.type === 'Image').length}
            </div>
            <p className="text-xs text-muted-foreground">Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mockDocuments
                .reduce((acc, doc) => {
                  const size = Number.parseFloat(doc.taille.replace(/[^\d.]/g, ''))

                  return acc + size
                }, 0)
                .toFixed(1)}{' '}
              MB
            </div>
            <p className="text-xs text-muted-foreground">Taille totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun document trouvé</p>
              <p className="text-sm text-gray-400">
                {searchTerm || selectedCategory !== 'tous' || selectedType !== 'tous'
                  ? 'Essayez de modifier vos filtres'
                  : 'Ajoutez des documents pour ce projet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(document.type)}
                    <div>
                      <div className="font-medium">{document.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        Par {document.auteur} • {document.dateAjout} • {document.taille}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getTypeBadge(document.type)}
                    <Badge variant="outline">{document.categorie}</Badge>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(document)}
                        title="Aperçu"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(document)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document)}
                        title="Supprimer"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




