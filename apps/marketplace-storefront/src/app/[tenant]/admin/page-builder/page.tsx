'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Eye, Edit, Copy, Trash2 } from 'lucide-react'
import { marketplaceApi } from '@/lib/api/client'

export default function PageBuilderListPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['pageTemplates'],
    queryFn: async () => {
      const response = await marketplaceApi.get('/page-builder/templates')
      return (response as any).data
    }
  })

  const filteredTemplates = templates?.filter((template: any) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      try {
        await marketplaceApi.delete(`/page-builder/templates/${id}`)
        refetch()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleDuplicate = async (template: any) => {
    const newName = prompt('Nom du nouveau template:', `${template.name} (copie)`)
    const newSlug = prompt('Slug du nouveau template:', `${template.slug}-copy`)
    
    if (newName && newSlug) {
      try {
        await marketplaceApi.post(`/page-builder/templates/${template.id}/duplicate`, {
          name: newName,
          slug: newSlug
        })
        refetch()
      } catch (error) {
        console.error('Erreur lors de la duplication:', error)
      }
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await marketplaceApi.post(`/page-builder/templates/${id}/publish`)
      refetch()
    } catch (error) {
      console.error('Erreur lors de la publication:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de pages</h1>
          <p className="text-gray-600 mt-2">
            Créez et gérez les pages de votre marketplace
          </p>
        </div>
        
        <Link
          href="/admin/page-builder/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle page
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher une page..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md"
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">Aucune page trouvée</h3>
          <p className="text-gray-600 mb-6">
            Commencez par créer votre première page personnalisée
          </p>
          <Link
            href="/admin/page-builder/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Créer une page
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template: any) => (
            <div
              key={template.id}
              className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        template.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : template.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.status === 'published' ? 'Publié' : 
                       template.status === 'draft' ? 'Brouillon' : template.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">
                    Slug: /{template.slug}
                  </p>
                  
                  {template.description && (
                    <p className="text-gray-600 mb-2">{template.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Type: {template.pageType}</span>
                    <span>Sections: {template.sections?.length || 0}</span>
                    <span>Version: {template.version}</span>
                    <span>
                      Modifié: {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${template.slug}`}
                    target="_blank"
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Prévisualiser"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  
                  <Link
                    href={`/admin/page-builder/${template.id}`}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Éditer"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  {template.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(template.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Publier
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}