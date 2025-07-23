'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Database, Lock, Unlock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QueryBuilder {
  id: string
  name: string
  description?: string
  database: string
  table: string
  isPublic: boolean
  maxRows: number | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export function QueryBuilderSidebar() {
  const router = useRouter()
  const [queryBuilders, setQueryBuilders] = useState<QueryBuilder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueryBuilders()
  }, [])

  const fetchQueryBuilders = async () => {
    try {
      const response = await fetch('/api/query-builder')
      if (response.ok) {
        const result = await response.json()
        // Assurer que nous avons bien un tableau
        const data = Array.isArray(result) ? result : result.data || result.queryBuilders || []
        setQueryBuilders(data)
      }
    } catch (error) {
      console.error('Failed to fetch query builders:', error)
      setQueryBuilders([]) // Fallback vers tableau vide en cas d'erreur
    } finally {
      setLoading(false)
    }
  }

  const filteredQueryBuilders = Array.isArray(queryBuilders) 
    ? queryBuilders.filter(qb =>
        qb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qb.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const handleSelect = (id: string) => {
    setSelectedId(id)
    router.push(`/query-builder/${id}`)
  }

  const handleCreate = () => {
    router.push('/query-builder/new')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Query Builders</h2>
        <Button
          onClick={handleCreate}
          className="w-full mb-4"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Query Builder
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredQueryBuilders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun Query Builder créé'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQueryBuilders.map((qb) => (
                <div
                  key={qb.id}
                  onClick={() => handleSelect(qb.id)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedId === qb.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium truncate flex-1">{qb.name}</h3>
                    {qb.isPublic ? (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {qb.description && (
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {qb.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      {qb.database}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {qb.table}
                    </Badge>
                  </div>
                  {qb.maxRows && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        Max: {qb.maxRows} lignes
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}