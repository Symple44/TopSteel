'use client'

export const dynamic = 'force-dynamic'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'
import { Database, FileSearch, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../../../lib/i18n/hooks'
import { callClientApi } from '../../../utils/backend-api'

interface QueryBuilderItem {
  id: string
  name: string
  description?: string
  mainTable?: string
  createdAt: string
  updatedAt: string
}

export default function QueryBuilderPage() {
  const router = useRouter()
  const { t } = useTranslation('queryBuilder')
  const [loading, setLoading] = useState(true)
  const [queryBuilders, setQueryBuilders] = useState<QueryBuilderItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchQueryBuilders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await callClientApi('query-builder')
      if (response?.ok) {
        const data = await response.json()
        // Handle both array response and { data: [] } response
        const items = Array.isArray(data) ? data : data?.data || []
        setQueryBuilders(items)
      } else {
        setError('Failed to load query builders')
      }
    } catch (err) {
      console.error('Error fetching query builders:', err)
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueryBuilders()
  }, [fetchQueryBuilders])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }
    try {
      const response = await callClientApi(`query-builder/${id}`, {
        method: 'DELETE',
      })
      if (response?.ok) {
        setQueryBuilders((prev) => prev.filter((qb) => qb.id !== id))
      }
    } catch (err) {
      console.error('Error deleting query builder:', err)
    }
  }

  const handleCreateNew = () => {
    router.push('/query-builder/new')
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('selectOrCreate')}</p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nouveau Query Builder
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchQueryBuilders}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : queryBuilders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Database className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun Query Builder</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Créez votre premier Query Builder pour analyser vos données,
              faire des jointures et ajouter des boutons d'action.
            </p>
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Créer mon premier Query Builder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queryBuilders.map((qb) => (
            <Card key={qb.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{qb.name}</CardTitle>
                    {qb.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {qb.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(qb.id, qb.name)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Database className="h-4 w-4" />
                  <span>{qb.mainTable || 'Aucune table'}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/query-builder/${qb.id}`}>
                      <FileSearch className="h-4 w-4 mr-2" />
                      Modifier
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Card pour créer un nouveau */}
          <Card
            className="border-dashed cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
            onClick={handleCreateNew}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <Plus className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <span className="text-muted-foreground font-medium">
                Nouveau Query Builder
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
