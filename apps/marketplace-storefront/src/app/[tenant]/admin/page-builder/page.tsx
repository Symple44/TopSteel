'use client'

import { useQuery } from '@tanstack/react-query'
import { Copy, Edit, Eye, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { marketplaceApi } from '@/lib/api/client'

export default function PageBuilderListPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: templates,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['pageTemplates'],
    queryFn: async () => {
      const response = await marketplaceApi.get('/page-builder/templates')
      return (response as { data: unknown }).data
    },
  })

  const filteredTemplates =
    (templates as any)?.filter((template: unknown) => {
      const t = template as { name: string; slug: string }
      return (
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }) || []

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      try {
        await marketplaceApi.delete(`/page-builder/templates/${id}`)
        refetch()
      } catch (_error) {}
    }
  }

  const handleDuplicate = async (template: unknown) => {
    const t = template as { name: string; slug: string; id: string }
    const newName = prompt('Nom du nouveau template:', `${t.name} (copie)`)
    const newSlug = prompt('Slug du nouveau template:', `${t.slug}-copy`)

    if (newName && newSlug) {
      try {
        await marketplaceApi.post(`/page-builder/templates/${t.id}/duplicate`, {
          name: newName,
          slug: newSlug,
        })
        refetch()
      } catch (_error) {}
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await marketplaceApi.post(`/page-builder/templates/${id}/publish`)
      refetch()
    } catch (_error) {}
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={`page-builder-skeleton-template-${Date.now()}-${i}`}
                className="h-24 bg-gray-200 rounded"
              ></div>
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
          <p className="text-gray-600 mt-2">Créez et gérez les pages de votre marketplace</p>
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
          {filteredTemplates.map((template: unknown) => {
            const t = template as {
              id: string
              name: string
              slug: string
              status: string
              description?: string
              pageType: string
              sections?: unknown[]
              version: string
              updatedAt: string
            }
            return (
              <div
                key={t.id}
                className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{t.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          t.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : t.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t.status === 'published'
                          ? 'Publié'
                          : t.status === 'draft'
                            ? 'Brouillon'
                            : t.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-2">Slug: /{t.slug}</p>

                    {t.description && <p className="text-gray-600 mb-2">{t.description}</p>}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Type: {t.pageType}</span>
                      <span>Sections: {t.sections?.length || 0}</span>
                      <span>Version: {t.version}</span>
                      <span>Modifié: {new Date(t.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${t.slug}`}
                      target="_blank"
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Prévisualiser"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/admin/page-builder/${t.id}`}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Éditer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {t.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handlePublish(t.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Publier
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
