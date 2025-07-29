'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { QueryBuilderInterface } from '@/components/query-builder/query-builder-interface'
import { Loader2 } from 'lucide-react'
import { callClientApi } from '@/utils/backend-api'

export default function QueryBuilderDetailPage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [queryBuilder, setQueryBuilder] = useState(null)

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchQueryBuilder(params.id as string)
    } else {
      setLoading(false)
    }
  }, [params.id])

  const fetchQueryBuilder = async (id: string) => {
    try {
      const response = await callClientApi(`query-builder/${id}`)
      if (response.ok) {
        const data = await response.json()
        setQueryBuilder(data)
      }
    } catch (error) {
      console.error('Failed to fetch query builder:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <QueryBuilderInterface
      queryBuilderId={params.id as string}
      initialData={queryBuilder}
    />
  )
}